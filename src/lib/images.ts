import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOADS_DIR } from 'astro:env/server';

const THUMBNAIL_WIDTH = 400;
const DISPLAY_WIDTH = 1800;
const WEBP_QUALITY = 85;

export async function processAndStoreImage(id: string, original: Buffer) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const thumbnailFilename = `${id}-thumb.webp`;
  const displayFilename = `${id}-display.webp`;

  await sharp(original)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(UPLOADS_DIR, thumbnailFilename));

  await sharp(original)
    .resize({ width: DISPLAY_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(UPLOADS_DIR, displayFilename));

  return {
    thumbnailUrl: `/uploads/${thumbnailFilename}`,
    displayUrl: `/uploads/${displayFilename}`,
  };
}

export async function deleteStoredImage(...urls: string[]) {
  await Promise.all(
    urls.map((url) => unlink(path.join(UPLOADS_DIR, path.basename(url))).catch(() => {}))
  );
}
