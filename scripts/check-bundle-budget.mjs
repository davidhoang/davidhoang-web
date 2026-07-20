import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const CLIENT_ASSET_DIRS = ['dist/client/assets', 'dist/client/_astro', '.vercel/output/static/_astro'];
const KIB = 1024;

const budgets = {
  maxJsAssetRawKiB: 220,
  maxJsAssetGzipKiB: 65,
  maxTotalJsGzipKiB: 260,
};

/** Named chunk ceilings (gzip KiB). Matched against asset basename prefixes. */
const namedChunkGzipCeilingsKiB = {
  // Primary home islands / shared vendors (names from Vite output)
  CardStackHero: 20,
  ShaderBackground: 15,
  HeroCardShaderPattern: 12,
  client: 60, // react-dom client runtime
  useMagneticTilt: 45, // framer-motion-heavy shared chunk
  // Vite manualChunks from astro.config.mjs (catch vendor/island regressions)
  'framer-motion': 55,
  'paper-shaders': 40,
  'hero-components': 45,
  'shader-components': 20,
  'career-components': 35,
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function formatKiB(bytes) {
  return `${(bytes / KIB).toFixed(1)} KiB`;
}

function namedChunkKey(file) {
  const name = basename(file);
  return Object.keys(namedChunkGzipCeilingsKiB).find((key) => name.startsWith(`${key}.`));
}

const clientAssetDir = CLIENT_ASSET_DIRS.find((dir) => existsSync(dir) && walk(dir).some((file) => file.endsWith('.js')));

if (!clientAssetDir) {
  console.error(`Bundle budget check requires a production build at one of: ${CLIENT_ASSET_DIRS.join(', ')}.`);
  console.error('Run `npm run build` first.');
  process.exit(1);
}

const files = walk(clientAssetDir).filter((file) => file.endsWith('.js'));

const jsAssets = files.map((file) => {
  const source = readFileSync(file);
  return {
    file,
    rawBytes: statSync(file).size,
    gzipBytes: gzipSync(source).length,
  };
}).sort((a, b) => b.gzipBytes - a.gzipBytes);

const totalJsGzipBytes = jsAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
const failures = [];

for (const asset of jsAssets) {
  if (asset.rawBytes > budgets.maxJsAssetRawKiB * KIB) {
    failures.push(`${relative('.', asset.file)} raw ${formatKiB(asset.rawBytes)} > ${budgets.maxJsAssetRawKiB} KiB`);
  }
  if (asset.gzipBytes > budgets.maxJsAssetGzipKiB * KIB) {
    failures.push(`${relative('.', asset.file)} gzip ${formatKiB(asset.gzipBytes)} > ${budgets.maxJsAssetGzipKiB} KiB`);
  }

  const named = namedChunkKey(asset.file);
  if (named) {
    const ceiling = namedChunkGzipCeilingsKiB[named] * KIB;
    if (asset.gzipBytes > ceiling) {
      failures.push(
        `${relative('.', asset.file)} (${named}) gzip ${formatKiB(asset.gzipBytes)} > ${namedChunkGzipCeilingsKiB[named]} KiB named ceiling`
      );
    }
  }
}

if (totalJsGzipBytes > budgets.maxTotalJsGzipKiB * KIB) {
  failures.push(`Total JS gzip ${formatKiB(totalJsGzipBytes)} > ${budgets.maxTotalJsGzipKiB} KiB`);
}

console.log('Bundle budget');
console.log(`Total JS gzip: ${formatKiB(totalJsGzipBytes)} / ${budgets.maxTotalJsGzipKiB} KiB`);
console.log('Largest JS assets:');
for (const asset of jsAssets.slice(0, 8)) {
  const named = namedChunkKey(asset.file);
  const tag = named ? ` [${named}]` : '';
  console.log(`- ${relative('.', asset.file)}${tag}: ${formatKiB(asset.rawBytes)} raw, ${formatKiB(asset.gzipBytes)} gzip`);
}

if (failures.length > 0) {
  console.error('\nBudget failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nBudget passed.');
