ALTER TABLE "waitlist_users" DROP CONSTRAINT "waitlist_users_session_token_unique";--> statement-breakpoint
DROP INDEX "waitlist_users_session_token_idx";--> statement-breakpoint
ALTER TABLE "waitlist_users" DROP COLUMN "session_token";--> statement-breakpoint
ALTER TABLE "waitlist_users" DROP COLUMN "session_expires_at";