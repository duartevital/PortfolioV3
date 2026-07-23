import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(), // uuid
  title: text('title').notNull(),
  category: text('category').notNull(), // 'landscape-nature' | 'street-urban'
  description: text('description'),
  shootDate: text('shoot_date'), // ISO 8601 date
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  order: integer('order').notNull().default(0),
  thumbnailUrl: text('thumbnail_url').notNull(), // /uploads/<id>-thumb.webp
  displayUrl: text('display_url').notNull(), // /uploads/<id>-display.webp
  createdAt: text('created_at').notNull(), // ISO 8601 datetime
});

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
