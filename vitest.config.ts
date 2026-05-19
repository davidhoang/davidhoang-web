import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,mjs,js}'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
  },
});
