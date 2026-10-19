// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import markdown from './integrations/markdown.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://mac-folio.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/thanks/') }), markdown()],
  vite: { plugins: [tailwindcss()] },
});
