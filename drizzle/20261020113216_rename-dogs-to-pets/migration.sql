-- The "Dogs" genre was renamed to "Pets"; move existing photos to the new category slugs.
UPDATE `photos` SET `category` = 'pet-portraits' WHERE `category` = 'dog-portraits';--> statement-breakpoint
UPDATE `photos` SET `category` = 'pet-action' WHERE `category` = 'dog-action';
