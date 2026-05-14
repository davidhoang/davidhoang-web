// Build a similarity graph from writing posts. Edges combine intentional
// signal (shared tags) with inferred signal (title+description keyword
// overlap). Each node keeps its strongest few connections so the layout
// stays legible — full pairwise edges produce a hairball.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'is', 'it', 'its', 'with', 'as', 'by', 'from', 'that', 'this', 'was', 'are',
  'be', 'has', 'had', 'have', 'not', 'what', 'how', 'you', 'your', 'we', 'our',
  'so', 'if', 'do', 'does', 'than', 'then', 'into', 'about', 'over', 'they',
  'them', 'their', 'these', 'those', 'will', 'can', 'may', 'just', 'also',
]);

export function getKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

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
  };
};

const TAG_WEIGHT = 3;
const KEYWORD_WEIGHT = 1;
const MAX_EDGES_PER_NODE = 3;

export function buildGraph(posts: PostInput[]): Graph {
  const keywordCache = new Map<string, Set<string>>();
  const tagCache = new Map<string, Set<string>>();
  for (const post of posts) {
    const text = `${post.data.title} ${post.data.description ?? ''}`;
    keywordCache.set(post.id, getKeywords(text));
    tagCache.set(post.id, new Set(post.data.tags ?? []));
  }

  type Candidate = { other: string; weight: number };
  const candidatesByNode = new Map<string, Candidate[]>();
  for (const post of posts) candidatesByNode.set(post.id, []);

  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const a = posts[i];
      const b = posts[j];
      const aTags = tagCache.get(a.id)!;
      const bTags = tagCache.get(b.id)!;
      let sharedTags = 0;
      for (const t of aTags) if (bTags.has(t)) sharedTags++;

      const aKw = keywordCache.get(a.id)!;
      const bKw = keywordCache.get(b.id)!;
      let sharedKw = 0;
      for (const k of aKw) if (bKw.has(k)) sharedKw++;

      const weight = sharedTags * TAG_WEIGHT + sharedKw * KEYWORD_WEIGHT;
      if (weight <= 0) continue;

      candidatesByNode.get(a.id)!.push({ other: b.id, weight });
      candidatesByNode.get(b.id)!.push({ other: a.id, weight });
    }
  }

  // Keep top-N edges per node, then dedupe pairs.
  const edgeKeySet = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const post of posts) {
    const list = candidatesByNode.get(post.id)!;
    list.sort((x, y) => y.weight - x.weight);
    for (const cand of list.slice(0, MAX_EDGES_PER_NODE)) {
      const [s, t] = post.id < cand.other ? [post.id, cand.other] : [cand.other, post.id];
      const key = `${s}::${t}`;
      if (edgeKeySet.has(key)) continue;
      edgeKeySet.add(key);
      edges.push({ source: s, target: t, weight: cand.weight });
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
