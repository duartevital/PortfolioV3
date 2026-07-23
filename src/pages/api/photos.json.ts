import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../lib/db';
import { photos } from '../../lib/schema';

export const prerender = false;

export const GET: APIRoute = async () => {
  const rows = await db
    .select()
    .from(photos)
    .where(eq(photos.visible, true))
    .orderBy(asc(photos.order));

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
};
