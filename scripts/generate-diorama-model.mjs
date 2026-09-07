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
  massingReference: 'Front elevation photograph — proportions only',
  styleReference: 'Soft-clay diorama concept render',
  note: 'Conceptual single-story desert house. Massing is approximated by eye from a front elevation photo; it is not surveyed or dimensioned.',
};

const materials = {
  stucco: new THREE.MeshStandardMaterial({
    name: 'Clay_Stucco_Sand',
    color: '#dcbb8e',
    roughness: 0.95,
    metalness: 0,
  }),
  stuccoWarm: new THREE.MeshStandardMaterial({
    name: 'Clay_Stucco_Warm',
    color: '#d2ad81',
    roughness: 0.95,
    metalness: 0,
  }),
  trim: new THREE.MeshStandardMaterial({
    name: 'Clay_Trim_Cream',
    color: '#e9d8ba',
    roughness: 0.95,
    metalness: 0,
  }),
  tile: new THREE.MeshStandardMaterial({
    name: 'Clay_RoofTile_Terracotta',
    color: '#c07454',
    roughness: 0.92,
    metalness: 0,
  }),
  timber: new THREE.MeshStandardMaterial({
    name: 'Clay_Pergola_Timber',
    color: '#b96a4c',
    roughness: 0.93,
    metalness: 0,
  }),
  garageDoor: new THREE.MeshStandardMaterial({
    name: 'Clay_GarageDoor_White',
    color: '#f1ebe0',
    roughness: 0.88,
    metalness: 0,
  }),
  wood: new THREE.MeshStandardMaterial({
    name: 'Clay_Door_Wood',
    color: '#8d5c3f',
    roughness: 0.94,
    metalness: 0,
  }),
  glass: new THREE.MeshStandardMaterial({
    name: 'Clay_Window',
    color: '#6d7f7a',
    roughness: 0.7,
    metalness: 0,
  }),
  fixture: new THREE.MeshStandardMaterial({
    name: 'Clay_Fixture_Dark',
    color: '#5d4a3f',
    roughness: 0.9,
    metalness: 0,
  }),
};

// Reused geometry keeps repeated parts (pergola slats, door grooves) to a
// single buffer in the exported GLB.
const geometryCache = new Map();

function roundedBox(size, radius, segments) {
  const key = `${size.join('x')}|${radius}|${segments}`;
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius);
    geometryCache.set(key, geometry);
  }
  return geometry;
}

