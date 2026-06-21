import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { visualizer } from 'rollup-plugin-visualizer';
import { cpSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { remarkImagePath } from './src/plugins/remarkImagePath.mjs';

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
    },
  };
}

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://www.davidhoang.com',
  trailingSlash: 'never',
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  markdown: {
    remarkPlugins: [remarkImagePath],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/default-layout'),
    }),
  ],
  vite: {
    plugins: [
      copyAssetsPlugin(),
      ...(process.env.ANALYZE ? [visualizer({
        filename: 'dist/bundle-stats.html',
        open: process.env.ANALYZE_OPEN === 'true',
        gzipSize: true,
        brotliSize: true,
      })] : []),
    ],
    // Disable caching in development to prevent stale module issues
    server: {
      hmr: {
        overlay: true,
      },
      allowedHosts: [
        '.vibepocket.link',
        'localhost',
      ],
    },
    build: {
      // Enable minification with terser for better compression
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.info', 'console.debug', 'console.warn']
        },
        mangle: true, // Shorten variable names
        format: {
          comments: false // Remove comments
        }
      },
      // Add content hash to filenames for proper cache busting + bundle optimization
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          // Manual chunks for heavy libraries and components
          manualChunks: {
            // Heavy React libraries
            'framer-motion': ['framer-motion'],
            'paper-shaders': ['@paper-design/shaders-react'],
            
            // Heavy React components (split by route/feature)
            'career-components': [
              'src/components/CareerOdysseyWrapper.tsx'
            ],
            'hero-components': [
              'src/components/CardStackHero.tsx',
              'src/components/hero/types.ts',
              'src/components/hero/CardBase.tsx',
              'src/components/hero/HeroTitle.tsx',
              'src/components/hero/layouts/StackedFanLayout.tsx',
              'src/components/hero/layouts/EditorialLayout.tsx',
              'src/components/hero/layouts/ScatteredLayout.tsx',
              'src/components/hero/layouts/RolodexLayout.tsx',
              'src/components/HeroImageShader.tsx',
              'src/components/HeroImageWithTexture.tsx'
            ],
            'shader-components': [
              'src/components/ShaderBackground.tsx'
            ],
            // React core (separate from main bundle)
            'react-vendor': ['react', 'react-dom'],
            
            // Common utilities
            'utils': ['src/utils', 'src/plugins']
          }
        }
      },
      // Increase chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
      // Additional optimizations
      cssCodeSplit: true, // Split CSS into separate files
      sourcemap: false, // Disable sourcemaps in production for smaller builds
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@astrojs/react']
    },
    // Enable tree shaking
    esbuild: {
      treeShaking: true
    }
  },
}); 
