import { defineConfig } from 'drizzle-kit';

const rawUrl = process.env.DATABASE_URL ?? 'file:./data/vital.db';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: rawUrl.replace(/^file:/, ''),
  },
});
