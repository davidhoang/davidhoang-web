import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';
import react from '@astrojs/react';
import { cpSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Vite plugin to copy images from src/assets/images to public/images during build
// This allows markdown files to continue using /images/ paths while components
// can import from /src/assets for optimization
function copyAssetsPlugin() {
  return {
    name: 'copy-assets-images',
    buildStart() {
      const srcDir = fileURLToPath(new URL('./src/assets/images', import.meta.url));
      const publicDir = fileURLToPath(new URL('./public/images', import.meta.url));
      
      if (existsSync(srcDir)) {
        // Copy entire directory recursively
        // This allows markdown files to continue using /images/ paths
        cpSync(srcDir, publicDir, { recursive: true, force: true });
      }
    }
  };
}

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://davidhoang.com',
  viewTransitions: true,
  integrations: [react()],
  vite: {
    plugins: [copyAssetsPlugin()],
  },
}); 