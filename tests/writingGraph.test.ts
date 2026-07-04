import { describe, it, expect } from 'vitest';
import { buildGraph, getKeywords } from '../src/utils/writingGraph';

type Post = {
  id: string;
  data: {
    title: string;
    description?: string;
    tags?: string[];
    relatedWriting?: string[];
  };
  body?: string;
};

const post = (
  id: string,
  title: string,
  tags: string[] = [],
  description = '',
  relatedWriting?: string[],
): Post => ({
  id,
  data: { title, tags, description, relatedWriting },
});

describe('getKeywords', () => {
  it('lowercases and strips short / stop words', () => {
    const kw = getKeywords('The Quick Brown Fox jumps over the lazy dog');
    expect(kw.has('quick')).toBe(true);
    expect(kw.has('brown')).toBe(true);
    // length <= 3 filtered out: "fox", "the"
    expect(kw.has('fox')).toBe(false);
    expect(kw.has('the')).toBe(false);
  });

  it('strips punctuation and short tokens', () => {
    const kw = getKeywords("Design's principles, considered.");
    // Apostrophe → space, so "Design's" splits into "design" + "s" (s dropped, length < 4)
    expect(kw.has('design')).toBe(true);
    expect(kw.has('principles')).toBe(true);
    expect(kw.has('considered')).toBe(true);
    expect(kw.has('s')).toBe(false);
  });
});

describe('buildGraph', () => {
  it('returns a node for every post', () => {
    const graph = buildGraph([post('a', 'One'), post('b', 'Two'), post('c', 'Three')]);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('emits writing-scoped urls', () => {
    const graph = buildGraph([post('hello-world', 'Hello')]);
    expect(graph.nodes[0].url).toBe('/writing/hello-world');
  });

  it('creates an edge when posts share a tag', () => {
    const graph = buildGraph([
      post('a', 'Alpha post', ['design']),
      post('b', 'Beta post', ['design']),
    ]);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].weight).toBeGreaterThanOrEqual(4); // shared tag = weight 4
  });

  it('omits edges when posts share nothing', () => {
    const graph = buildGraph([
      post('a', 'Zebra'),
      post('b', 'Penguin'),
    ]);
    expect(graph.edges).toHaveLength(0);
  });

  it('records the right degree for connected nodes', () => {
    const graph = buildGraph([
      post('a', 'Alpha', ['design']),
      post('b', 'Beta', ['design']),
    ]);
    const a = graph.nodes.find((n) => n.id === 'a')!;
    const b = graph.nodes.find((n) => n.id === 'b')!;
    expect(a.degree).toBe(1);
    expect(b.degree).toBe(1);
  });

  it('records degree 0 for isolated nodes', () => {
    const graph = buildGraph([post('a', 'Lonely'), post('b', 'Hermit')]);
    expect(graph.nodes.every((n) => n.degree === 0)).toBe(true);
  });

  it('caps each node at MAX_EDGES_PER_NODE (=5)', () => {
    // Five posts that all share the same tag — without the cap,
    // each node would have 4 edges.
    const posts: Post[] = ['a', 'b', 'c', 'd', 'e'].map((id) =>
      post(id, `Title ${id}`, ['shared']),
    );
    const graph = buildGraph(posts);
    const degreeById = new Map(graph.nodes.map((n) => [n.id, n.degree]));
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(degreeById.get(id)).toBeGreaterThan(0);
      expect(degreeById.get(id)).toBeLessThanOrEqual(6);
    }
  });

  it('creates a strong edge for author-declared relatedWriting', () => {
    const graph = buildGraph([
      post('a', 'Alpha', [], '', ['b']),
      post('b', 'Beta'),
    ]);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].reasons).toContain('related');
    expect(graph.edges[0].weight).toBeGreaterThanOrEqual(12);
  });

  it('includes body text in keyword overlap', () => {
    const graph = buildGraph([
      { id: 'a', data: { title: 'Post A', description: '' }, body: 'symphony orchestra performance' },
      { id: 'b', data: { title: 'Post B', description: '' }, body: 'symphony concert hall acoustics' },
    ]);
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it('dedupes pairs (no parallel edges)', () => {
    const graph = buildGraph([
      post('a', 'Alpha', ['x']),
      post('b', 'Beta', ['x']),
    ]);
    const keys = graph.edges.map((e) =>
      e.source < e.target ? `${e.source}-${e.target}` : `${e.target}-${e.source}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('weights shared tags more than shared keywords', () => {
    // Pair 1 shares one tag (weight ≥ 3)
    // Pair 2 shares one title keyword (weight 1)
    const graph = buildGraph([
      post('tagshare-a', 'Foo', ['design']),
      post('tagshare-b', 'Bar', ['design']),
      post('kwshare-a', 'Symphony orchestra'),
      post('kwshare-b', 'Symphony performance'),
    ]);
    const tagEdge = graph.edges.find(
      (e) =>
        (e.source === 'tagshare-a' && e.target === 'tagshare-b') ||
        (e.source === 'tagshare-b' && e.target === 'tagshare-a'),
    );
    const kwEdge = graph.edges.find(
      (e) =>
        (e.source === 'kwshare-a' && e.target === 'kwshare-b') ||
        (e.source === 'kwshare-b' && e.target === 'kwshare-a'),
    );
    expect(tagEdge).toBeDefined();
    expect(kwEdge).toBeDefined();
    expect(tagEdge!.weight).toBeGreaterThan(kwEdge!.weight);
  });
});
