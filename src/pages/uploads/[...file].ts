import type { APIRoute } from 'astro';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { UPLOADS_DIR } from 'astro:env/server';

export const prerender = false;

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export const GET: APIRoute = async ({ params }) => {
  // basename strips any directory traversal - all uploads are flat files in UPLOADS_DIR
  const filename = path.basename(params.file ?? '');
  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    if (!(await stat(filePath)).isFile()) throw new Error('not a file');
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const contentType = MIME_TYPES[path.extname(filename).toLowerCase()] ?? 'application/octet-stream';
  const body = await readFile(filePath);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
