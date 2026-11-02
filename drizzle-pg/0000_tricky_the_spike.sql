CREATE TABLE "admin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"can_access_dashboard" boolean DEFAULT true,
	"can_access_artists" boolean DEFAULT true,
	"can_access_releases" boolean DEFAULT true,
	"can_access_wallets" boolean DEFAULT false,
	"can_access_news" boolean DEFAULT true,
	"can_access_faq" boolean DEFAULT true,
	"can_access_tickets" boolean DEFAULT true,
	"can_access_pending_users" boolean DEFAULT true,
	"can_access_lyrics" boolean DEFAULT true,
	"can_access_staff" boolean DEFAULT false,
	"can_edit_releases" boolean DEFAULT true,
	"can_delete_releases" boolean DEFAULT false,
	"can_download_files" boolean DEFAULT true,
	"can_approve_releases" boolean DEFAULT true,
	"can_edit_artists" boolean DEFAULT true,
	"can_delete_artists" boolean DEFAULT false,
	"can_manage_payouts" boolean DEFAULT false,
	"can_manage_users" boolean DEFAULT true,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "admin_permissions_admin_id_unique" UNIQUE("admin_id")
);
--> statement-breakpoint
CREATE TABLE "artist_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"date" text NOT NULL,
	"total_streams" integer DEFAULT 0 NOT NULL,
	"streams_over_30s" integer DEFAULT 0 NOT NULL,
	"unique_listeners" integer DEFAULT 0 NOT NULL,
	"subscribers" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"card_number" text NOT NULL,
	"bank_name" text NOT NULL,
	"kbe" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "artist_payment_details_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "artist_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"balance_rub" text DEFAULT '0' NOT NULL,
	"balance_usd" text DEFAULT '0' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "artist_wallets_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"surname" text,
	"artist_name" text,
	"bio" text,
	"contract_signed" boolean DEFAULT false,
	"social_network" text,
	"plan" text DEFAULT 'none' NOT NULL,
	"role" text,
	"is_blocked" boolean DEFAULT false,
	"is_deactivated" boolean DEFAULT false,
	"deactivation_reason" text,
	"is_admin" boolean DEFAULT false,
	"is_manager" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"verification_code" text,
	"access_request_message" text,
	"how_did_you_hear" text,
	"is_frozen" boolean DEFAULT false,
	"manager_id" integer,
	"theme" text DEFAULT 'light' NOT NULL,
	"show_snowflakes" boolean DEFAULT false,
	"show_garland" boolean DEFAULT false,
	"avatar_url" text,
	"label" text DEFAULT 'Music Love' NOT NULL,
	"last_active_at" text,
	"telegram_chat_id" text,
	"created_at" text NOT NULL,
	CONSTRAINT "artists_uid_unique" UNIQUE("uid"),
	CONSTRAINT "artists_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "bot_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"title" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"quarter" integer,
	"year" integer NOT NULL,
	"amount_rub" text DEFAULT '0' NOT NULL,
	"amount_usd" text DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"file_name" text,
	"details" text,
	"is_royalty" boolean DEFAULT true,
	"agreed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyrics_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"release_id" integer,
	"track_name" text NOT NULL,
	"lyric_link" text NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"rejection_reason" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"action" text NOT NULL,
	"target_id" integer,
	"details" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"links" text,
	"created_by" integer NOT NULL,
	"created_at" text NOT NULL,
	"published" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "password_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"password" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pitchings" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"release_id" integer NOT NULL,
	"promo_text" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"release_id" integer NOT NULL,
	"action" text NOT NULL,
	"field" text,
	"old_value" text,
	"new_value" text,
	"performed_by" text NOT NULL,
	"performed_at" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"cover_url" text NOT NULL,
	"release_date" text,
	"start_date" text,
	"pre_order_date" text,
	"is_asap" boolean DEFAULT false,
	"main_artist" text NOT NULL,
	"additional_artists" text,
	"genre" text NOT NULL,
	"subgenre" text,
	"promo_text" text,
	"use_editorial_promo" boolean DEFAULT false,
	"label" text DEFAULT 'Music Love' NOT NULL,
	"artist_comment" text,
	"moderator_comment" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"upc" text,
	"metadata_language" text,
	"partner_code" text,
	"copyright_year" text,
	"early_russia" boolean DEFAULT false,
	"early_release_russia" boolean DEFAULT false,
	"realtime_delivery" boolean DEFAULT false,
	"distribution" text,
	"release_variant" text,
	"localization_json" text,
	"platforms" text,
	"territories" text,
	"persons" text,
	"deactivation_reason" text,
	"deactivated_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"message_id" integer,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"uploaded_by" integer NOT NULL,
	"uploaded_by_type" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_type" text NOT NULL,
	"sender_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" text NOT NULL,
	"created_by" text NOT NULL,
	"created_by_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"subject" text NOT NULL,
	"initial_message" text NOT NULL,
	"status" text DEFAULT 'В работе' NOT NULL,
	"created_at" text NOT NULL,
	"closed_at" text,
	"closed_by" text,
	"last_response_at" text,
	"last_response_by" text
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"release_id" integer NOT NULL,
	"track_number" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"url" text NOT NULL,
	"artists" text NOT NULL,
	"music_author" text,
	"lyrics_author" text,
	"producer" text,
	"composer" text,
	"lyrics" text,
	"language" text,
	"explicit" boolean DEFAULT false,
	"is_live" boolean DEFAULT false,
	"is_cover" boolean DEFAULT false,
	"is_remix" boolean DEFAULT false,
	"is_instrumental" boolean DEFAULT false,
	"isrc" text,
	"partner_code" text,
	"preview_start" text,
	"instant_gratification" boolean DEFAULT false,
	"focus_track" boolean DEFAULT false,
	"version" text,
	"copyright_share" text,
	"related_rights_share" text,
	"copyright_percent" text,
	"neighboring_rights_percent" text,
	"persons_json" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"snowflakes_enabled" boolean DEFAULT false,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"role" text DEFAULT 'artist' NOT NULL,
	"contract_type" text,
	"country" text,
	"step" integer DEFAULT 0 NOT NULL,
	"passport_data" text,
	"address_data" text,
	"bank_data" text,
	"npd_confirmed" boolean DEFAULT false,
	"final_confirmed" boolean DEFAULT false,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" text,
	"reviewed_at" text,
	"reviewed_by" text,
	"admin_comment" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount_rub" text DEFAULT '0' NOT NULL,
	"amount_usd" text DEFAULT '0' NOT NULL,
	"description" text,
	"report_id" integer,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_id_artists_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_analytics" ADD CONSTRAINT "artist_analytics_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_payment_details" ADD CONSTRAINT "artist_payment_details_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_wallets" ADD CONSTRAINT "artist_wallets_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_manager_id_artists_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_submissions" ADD CONSTRAINT "lyrics_submissions_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_submissions" ADD CONSTRAINT "lyrics_submissions_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_actions" ADD CONSTRAINT "manager_actions_manager_id_artists_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_created_by_artists_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitchings" ADD CONSTRAINT "pitchings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitchings" ADD CONSTRAINT "pitchings_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_history" ADD CONSTRAINT "release_history_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_message_id_ticket_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ticket_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_artists_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_artists_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_report_id_financial_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."financial_reports"("id") ON DELETE no action ON UPDATE no action;