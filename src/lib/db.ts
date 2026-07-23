import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { DATABASE_URL } from 'astro:env/server';
import * as schema from './schema';

const dbPath = DATABASE_URL.replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = drizzle({ connection: { path: dbPath }, schema });
