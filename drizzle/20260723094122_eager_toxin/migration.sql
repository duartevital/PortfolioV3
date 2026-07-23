CREATE TABLE `photos` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`shoot_date` text,
	`visible` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`thumbnail_url` text NOT NULL,
	`display_url` text NOT NULL,
	`created_at` text NOT NULL
);
