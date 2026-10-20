import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { migrate } from 'drizzle-orm/node-sqlite/migrator';
import { eq, isNull } from 'drizzle-orm';
import { DATABASE_URL } from 'astro:env/server';
import { photos } from './schema';
import { readStoredImageSize } from './images';

const dbPath = DATABASE_URL.replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = drizzle({ connection: { path: dbPath } });

// Single-container deploy has no separate migration step, so apply pending
// migrations at boot. Path is relative to process.cwd() (project root).
migrate(db, { migrationsFolder: './drizzle' });

// Photos uploaded before width/height were stored: read them from the stored
// display image once. Rows whose file is missing stay null and are retried next boot.
for (const photo of await db.select().from(photos).where(isNull(photos.width))) {
  try {
    const { width, height } = await readStoredImageSize(photo.displayUrl);
    await db.update(photos).set({ width, height }).where(eq(photos.id, photo.id));
  } catch {
    // file missing or unreadable — the gallery falls back to no reserved size
  }
}
