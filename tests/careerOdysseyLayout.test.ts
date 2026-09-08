import { describe, expect, it } from 'vitest';
import careerData from '../src/data/career-odyssey.json';
import { buildConnections, calculateLayout, getCanvasBounds, getYear, getYearRange } from '../src/components/career-odyssey/layout';
import type { CareerNode, CareerOdysseyData, Connection } from '../src/components/career-odyssey/types';

const moment = (id: string, overrides: Partial<CareerNode> = {}): CareerNode => ({
  id,
  label: id,
  type: 'moment',
  ...overrides,
});

describe('career board layout', () => {
  it('preserves authored centers and dimensions when dates, activity, and connections change', () => {
    const authored = [
      moment('photo', { presentation: 'photo', x: 700, y: 400, width: 480, height: 354, date: '2015' }),
      moment('note', { x: 0, y: -100, width: 310, height: 190, date: '2025' }),
    ];
    const before = structuredClone(authored);
    const original = calculateLayout(authored);
    const revised = calculateLayout(authored.map(node => ({
      ...node,
      date: '1980',
      active: true,
      connections: ['photo', 'note'],
    })));

    const geometry = (nodes: ReturnType<typeof calculateLayout>) => nodes.map(({ x, y, width, height }) => ({ x, y, width, height }));
    expect(geometry(original)).toEqual([
      { x: 700, y: 400, width: 480, height: 354 },
      { x: 0, y: -100, width: 310, height: 190 },
    ]);
    expect(geometry(revised)).toEqual(geometry(original));
    expect(authored).toEqual(before);
  });

  it('positions unplaced moments deterministically without using dates', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e'].map((id, index) => moment(id, { date: String(2000 + index) }));
    const positions = (input: CareerNode[]) => calculateLayout(input).map(({ x, y }) => ({ x, y }));
    const original = positions(nodes);

    expect(positions(nodes)).toEqual(original);
    expect(positions(nodes.map(node => ({ ...node, date: undefined })))).toEqual(original);
    expect(positions(nodes.map((node, index) => ({ ...node, date: String(2100 - index) })))).toEqual(original);
    expect(new Set(original.map(node => node.y)).size).toBe(nodes.length);
    expect(new Set(original.map(node => `${node.x},${node.y}`)).size).toBe(nodes.length);
  });

  it('uses presentation sizes and falls back safely from invalid dimensions or coordinates', () => {
    const nodes = calculateLayout([
      moment('photo', { presentation: 'photo' }),
      moment('quote', { presentation: 'quote' }),
      moment('note', { presentation: 'note', width: -1, height: 0, x: Infinity, y: NaN }),
      moment('legacy', { type: 'company' }),
    ]);

    expect(nodes.map(({ width, height }) => [width, height])).toEqual([
      [480, 354], [280, 190], [270, 170], [270, 170],
    ]);
    expect(nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
    expect(nodes.every(node => node.timestamp === 0)).toBe(true);
  });

  it('bounds the full centered card rectangles, including negative coordinates', () => {
    const nodes = calculateLayout([
      moment('photo', { presentation: 'photo', x: 700, y: 400 }),
      moment('note', { x: -100, y: -50, width: 200, height: 100 }),
    ]);

    expect(getCanvasBounds(nodes)).toEqual({ minX: -280, minY: -180, maxX: 1020, maxY: 657 });
    const empty = getCanvasBounds([]);
    expect(Object.values(empty).every(Number.isFinite)).toBe(true);
    expect(empty.maxX).toBeGreaterThan(empty.minX);
    expect(empty.maxY).toBeGreaterThan(empty.minY);
    expect(calculateLayout([])).toEqual([]);
  });
});

describe('career board connections', () => {
  const nodes = [moment('a'), moment('b'), moment('c')];

  it('keeps labeled explicit relationships while rejecting missing endpoints, self-links, and duplicate cables', () => {
    const connections: Connection[] = [
      { sourceId: 'a', targetId: 'b', pathTaken: true, label: 'Craft' },
      { sourceId: 'a', targetId: 'b', pathTaken: false, label: 'Duplicate' },
      { sourceId: 'b', targetId: 'a', pathTaken: true },
      { sourceId: 'a', targetId: 'missing', pathTaken: true },
      { sourceId: 'missing', targetId: 'c', pathTaken: true },
      { sourceId: 'c', targetId: 'c', pathTaken: true },
      { sourceId: 'b', targetId: 'c', pathTaken: false, label: 'Another possibility' },
    ];
    const before = structuredClone(connections);

    expect(buildConnections(nodes, connections)).toEqual([connections[0], connections[6]]);
    expect(connections).toEqual(before);
  });

  it('supports legacy predecessor lists without inventing implicit links on an explicit board', () => {
    const legacy = [
      moment('a'),
      moment('b', { connections: ['a', 'a', 'missing', 'b'], pathTaken: false }),
      moment('c', { connections: ['b'] }),
    ];

    expect(buildConnections(legacy)).toEqual([
      { sourceId: 'a', targetId: 'b', pathTaken: false },
      { sourceId: 'b', targetId: 'c', pathTaken: true },
    ]);
    expect(buildConnections(legacy, [])).toEqual([]);
    expect(buildConnections([], [{ sourceId: 'a', targetId: 'b', pathTaken: true }])).toEqual([]);
  });
});

describe('published career board', () => {
  const data = careerData as CareerOdysseyData;
  const nodes = calculateLayout(data.nodes);

  it('starts at the San Francisco photo and gives every moment a non-overlapping authored place', () => {
    const start = nodes.find(node => node.id === data.startingNodeId);
    expect(start).toMatchObject({
      label: 'Moved to San Francisco',
      date: '2015',
      presentation: 'photo',
      featured: true,
      x: 700,
      y: 400,
    });
    expect(start?.imageAlt).toBeTruthy();
    expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);

    for (const [index, node] of nodes.entries()) {
      expect(data.nodes[index].x).toBeDefined();
      expect(data.nodes[index].y).toBeDefined();
      for (const other of nodes.slice(index + 1)) {
        const overlapX = Math.abs(node.x - other.x) < (node.width + other.width) / 2;
        const overlapY = Math.abs(node.y - other.y) < (node.height + other.height) / 2;
        expect(overlapX && overlapY, `${node.id} overlaps ${other.id}`).toBe(false);
      }
    }
  });

  it('can reach every moment from the opening photo through valid relationships', () => {
    const connections = buildConnections(data.nodes, data.connections);
    expect(connections).toHaveLength(data.connections!.length);
    const visited = new Set<string>();
    const pending = [data.startingNodeId!];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const connection of connections) {
        if (connection.sourceId === id) pending.push(connection.targetId);
        if (connection.targetId === id) pending.push(connection.sourceId);
      }
    }
    expect([...visited].sort()).toEqual(data.nodes.map(node => node.id).sort());
  });
});

describe('career date metadata', () => {
  it('retains year helpers and ignores undated or invalid moments when finding a range', () => {
    expect(getYear('2025-04')).toBe(2025);
    expect(getYearRange([moment('unknown'), moment('invalid', { date: 'unknown' })])).toEqual({ min: 0, max: 0 });
    expect(getYearRange([
      moment('a', { date: '2025-04' }), moment('undated'), moment('b', { date: '2015' }),
    ])).toEqual({ min: 2015, max: 2025 });
  });
});
