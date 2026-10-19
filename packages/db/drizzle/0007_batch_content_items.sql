DO $$ BEGIN
 CREATE TYPE "public"."content_item_kind" AS ENUM('youtube', 'pdf', 'link', 'video_hosted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"section" text,
	"title" text NOT NULL,
	"kind" "public"."content_item_kind" DEFAULT 'pdf' NOT NULL,
	"youtube_video_id" text,
	"storage_key" text,
	"url" text,
	"size_bytes" bigint,
	"page_count" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_items" ADD CONSTRAINT "content_items_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_items" ADD CONSTRAINT "content_items_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_items" ADD CONSTRAINT "content_items_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_items_batch" ON "content_items" USING btree ("batch_id","subject_id","chapter_id","sort_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_items_chapter" ON "content_items" USING btree ("chapter_id","kind");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_chapter_links" (
	"batch_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "batch_chapter_links_batch_id_chapter_id_pk" PRIMARY KEY("batch_id","chapter_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_chapter_links" ADD CONSTRAINT "batch_chapter_links_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_chapter_links" ADD CONSTRAINT "batch_chapter_links_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_chapter_links_chapter" ON "batch_chapter_links" USING btree ("chapter_id");
