CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_access_surveys" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"q1_answer" varchar(1) NOT NULL,
	"q2_answer" varchar,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone_number" varchar(20),
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"additional_remarks" varchar,
	"referral_code" varchar(8) NOT NULL,
	"session_token" varchar(64) NOT NULL,
	"session_expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"magic_link_token" varchar(64) NOT NULL,
	CONSTRAINT "waitlist_users_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_users_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "waitlist_users_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "waitlist_users_magic_link_token_unique" UNIQUE("magic_link_token")
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_waitlist_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."waitlist_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_waitlist_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."waitlist_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_access_surveys" ADD CONSTRAINT "slack_access_surveys_user_id_waitlist_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."waitlist_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_referral" ON "referrals" USING btree ("referrer_id","referee_id");--> statement-breakpoint
CREATE INDEX "referrals_referrer_id_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referrals_referee_id_idx" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "waitlist_users_email_idx" ON "waitlist_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_users_referral_code_idx" ON "waitlist_users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "waitlist_users_session_token_idx" ON "waitlist_users" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "waitlist_users_magic_link_token_idx" ON "waitlist_users" USING btree ("magic_link_token");