ALTER TABLE `photos` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- Start with the photos the homepage already showed: the first 4 visible photos per genre.
UPDATE `photos` SET `featured` = true WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, row_number() OVER (
			PARTITION BY CASE
				WHEN `category` IN ('landscape-nature', 'street-urban') THEN 'travel'
				WHEN `category` IN ('pet-portraits', 'pet-action') THEN 'pets'
				ELSE 'weddings'
			END
			ORDER BY `order`
		) AS `rank`
		FROM `photos`
		WHERE `visible` = true
	) WHERE `rank` <= 4
);
