import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { migrate } from 'drizzle-orm/node-sqlite/migrator';
import { DATABASE_URL } from 'astro:env/server';

const dbPath = DATABASE_URL.replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = drizzle({ connection: { path: dbPath } });

// Single-container deploy has no separate migration step, so apply pending
// migrations at boot. Path is relative to process.cwd() (project root).
migrate(db, { migrationsFolder: './drizzle' });
