import { cpSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const functionsAssetsDir = join(rootDir, '.vercel/output/_functions/assets');
const staticAssetsDir = join(rootDir, '.vercel/output/static/assets');

// File extensions to copy (CSS, images, and other assets)
const assetExtensions = ['.css', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.ico'];

if (existsSync(functionsAssetsDir) && existsSync(staticAssetsDir)) {
  try {
    const files = readdirSync(functionsAssetsDir);
    let cssCount = 0;
    let imageCount = 0;
    let otherCount = 0;
    
    files.forEach((file) => {
      const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
      if (assetExtensions.includes(ext)) {
        const srcPath = join(functionsAssetsDir, file);
        const destPath = join(staticAssetsDir, file);
        if (existsSync(srcPath)) {
          cpSync(srcPath, destPath, { force: true });
          
          if (ext === '.css') {
            cssCount++;
          } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)) {
            imageCount++;
          } else {
            otherCount++;
          }
        }
      }
    });
    
    const total = cssCount + imageCount + otherCount;
    if (total > 0) {
      const parts = [];
      if (cssCount > 0) parts.push(`${cssCount} CSS`);
      if (imageCount > 0) parts.push(`${imageCount} image`);
      if (otherCount > 0) parts.push(`${otherCount} other`);
      console.log(`✓ Copied ${total} asset file(s) to static output (${parts.join(', ')})`);
    }
  } catch (error) {
    console.warn('Could not copy asset files:', error.message);
  }
} else {
  // This is expected in local builds where .vercel directory might not exist
  console.log('Skipping asset copy (Vercel output directory not found)');
}

