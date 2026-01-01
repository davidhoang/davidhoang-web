import { cpSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const functionsAssetsDir = join(rootDir, '.vercel/output/_functions/assets');
const staticAssetsDir = join(rootDir, '.vercel/output/static/assets');

if (existsSync(functionsAssetsDir) && existsSync(staticAssetsDir)) {
  try {
    const files = readdirSync(functionsAssetsDir);
    let copiedCount = 0;
    
    files.forEach((file) => {
      if (file.endsWith('.css')) {
        const srcPath = join(functionsAssetsDir, file);
        const destPath = join(staticAssetsDir, file);
        if (existsSync(srcPath)) {
          cpSync(srcPath, destPath, { force: true });
          copiedCount++;
        }
      }
    });
    
    if (copiedCount > 0) {
      console.log(`✓ Copied ${copiedCount} CSS file(s) to static output`);
    }
  } catch (error) {
    console.warn('Could not copy CSS files:', error.message);
  }
} else {
  // This is expected in local builds where .vercel directory might not exist
  console.log('Skipping CSS copy (Vercel output directory not found)');
}

