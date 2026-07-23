// @ts-check
import { defineConfig, envField } from 'astro/config';

import vue from '@astrojs/vue';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],

  adapter: node({
    mode: 'standalone'
  }),

  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'public', default: 'file:./data/vital.db' }),
      UPLOADS_DIR: envField.string({ context: 'server', access: 'public', default: './data/uploads' }),
      ADMIN_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret' }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', default: 'http://localhost:4321' }),
    },
  },
});