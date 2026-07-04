// Build a similarity graph from writing posts. Edges combine intentional
// signal (author-declared relatedWriting, shared tags) with inferred signal
// (title + description + body keyword overlap). Each node keeps its strongest
// few connections so the layout stays legible.

import { getKeywords as extractKeywords } from './textKeywords';

export function getKeywords(text: string): Set<string> {
  return extractKeywords(text, { minWordLength: 4 });
}

const graphKeywords = (text: string) => extractKeywords(text, { minWordLength: 4 });

export type GraphNode = {
  id: string;
  title: string;
  url: string;
  tags: string[];
  degree: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
  /** Why these posts are linked — used for tooltips in the graph UI. */
  reasons: string[];
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type PostInput = {
  id: string;
  data: {
    title: string;
    description?: string;
    tags?: string[];
    relatedWriting?: string[];
  };
  /** Optional body text for richer keyword overlap. */
  body?: string;
};

const TAG_WEIGHT = 4;
const KEYWORD_WEIGHT = 1;
const RELATED_WEIGHT = 12;
const MULTI_TAG_BONUS = 2;
const MAX_EDGES_PER_NODE = 5;
const BODY_SNIPPET_CHARS = 2000;

function normalizeTags(tags: string[] | undefined): Set<string> {
  return new Set((tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean));
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function keywordText(post: PostInput): string {
  const bodySnippet = post.body?.slice(0, BODY_SNIPPET_CHARS) ?? '';
  return `${post.data.title} ${post.data.description ?? ''} ${bodySnippet}`;
}

export function buildGraph(posts: PostInput[]): Graph {
  const postIds = new Set(posts.map((p) => p.id));
  const keywordCache = new Map<string, Set<string>>();
  const tagCache = new Map<string, Set<string>>();

  for (const post of posts) {
    keywordCache.set(post.id, graphKeywords(keywordText(post)));
    tagCache.set(post.id, normalizeTags(post.data.tags));
  }

  type EdgeAccum = { weight: number; reasons: Set<string> };
  const edgeMap = new Map<string, EdgeAccum>();

  function addEdge(a: string, b: string, weight: number, reason: string) {
    if (a === b) return;
    const key = pairKey(a, b);
    const existing = edgeMap.get(key);
    if (existing) {
      existing.weight += weight;
      existing.reasons.add(reason);
    } else {
      edgeMap.set(key, { weight, reasons: new Set([reason]) });
    }
  }

  // Author-declared related posts — strongest signal.
  for (const post of posts) {
    for (const relatedId of post.data.relatedWriting ?? []) {
      if (!postIds.has(relatedId)) continue;
      addEdge(post.id, relatedId, RELATED_WEIGHT, 'related');
    }
  }

  // Pairwise tag + keyword overlap.
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const a = posts[i];
      const b = posts[j];
      const aTags = tagCache.get(a.id)!;
      const bTags = tagCache.get(b.id)!;
      const sharedTagList: string[] = [];
      for (const t of aTags) if (bTags.has(t)) sharedTagList.push(t);

      const aKw = keywordCache.get(a.id)!;
      const bKw = keywordCache.get(b.id)!;
      let sharedKw = 0;
      for (const k of aKw) if (bKw.has(k)) sharedKw++;

      if (sharedTagList.length === 0 && sharedKw === 0) continue;

      let weight = sharedTagList.length * TAG_WEIGHT;
      if (sharedTagList.length > 1) {
        weight += (sharedTagList.length - 1) * MULTI_TAG_BONUS;
      }
      weight += sharedKw * KEYWORD_WEIGHT;

      if (sharedTagList.length > 0) {
        addEdge(a.id, b.id, weight, `tags: ${sharedTagList.join(', ')}`);
      } else {
        addEdge(a.id, b.id, weight, 'keywords');
      }
    }
  }

  // Per node, keep top-N edges by weight.
  const candidatesByNode = new Map<string, { other: string; weight: number; reasons: Set<string> }[]>();
  for (const post of posts) candidatesByNode.set(post.id, []);

  for (const [key, accum] of edgeMap) {
    const [a, b] = key.split('::');
    candidatesByNode.get(a)!.push({ other: b, weight: accum.weight, reasons: accum.reasons });
    candidatesByNode.get(b)!.push({ other: a, weight: accum.weight, reasons: accum.reasons });
  }

  const edgeKeySet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const post of posts) {
    const list = candidatesByNode.get(post.id)!;
    list.sort((x, y) => y.weight - x.weight);
    for (const cand of list.slice(0, MAX_EDGES_PER_NODE)) {
      const key = pairKey(post.id, cand.other);
      if (edgeKeySet.has(key)) continue;
      edgeKeySet.add(key);
      const accum = edgeMap.get(key)!;
      edges.push({
        source: key.split('::')[0],
        target: key.split('::')[1],
        weight: accum.weight,
        reasons: [...accum.reasons],
      });
    }
  }

  const degreeMap = new Map<string, number>();
  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }

  const nodes: GraphNode[] = posts.map((p) => ({
    id: p.id,
    title: p.data.title,
    url: `/writing/${p.id}`,
    tags: p.data.tags ?? [],
    degree: degreeMap.get(p.id) ?? 0,
  }));

  return { nodes, edges };
}
