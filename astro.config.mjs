import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://davidhoang.com',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@assets': '/src/assets'
      }
    }
  }
}); 