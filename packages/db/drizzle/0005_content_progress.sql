CREATE TABLE IF NOT EXISTS "content_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "uq_content_progress_user_item" UNIQUE("user_id","item_type","item_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_progress_user_item" ON "content_progress" USING btree ("user_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_progress_updated" ON "content_progress" USING btree ("user_id","updated_at");
