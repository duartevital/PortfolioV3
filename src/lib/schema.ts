import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import type { CategorySlug } from './categories';

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(), // uuid
  title: text('title').notNull(),
  category: text('category').$type<CategorySlug>().notNull(),
  description: text('description'),
  shootDate: text('shoot_date'), // ISO 8601 date
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  order: integer('order').notNull().default(0),
  thumbnailUrl: text('thumbnail_url').notNull(), // /uploads/<id>-thumb.webp
  displayUrl: text('display_url').notNull(), // /uploads/<id>-display.webp
  createdAt: text('created_at').notNull(), // ISO 8601 datetime
  // Camera settings read from the original's EXIF on upload (null when absent)
  camera: text('camera'),
  lens: text('lens'),
  focalLength: real('focal_length'), // mm
  aperture: real('aperture'), // f-number
  exposureTime: real('exposure_time'), // seconds
  iso: integer('iso'),
});

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
