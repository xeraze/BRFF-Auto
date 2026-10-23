import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://xeraze.github.io',
  base: '/BRFF-Auto',
  vite: { plugins: [tailwindcss()] },
});
