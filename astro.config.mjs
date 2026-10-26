// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://shu4.dev',
  output: 'static',
  // the About page moved to the home page (2026-10-25)
  redirects: { '/about': '/' },
  integrations: [sitemap()],
});
