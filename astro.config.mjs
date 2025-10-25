import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://davidhoang.com',
  viewTransitions: true,
  integrations: [react()],
}); 