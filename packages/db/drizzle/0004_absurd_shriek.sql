ALTER TYPE "public"."user_role" ADD VALUE 'parent';--> statement-breakpoint
CREATE TABLE "parent_invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"used_by_parent_id" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" text NOT NULL,
	"student_user_id" text NOT NULL,
	"relation" text DEFAULT 'parent' NOT NULL,
	"verified_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "uq_parent_student" UNIQUE("parent_user_id","student_user_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "parent_invite_codes" ADD CONSTRAINT "parent_invite_codes_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_invite_codes" ADD CONSTRAINT "parent_invite_codes_used_by_parent_id_user_id_fk" FOREIGN KEY ("used_by_parent_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_parent_user_id_user_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_parent_invite_codes_code" ON "parent_invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_parent_invite_codes_student" ON "parent_invite_codes" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX "idx_parent_links_parent" ON "parent_links" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "idx_parent_links_student" ON "parent_links" USING btree ("student_user_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number");