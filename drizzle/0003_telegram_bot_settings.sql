CREATE TABLE IF NOT EXISTS `bot_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL,
  `value` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `bot_settings_key_unique` ON `bot_settings` (`key`);

-- Seed the default "telegram_enabled" = "true"
INSERT OR IGNORE INTO `bot_settings` (`key`, `value`, `updated_at`)
VALUES ('telegram_enabled', 'true', datetime('now'));
