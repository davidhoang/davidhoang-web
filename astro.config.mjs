import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { visualizer } from 'rollup-plugin-visualizer';
import { remarkImagePath } from './src/plugins/remarkImagePath.mjs';
import { syncPublicImages } from './scripts/lib/sync-public-images.mjs';

const MANUAL_CHUNKS = [
  ['framer-motion', ['framer-motion']],
  ['paper-shaders', ['@paper-design/shaders-react']],
  ['career-components', ['src/components/CareerOdysseyWrapper.tsx']],
  [
    'hero-components',
    [
      'src/components/CardStackHero.tsx',
      'src/components/hero/types.ts',
      'src/components/hero/CardBase.tsx',
      'src/components/hero/HeroTitle.tsx',
      'src/components/hero/layouts/StackedFanLayout.tsx',
      'src/components/HeroImageShader.tsx',
    ],
  ],
  ['shader-components', ['src/components/ShaderBackground.tsx']],
  ['utils', ['src/utils', 'src/plugins']],
];

function manualChunks(id) {
  for (const [chunkName, matchers] of MANUAL_CHUNKS) {
    if (matchers.some((matcher) => id.includes(matcher))) {
      return chunkName;
    }
  }
}

/** Populate public/images from src/assets/images (single source of truth). */
function copyAssetsPlugin() {
  const sync = () => {
    const { copied } = syncPublicImages();
    if (copied) {
      console.log('✓ Synced src/assets/images → public/images');
    }
  };
  return {
    name: 'copy-assets-images',
    buildStart() {
      sync();
    },
    configureServer() {
      sync();
    },
  };
}

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://www.davidhoang.com',
  trailingSlash: 'never',
  devToolbar: {
    enabled: false,
  },
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkImagePath],
    }),
  },
  prefetch: {
    // Opt-in only — prefetchAll burns bandwidth on footer/long-tail links after LCP.
    // Primary nav links set data-astro-prefetch where needed.
    prefetchAll: false,
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
          // Manual chunks for heavy libraries and components.
          manualChunks,
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
