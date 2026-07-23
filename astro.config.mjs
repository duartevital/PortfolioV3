// @ts-check
import { defineConfig, envField } from 'astro/config';

import vue from '@astrojs/vue';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',

  integrations: [
    vue(),
    sitemap({
      // Admin is auth-gated and shouldn't be indexed or advertised in the sitemap.
      filter: (page) => !page.includes('/admin'),
    }),
  ],

  adapter: node({
    mode: 'standalone'
  }),

  security: {
    // Default is 1 MB, too small for photo uploads.
    actionBodySizeLimit: 30 * 1024 * 1024,
  },

  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'public', default: 'file:./data/vital.db' }),
      UPLOADS_DIR: envField.string({ context: 'server', access: 'public', default: './data/uploads' }),
      // Astro's `astro:env/server` bindings for secrets are eager (resolved the
      // instant the module loads), and middleware.ts - which needs SESSION_SECRET
      // to check the admin cookie - runs for every route, including the public
      // pages prerendered at build time. A build environment (e.g. the Docker
      // build stage, which deliberately excludes .env) legitimately has neither
      // secret set. Defaults here only ever satisfy that throwaway build-time
      // process: the actual running server reads process.env fresh at its own
      // startup and always uses the real values from .env / the container's
      // environment, never this default.
      ADMIN_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret', default: '' }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', default: '' }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', default: 'http://localhost:4321' }),
    },
  },
});