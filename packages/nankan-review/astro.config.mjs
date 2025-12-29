import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://nankan-review.jp',
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  adapter: netlify(),
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  compressHTML: true,
});
