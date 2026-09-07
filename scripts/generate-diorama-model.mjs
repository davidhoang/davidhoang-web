import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// GLTFExporter uses the browser FileReader API even when exporting geometry-only
// scenes. This small adapter keeps the model generator runnable in Node.
class NodeFileReader {
  result = null;
  onloadend = null;

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
}

globalThis.FileReader ??= NodeFileReader;

const outputPath = resolve('public/models/house.glb');
const scene = new THREE.Scene();
scene.name = 'GrecoClayHousePlaceholder';
scene.userData = {
  status: 'placeholder',
  note: 'Conceptual single-story desert clay house; not a measured reconstruction.',
};

const materials = {
  sand: new THREE.MeshStandardMaterial({
    name: 'Clay_Sand',
    color: '#cba77c',
    roughness: 0.92,
    metalness: 0,
  }),
  cream: new THREE.MeshStandardMaterial({
    name: 'Clay_Cream',
    color: '#ead9bc',
    roughness: 0.94,
    metalness: 0,
  }),
  terracotta: new THREE.MeshStandardMaterial({
    name: 'Clay_Terracotta',
    color: '#a85f43',
    roughness: 0.9,
    metalness: 0,
  }),
  shadow: new THREE.MeshStandardMaterial({
    name: 'Clay_Shadow',
    color: '#69554a',
    roughness: 0.96,
    metalness: 0,
  }),
  glass: new THREE.MeshStandardMaterial({
    name: 'Clay_Window',
    color: '#729092',
    roughness: 0.72,
    metalness: 0,
  }),
};

function addRoundedBox(name, size, position, material, radius = 0.08) {
  const geometry = new RoundedBoxGeometry(
    size[0],
    size[1],
    size[2],
    3,
    radius,
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Broad, intentionally simplified masses: a main stucco volume and attached
// garage under low parapets. These are illustrative, not property-specific.
addRoundedBox('MainVolume', [5.6, 2.25, 3.15], [1.15, 1.16, 0], materials.sand, 0.12);
addRoundedBox('GarageVolume', [3.05, 1.95, 2.65], [-3.05, 1.01, 0.2], materials.cream, 0.11);
addRoundedBox('MainParapet', [5.85, 0.24, 3.4], [1.15, 2.36, 0], materials.terracotta, 0.08);
addRoundedBox('GarageParapet', [3.28, 0.22, 2.88], [-3.05, 2.08, 0.2], materials.terracotta, 0.07);

// Front-facing details sit toward +Z.
addRoundedBox('GarageDoor', [2.42, 1.32, 0.12], [-3.05, 0.76, 1.57], materials.shadow, 0.06);
addRoundedBox('EntryDoor', [0.84, 1.48, 0.12], [0.08, 0.8, 1.63], materials.terracotta, 0.05);
addRoundedBox('FrontWindow', [1.55, 0.82, 0.11], [2.15, 1.18, 1.64], materials.glass, 0.05);
addRoundedBox('SideWindow', [0.95, 0.72, 0.11], [3.52, 1.2, 1.64], materials.glass, 0.05);
addRoundedBox('EntryAwning', [1.55, 0.18, 0.7], [0.08, 1.75, 1.72], materials.cream, 0.05);
addRoundedBox('FrontStep', [1.25, 0.18, 0.72], [0.08, 0.11, 1.77], materials.cream, 0.05);

const exporter = new GLTFExporter();
const result = await exporter.parseAsync(scene, {
  binary: true,
  onlyVisible: true,
  trs: false,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(result));
console.log(`Wrote ${outputPath} (${Buffer.byteLength(Buffer.from(result))} bytes)`);
