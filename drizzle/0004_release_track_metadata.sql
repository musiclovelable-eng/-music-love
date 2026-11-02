-- Migration: add metadata fields to releases and tracks tables

-- releases: new columns
ALTER TABLE releases ADD COLUMN subtitle TEXT;
ALTER TABLE releases ADD COLUMN metadata_lang TEXT;
ALTER TABLE releases ADD COLUMN partner_code TEXT;
ALTER TABLE releases ADD COLUMN rights_year TEXT;
ALTER TABLE releases ADD COLUMN early_russia INTEGER DEFAULT 0;
ALTER TABLE releases ADD COLUMN realtime_delivery INTEGER DEFAULT 0;

-- tracks: new columns
ALTER TABLE tracks ADD COLUMN subtitle TEXT;
ALTER TABLE tracks ADD COLUMN composer TEXT;
ALTER TABLE tracks ADD COLUMN language TEXT;
ALTER TABLE tracks ADD COLUMN explicit INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN is_live INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN is_cover INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN is_remix INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN is_instrumental INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN preview_start TEXT;
ALTER TABLE tracks ADD COLUMN isrc TEXT;
