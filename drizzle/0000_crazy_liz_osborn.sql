CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'basic' NOT NULL,
	`is_blocked` integer DEFAULT false,
	`is_admin` integer DEFAULT false,
	`theme` text DEFAULT 'light' NOT NULL,
	`show_snowflakes` integer DEFAULT false,
	`avatar_url` text,
	`label` text DEFAULT 'NIGHTVOLT' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_uid_unique` ON `artists` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_email_unique` ON `artists` (`email`);--> statement-breakpoint
CREATE TABLE `faq` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`order_index` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lyrics_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artist_id` integer NOT NULL,
	`track_url` text NOT NULL,
	`lyrics_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`links` text,
	`created_by` integer NOT NULL,
	`created_at` text NOT NULL,
	`published` integer DEFAULT true,
	FOREIGN KEY (`created_by`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artist_id` integer NOT NULL,
	`password` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artist_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`cover_url` text NOT NULL,
	`release_date` text,
	`is_asap` integer DEFAULT false,
	`main_artist` text NOT NULL,
	`additional_artists` text,
	`genre` text NOT NULL,
	`subgenre` text,
	`promo_text` text,
	`use_editorial_promo` integer DEFAULT false,
	`label` text DEFAULT 'NIGHTVOLT' NOT NULL,
	`artist_comment` text,
	`moderator_comment` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`upc` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`release_id` integer NOT NULL,
	`track_number` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`artists` text NOT NULL,
	`music_author` text,
	`lyrics_author` text,
	`producer` text,
	`lyrics` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action
);
