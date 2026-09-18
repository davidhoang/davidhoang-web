import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { homeFraming } from '../src/components/homes/homeFraming';
import { homeInstructions, homePeekLabel } from '../src/components/homes/homeCopy';
import { commandPalettePages } from '../src/data/navigation';
import { isExcludedFromSearchIndex } from '../src/data/searchIndexConfig';

function readGlb(name: string) {
  const bytes = readFileSync(new URL(`../public/models/homes/${name}.glb`, import.meta.url));
  expect(bytes.toString('ascii', 0, 4)).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  return { bytes, json };
}

describe('web-ready clay homes', () => {
  it('permits the Meshopt WebAssembly decoder without enabling JavaScript eval', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    const globalHeaders = config.headers.find((rule: { source: string }) => rule.source === '/(.*)').headers;
    const policy = globalHeaders.find((header: { key: string }) => header.key.toLowerCase() === 'content-security-policy').value;
    const scriptSources = policy.split(';').map((directive: string) => directive.trim().split(/\s+/))
      .find((directive: string[]) => directive[0] === 'script-src');
    expect(scriptSources).toContain("'wasm-unsafe-eval'");
    expect(scriptSources).not.toContain("'unsafe-eval'");
  });
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
      for (const name of ['Ground', 'House', 'Roof', 'Landscape', 'Props', 'Scenery']) {
        expect(json.nodes.some((node: { name: string }) => node.name === name)).toBe(true);
      }
    });
  }
  it('keeps a close-up framing for Kai and the clock tower', () => {
    expect(homeFraming.desert.detail.width).toBeLessThan(homeFraming.desert.home.width);
    expect(homeFraming.clocktower.detail.width).toBeLessThan(homeFraming.clocktower.home.width);
    expect(homePeekLabel('desert', 'home', 'Palm Springs')).toMatch(/Kai/);
    expect(homePeekLabel('clocktower', 'detail', 'San Francisco')).toMatch(/full San Francisco view/);
    expect(homeInstructions()).toMatch(/Look closer/);
  });
  it('does not preload the experiment model, which shares the /now renderer chunk', () => {
    const scene = readFileSync(new URL('../src/components/diorama/DioramaScene.tsx', import.meta.url), 'utf8');
    expect(scene).not.toMatch(/useGLTF\.preload/);
  });
  it('keeps the placeholder Greco experiment unlisted next to the finished /now homes', () => {
    const palettePaths: string[] = commandPalettePages.map((page) => page.path);
    expect(palettePaths).not.toContain('/experiments/greco-diorama');
    expect(isExcludedFromSearchIndex('/experiments/greco-diorama')).toBe(true);
  });
  it('retains Kai as a separate mesh with his vertex-painted tabby coat', () => {
    const { json } = readGlb('greco-court');
    const kai = json.nodes.find((node: { name: string }) => node.name === 'Kai');
    expect(kai).toBeDefined();
    expect(json.meshes[kai.mesh].primitives.some((primitive: { attributes: Record<string, number> }) => primitive.attributes.COLOR_0 !== undefined)).toBe(true);
  });
});