function addBox(name, size, position, material, { radius = 0.06, segments = 1, rotationY = 0 } = {}) {
  const mesh = new THREE.Mesh(roundedBox(size, radius, segments), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Layout mirrors the reference elevation read left to right: a tile-roofed
// wing, a recessed pergola entry court, then the dominant two-car garage.
// The house fronts +Z and rests on Y = 0.
const GARAGE_X = 3.5;
const ENTRY_X = -0.7;
const WING_X = -4.9;

// --- Primary masses -------------------------------------------------------
addBox('GarageWing', [5.6, 3.15, 6.4], [GARAGE_X, 1.575, -0.2], materials.stucco, {
  radius: 0.13,
  segments: 2,
});
// Parapets read as sand copings with a narrow terracotta trim ledge below,
// matching the concept. A fully terracotta cap merges the masses into one slab.
addBox('GarageParapetTrim', [5.95, 0.14, 6.75], [GARAGE_X, 3.22, -0.2], materials.tile, {
  radius: 0.05,
});
addBox('GarageRoof', [5.7, 0.2, 6.5], [GARAGE_X, 3.39, -0.2], materials.stuccoWarm, {
  radius: 0.06,
});

addBox('EntryCore', [3.6, 2.75, 4.6], [ENTRY_X, 1.375, -1.1], materials.stuccoWarm, {
  radius: 0.12,
  segments: 2,
});
addBox('EntryCourtWall', [3.6, 2.45, 0.5], [ENTRY_X, 1.225, 1.45], materials.stucco, {
  radius: 0.1,
});
addBox('EntryCoreTrim', [3.9, 0.12, 4.9], [ENTRY_X, 2.81, -1.1], materials.tile, {
  radius: 0.05,
});
addBox('EntryCoreRoof', [3.7, 0.18, 4.7], [ENTRY_X, 2.96, -1.1], materials.stuccoWarm, {
  radius: 0.05,
});

addBox('LeftWing', [5.0, 2.85, 6.0], [WING_X, 1.425, -0.4], materials.stucco, {
  radius: 0.13,
  segments: 2,
});
addBox('LeftWingTrim', [5.4, 0.14, 6.4], [WING_X, 2.92, -0.4], materials.tile, { radius: 0.05 });
addBox('LeftWingRoof', [5.2, 0.18, 6.2], [WING_X, 3.08, -0.4], materials.stuccoWarm, {
  radius: 0.05,
});
// Low clay-tile ridge set back behind the parapet, as in the reference elevation.
addBox('LeftWingTileRidge', [4.2, 0.22, 5.0], [WING_X, 3.28, -0.7], materials.tile, {
  radius: 0.06,
});

addBox('Chimney', [0.85, 1.2, 0.85], [1.85, 3.55, -2.4], materials.stuccoWarm, { radius: 0.07 });
addBox('ChimneyCap', [1.05, 0.18, 1.05], [1.85, 4.2, -2.4], materials.tile, { radius: 0.05 });

// --- Garage face ----------------------------------------------------------
addBox('GarageDoor', [4.6, 2.2, 0.16], [GARAGE_X, 1.12, 3.02], materials.garageDoor, {
  radius: 0.05,
});
for (let i = 0; i < 3; i += 1) {
  addBox(
    `GarageDoorGroove${i + 1}`,
    [4.45, 0.05, 0.06],
    [GARAGE_X, 0.63 + i * 0.55, 3.11],
    materials.trim,
    { radius: 0.02 },
  );
}
addBox('GarageSconce', [0.16, 0.34, 0.16], [0.92, 2.0, 3.04], materials.fixture, { radius: 0.04 });

// --- Recessed entry court + pergola ---------------------------------------
addBox('EntryGate', [1.35, 2.0, 0.14], [ENTRY_X, 1.0, 1.72], materials.wood, { radius: 0.05 });
addBox('EntryStep', [2.0, 0.16, 0.85], [ENTRY_X, 0.08, 2.3], materials.trim, { radius: 0.04 });

// The pergola projects forward of the court wall and sits below the parapet, so
// the posts and slats stay readable instead of merging with the roofline.
const pergolaPostX = [-2.4, 1.0];
for (const [index, x] of pergolaPostX.entries()) {
  addBox(`PergolaPost${index + 1}`, [0.26, 2.3, 0.26], [x, 1.15, 2.6], materials.timber, {
    radius: 0.05,
  });
}
addBox('PergolaBeamFront', [3.95, 0.22, 0.24], [ENTRY_X, 2.32, 2.6], materials.timber, {
  radius: 0.05,
});
addBox('PergolaBeamBack', [3.95, 0.22, 0.24], [ENTRY_X, 2.32, 1.7], materials.timber, {
  radius: 0.05,
});
for (let i = 0; i < 8; i += 1) {
  addBox(
    `PergolaSlat${i + 1}`,
    [0.17, 0.14, 1.5],
    [-2.25 + i * 0.44, 2.46, 2.15],
    materials.timber,
    { radius: 0.03 },
  );
}

// --- Openings -------------------------------------------------------------
addBox('WingWindowFrame', [1.85, 1.25, 0.1], [-5.3, 1.72, 2.58], materials.trim, { radius: 0.04 });
addBox('WingWindow', [1.6, 1.0, 0.12], [-5.3, 1.72, 2.63], materials.glass, { radius: 0.04 });
addBox('WingWindowMullion', [0.08, 1.0, 0.06], [-5.3, 1.72, 2.7], materials.trim, { radius: 0.02 });
addBox('GarageSideWindow', [0.12, 0.85, 1.15], [6.32, 1.95, 0.7], materials.glass, {
  radius: 0.04,
});
addBox('CourtWallLantern', [0.18, 0.36, 0.18], [-2.15, 2.05, 1.75], materials.fixture, {
  radius: 0.04,
});

const exporter = new GLTFExporter();
const result = await exporter.parseAsync(scene, {
  binary: true,
  onlyVisible: true,
  trs: false,
});

const buffer = Buffer.from(result);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, buffer);
console.log(`Wrote ${outputPath} (${buffer.byteLength} bytes, ${scene.children.length} meshes)`);
