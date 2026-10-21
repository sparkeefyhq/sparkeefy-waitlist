-- 0002: backup list (21 Oct 2026).
-- The xlsx backup ("Backup referrals.xlsx", 5,397 rows: email, referral count,
-- date signed up) is shown on /admin in its own section. It lives in its own
-- table so it is never counted as signups/referrals and never emailed: those
-- read waitlist_users/referrals only. Additive and idempotent.
CREATE TABLE IF NOT EXISTS backup_list (
  id                     serial       PRIMARY KEY,
  email                  varchar(255) NOT NULL UNIQUE,
  backup_signed_up_at    timestamp,
  backup_referral_count  integer      NOT NULL DEFAULT 0 CHECK (backup_referral_count >= 0),
  source                 varchar(255) NOT NULL,
  imported_at            timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);
CREATE INDEX IF NOT EXISTS backup_list_signed_up_idx ON backup_list (backup_signed_up_at DESC);
