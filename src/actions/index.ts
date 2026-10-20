import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { photos } from '../lib/schema';
import { createSessionCookie, requireAuth, verifyPassword, SESSION_COOKIE_NAME } from '../lib/auth';
import { processAndStoreImage, deleteStoredImage } from '../lib/images';
import { readCameraSettings } from '../lib/exif';
import { CATEGORIES, type CategorySlug } from '../lib/categories';

const categorySlugs = Object.keys(CATEGORIES) as [CategorySlug, ...CategorySlug[]];
const categorySchema = z.enum(categorySlugs);

const login = defineAction({
  accept: 'form',
  input: z.object({ password: z.string() }),
  handler: async ({ password }, context) => {
    if (!verifyPassword(password)) {
      throw new ActionError({ code: 'UNAUTHORIZED', message: 'Incorrect password.' });
    }
    const cookie = createSessionCookie();
    context.cookies.set(cookie.name, cookie.value, cookie.options);
  },
});

const logout = defineAction({
  handler: async (_input, context) => {
    context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  },
});

const uploadPhoto = defineAction({
  accept: 'form',
  input: z.object({
    file: z.instanceof(File),
    title: z.string().min(1),
    category: categorySchema,
    description: z.string().optional(),
    shootDate: z.string().optional(),
  }),
  handler: async ({ file, title, category, description, shootDate }, context) => {
    requireAuth(context);

    const id = crypto.randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const [{ thumbnailUrl, displayUrl, width, height }, cameraSettings] = await Promise.all([
      processAndStoreImage(id, buffer),
      readCameraSettings(buffer),
    ]);

    const [{ nextOrder }] = await db
      .select({ nextOrder: sql<number>`coalesce(max(${photos.order}), -1) + 1` })
      .from(photos);

    await db.insert(photos).values({
      id,
      title,
      category,
      description: description || null,
      shootDate: shootDate || null,
      visible: true,
      order: nextOrder,
      thumbnailUrl,
      displayUrl,
      width,
      height,
      createdAt: new Date().toISOString(),
      ...cameraSettings,
    });

    return { id };
  },
});

const updatePhoto = defineAction({
  input: z.object({
    id: z.string(),
    title: z.string().min(1),
    category: categorySchema,
    description: z.string().optional(),
    shootDate: z.string().optional(),
    visible: z.boolean(),
  }),
  handler: async ({ id, title, category, description, shootDate, visible }, context) => {
    requireAuth(context);
    await db
      .update(photos)
      .set({ title, category, description: description || null, shootDate: shootDate || null, visible })
      .where(eq(photos.id, id));
  },
});

const setFeatured = defineAction({
  input: z.object({ id: z.string(), featured: z.boolean() }),
  handler: async ({ id, featured }, context) => {
    requireAuth(context);
    await db.update(photos).set({ featured }).where(eq(photos.id, id));
  },
});

const reorderPhotos = defineAction({
  input: z.object({ orderedIds: z.array(z.string()) }),
  handler: async ({ orderedIds }, context) => {
    requireAuth(context);
    for (const [index, id] of orderedIds.entries()) {
      await db.update(photos).set({ order: index }).where(eq(photos.id, id));
    }
  },
});

const deletePhoto = defineAction({
  input: z.object({ id: z.string() }),
  handler: async ({ id }, context) => {
    requireAuth(context);

    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    if (!photo) {
      throw new ActionError({ code: 'NOT_FOUND', message: 'Photo not found.' });
    }

    await db.delete(photos).where(eq(photos.id, id));
    await deleteStoredImage(photo.thumbnailUrl);
  },
});

export const server = {
  login,
  logout,
  uploadPhoto,
  updatePhoto,
  setFeatured,
  reorderPhotos,
  deletePhoto,
};
