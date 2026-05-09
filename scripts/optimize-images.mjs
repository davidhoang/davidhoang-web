import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const QUALITY_WEBP = 82; // Good balance of quality and compression
const MIN_SIZE_BYTES = 100 * 1024; // Only optimize files > 100KB
const COMPRESS_THRESHOLD_BYTES = 300 * 1024; // Re-compress existing WebPs over 300KB
const MIN_SAVINGS_RATIO = 0.05; // Skip if re-encoding saves <5% — sharp isn't byte-deterministic, so trivial deltas dirty the tree on every build
const MAX_SAVINGS_RATIO = 0.80; // If sharp saves >80%, it likely stripped animation frames — reject
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Directories to process
const imageDirectories = [
  join(rootDir, 'public/images'),
  join(rootDir, 'src/assets/images'),
];

// Track results
const results = {
  converted: [],
  skipped: [],
  errors: [],
  totalSavedBytes: 0,
};

// Recursively get all image files
function getImageFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      getImageFiles(fullPath, files);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Convert a single image to WebP
async function convertToWebP(inputPath) {
  const stats = statSync(inputPath);
  const originalSize = stats.size;

  // Skip small files
  if (originalSize < MIN_SIZE_BYTES) {
    results.skipped.push({
      path: inputPath,
      reason: `Too small (${formatBytes(originalSize)})`,
    });
    return;
  }

  const dir = dirname(inputPath);
  const name = basename(inputPath, extname(inputPath));
  const outputPath = join(dir, `${name}.webp`);

  // Skip if WebP already exists
  if (existsSync(outputPath)) {
    results.skipped.push({
      path: inputPath,
      reason: 'WebP version already exists',
    });
    return;
  }

  try {
    await sharp(inputPath)
      .webp({ quality: QUALITY_WEBP })
      .toFile(outputPath);

    const newStats = statSync(outputPath);
    const newSize = newStats.size;
    const savedBytes = originalSize - newSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    // Only keep the WebP if it's actually smaller
    if (newSize < originalSize) {
      // Remove the original file
      unlinkSync(inputPath);

      results.converted.push({
        original: inputPath,
        webp: outputPath,
        originalSize,
        newSize,
        savedBytes,
        savedPercent,
      });
      results.totalSavedBytes += savedBytes;
    } else {
      // WebP is larger, remove it and keep original
      unlinkSync(outputPath);
      results.skipped.push({
        path: inputPath,
        reason: `WebP would be larger (${formatBytes(newSize)} vs ${formatBytes(originalSize)})`,
      });
    }
  } catch (error) {
    results.errors.push({
      path: inputPath,
      error: error.message,
    });
  }
}

// Recursively collect .webp files
function getWebPFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) getWebPFiles(fullPath, files);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.webp') files.push(fullPath);
  }
  return files;
}

// Compress an oversized WebP in-place.
// Safety: if sharp reduces size by >80%, it almost certainly stripped animation
// frames (static recompression saves 5-30%, not 95%). Reject and keep original.
async function compressWebP(filePath) {
  const stats = statSync(filePath);
  if (stats.size < COMPRESS_THRESHOLD_BYTES) return;

  try {
    const buf = await sharp(filePath).webp({ quality: QUALITY_WEBP }).toBuffer();

    if (buf.length >= stats.size) {
      results.skipped.push({ path: filePath, reason: 'Already well-compressed' });
      return;
    }

    const savingsRatio = 1 - (buf.length / stats.size);
    if (savingsRatio < MIN_SAVINGS_RATIO) {
      results.skipped.push({ path: filePath, reason: `Converged (${(savingsRatio * 100).toFixed(1)}% delta below threshold)` });
      return;
    }
    if (savingsRatio > MAX_SAVINGS_RATIO) {
      // Almost certainly an animated WebP — sharp kept only the first frame
      results.skipped.push({ path: filePath, reason: `Likely animated (${(savingsRatio * 100).toFixed(0)}% reduction rejected)` });
      return;
    }

    const { writeFileSync } = await import('fs');
    writeFileSync(filePath, buf);
    const savedBytes = stats.size - buf.length;
    results.compressed = results.compressed || [];
    results.compressed.push({
      path: filePath,
      originalSize: stats.size,
      newSize: buf.length,
      savedBytes,
      savedPercent: ((savedBytes / stats.size) * 100).toFixed(1),
    });
    results.totalSavedBytes += savedBytes;
  } catch (error) {
    results.errors.push({ path: filePath, error: error.message });
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('============================\n');

  // Collect all image files
  let allFiles = [];
  for (const dir of imageDirectories) {
    console.log(`📂 Scanning: ${dir}`);
    const files = getImageFiles(dir);
    console.log(`   Found ${files.length} images\n`);
    allFiles = allFiles.concat(files);
  }

  // Remove duplicates (same file in different paths)
  const uniqueFiles = [...new Set(allFiles)];

  console.log(`\n🔄 Processing ${uniqueFiles.length} images...\n`);

  // Process all files
  for (const file of uniqueFiles) {
    process.stdout.write(`   Converting: ${basename(file)}...`);
    await convertToWebP(file);
    console.log(' ✓');
  }

  // Pass 2: Compress oversized static WebPs
  console.log(`\n🗜️  Checking WebPs over ${COMPRESS_THRESHOLD_BYTES / 1024}KB...\n`);
  let allWebPs = [];
  for (const dir of imageDirectories) {
    allWebPs = allWebPs.concat(getWebPFiles(dir));
  }
  for (const file of allWebPs) {
    await compressWebP(file);
  }
  const compressed = results.compressed || [];
  if (compressed.length > 0) {
    for (const item of compressed) {
      console.log(`   ${basename(item.path)}: ${formatBytes(item.originalSize)} → ${formatBytes(item.newSize)} (-${item.savedPercent}%)`);
    }
  } else {
    console.log('   No oversized static WebPs found.');
  }

  // Print summary
  console.log('\n============================');
  console.log('📊 SUMMARY');
  console.log('============================\n');

  console.log(`✅ Converted: ${results.converted.length} files`);
  console.log(`🗜️  Compressed: ${compressed.length} WebPs`);
  console.log(`⏭️  Skipped: ${results.skipped.length} files`);
  console.log(`❌ Errors: ${results.errors.length} files`);
  console.log(`💾 Total saved: ${formatBytes(results.totalSavedBytes)}`);

  if (results.converted.length > 0) {
    console.log('\n📝 Converted files:');
    for (const item of results.converted) {
      console.log(`   ${basename(item.original)} → ${basename(item.webp)}`);
      console.log(`      ${formatBytes(item.originalSize)} → ${formatBytes(item.newSize)} (saved ${item.savedPercent}%)`);
    }
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    for (const item of results.errors) {
      console.log(`   ${item.path}: ${item.error}`);
    }
  }

  // Output files that need reference updates
  if (results.converted.length > 0) {
    console.log('\n============================');
    console.log('📝 CODE UPDATES NEEDED');
    console.log('============================\n');
    console.log('The following file references need to be updated:');
    for (const item of results.converted) {
      const oldPath = item.original.replace(rootDir, '').replace('/public', '');
      const newPath = item.webp.replace(rootDir, '').replace('/public', '');
      console.log(`   ${oldPath} → ${newPath}`);
    }
  }
}

main().catch(console.error);
