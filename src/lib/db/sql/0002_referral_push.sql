-- ============================================================================
-- 0002 — Referral push email tracking
-- ============================================================================
-- Additive and idempotent. Records when each user got the "invite friends"
-- email so nobody is emailed twice. Apply after 0001:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f src/lib/db/sql/0002_referral_push.sql
-- Undo: ALTER TABLE waitlist_users DROP COLUMN IF EXISTS referral_push_sent_at;
-- ============================================================================

ALTER TABLE waitlist_users ADD COLUMN IF NOT EXISTS referral_push_sent_at timestamp;
