import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CLIENT_ASSET_DIR = 'dist/client/assets';
const KIB = 1024;

const budgets = {
  maxJsAssetRawKiB: 220,
  maxJsAssetGzipKiB: 65,
  maxTotalJsGzipKiB: 260,
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

let files;
try {
  files = walk(CLIENT_ASSET_DIR).filter((file) => file.endsWith('.js'));
} catch {
  console.error(`Bundle budget check requires a production build at ${CLIENT_ASSET_DIR}.`);
  console.error('Run `npm run build` first.');
  process.exit(1);
}

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
}

if (totalJsGzipBytes > budgets.maxTotalJsGzipKiB * KIB) {
  failures.push(`Total JS gzip ${formatKiB(totalJsGzipBytes)} > ${budgets.maxTotalJsGzipKiB} KiB`);
}

console.log('Bundle budget');
console.log(`Total JS gzip: ${formatKiB(totalJsGzipBytes)} / ${budgets.maxTotalJsGzipKiB} KiB`);
console.log('Largest JS assets:');
for (const asset of jsAssets.slice(0, 8)) {
  console.log(`- ${relative('.', asset.file)}: ${formatKiB(asset.rawBytes)} raw, ${formatKiB(asset.gzipBytes)} gzip`);
}

if (failures.length > 0) {
  console.error('\nBudget failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nBudget passed.');
