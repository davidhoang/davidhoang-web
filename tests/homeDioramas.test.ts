import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readGlb(name: string) {
  const bytes = readFileSync(new URL(`../public/models/homes/${name}.glb`, import.meta.url));
  expect(bytes.toString('ascii', 0, 4)).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  return { bytes, json };
}

describe('web-ready clay homes', () => {
  for (const name of ['greco-court', 'clocktower']) {
    it(`${name} stays self-contained, compressed and within the geometry budget`, () => {
      const { bytes, json } = readGlb(name);
      expect(bytes.length).toBeLessThan(1_000_000);
      expect(json.buffers.every((buffer: { uri?: string }) => !buffer.uri)).toBe(true);
      expect(json.images ?? []).toHaveLength(0);
      expect(json.extensionsRequired).toContain('EXT_meshopt_compression');
      const triangles = json.meshes.flatMap((mesh: { primitives: unknown[] }) => mesh.primitives)
        .reduce((sum: number, primitive: { indices: number }) => sum + json.accessors[primitive.indices].count / 3, 0);
      expect(triangles).toBeGreaterThan(10_000);
      expect(triangles).toBeLessThan(100_000);
      for (const name of ['Ground', 'House', 'Roof', 'Landscape', 'Props']) {
        expect(json.nodes.some((node: { name: string }) => node.name === name)).toBe(true);
      }
    });
  }
  it('retains Kai as a separate mesh with his vertex-painted tabby coat', () => {
    const { json } = readGlb('greco-court');
    const kai = json.nodes.find((node: { name: string }) => node.name === 'Kai');
    expect(kai).toBeDefined();
    expect(json.meshes[kai.mesh].primitives.some((primitive: { attributes: Record<string, number> }) => primitive.attributes.COLOR_0 !== undefined)).toBe(true);
  });
});
