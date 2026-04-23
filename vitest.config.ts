import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,js,mjs}'],
    environment: 'node',
    globals: false,
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'src/utils/**/*.ts',
        'src/pages/api/**/*.ts',
        'src/pages/rss.xml.js',
        'src/pages/rss/**/*.js',
        'scripts/lib/**/*.mjs',
      ],
    },
  },
});
