import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOADS_DIR } from 'astro:env/server';
import {
  THUMBNAIL_WIDTH,
  EXTRA_THUMBNAIL_WIDTHS,
  DISPLAY_WIDTH,
  EXTRA_DISPLAY_WIDTHS,
  thumbnailVariantFilename,
  displayVariantFilename,
} from './srcset';

const WEBP_QUALITY = 85;

export async function processAndStoreImage(id: string, original: Buffer) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  await Promise.all(
    [THUMBNAIL_WIDTH, ...EXTRA_THUMBNAIL_WIDTHS].map((width) =>
      sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(path.join(UPLOADS_DIR, thumbnailVariantFilename(id, width)))
    )
  );

  const displayOutputs = await Promise.all(
    [...EXTRA_DISPLAY_WIDTHS, DISPLAY_WIDTH].map((width) =>
      sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(path.join(UPLOADS_DIR, displayVariantFilename(id, width)))
    )
  );
  // Take dimensions from what sharp actually wrote, so they match what the browser renders.
  const { width, height } = displayOutputs[displayOutputs.length - 1];

  return {
    thumbnailUrl: `/uploads/${thumbnailVariantFilename(id, THUMBNAIL_WIDTH)}`,
    displayUrl: `/uploads/${displayVariantFilename(id, DISPLAY_WIDTH)}`,
    width,
    height,
  };
}

export async function readStoredImageSize(displayUrl: string) {
  const { width, height } = await sharp(path.join(UPLOADS_DIR, path.basename(displayUrl))).metadata();
  return { width, height };
}

export async function deleteStoredImage(thumbnailUrl: string) {
  const id = path.basename(thumbnailUrl).replace(/-thumb\.webp$/, '');
  const filenames = [
    ...[THUMBNAIL_WIDTH, ...EXTRA_THUMBNAIL_WIDTHS].map((width) => thumbnailVariantFilename(id, width)),
    ...[...EXTRA_DISPLAY_WIDTHS, DISPLAY_WIDTH].map((width) => displayVariantFilename(id, width)),
  ];

  await Promise.all(
    filenames.map((filename) => unlink(path.join(UPLOADS_DIR, filename)).catch(() => {}))
  );
}
