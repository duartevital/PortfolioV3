import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOADS_DIR } from 'astro:env/server';
import { THUMBNAIL_WIDTH, DISPLAY_WIDTH, EXTRA_DISPLAY_WIDTHS, displayVariantFilename } from './srcset';

const WEBP_QUALITY = 85;

export async function processAndStoreImage(id: string, original: Buffer) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const thumbnailFilename = `${id}-thumb.webp`;

  await sharp(original)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(UPLOADS_DIR, thumbnailFilename));

  await Promise.all(
    [...EXTRA_DISPLAY_WIDTHS, DISPLAY_WIDTH].map((width) =>
      sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(path.join(UPLOADS_DIR, displayVariantFilename(id, width)))
    )
  );

  return {
    thumbnailUrl: `/uploads/${thumbnailFilename}`,
    displayUrl: `/uploads/${displayVariantFilename(id, DISPLAY_WIDTH)}`,
  };
}

export async function deleteStoredImage(thumbnailUrl: string) {
  const id = path.basename(thumbnailUrl).replace(/-thumb\.webp$/, '');
  const filenames = [
    path.basename(thumbnailUrl),
    ...[...EXTRA_DISPLAY_WIDTHS, DISPLAY_WIDTH].map((width) => displayVariantFilename(id, width)),
  ];

  await Promise.all(
    filenames.map((filename) => unlink(path.join(UPLOADS_DIR, filename)).catch(() => {}))
  );
}
