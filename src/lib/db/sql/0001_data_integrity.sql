-- ============================================================================
-- 0001 — Waitlist data integrity: provenance, import batches, delete archive
-- ============================================================================
-- Additive and idempotent: safe to run more than once, never rewrites or
-- deletes existing rows. Every existing row becomes data_source = 'organic'.
--
-- Apply (take a backup first):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f src/lib/db/sql/0001_data_integrity.sql
-- Undo: src/lib/db/sql/0001_data_integrity.down.sql
-- ============================================================================

BEGIN;

-- Who created a batch of rows, from what, and whether it is still applied.
CREATE TABLE IF NOT EXISTS import_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            varchar(32)  NOT NULL CHECK (kind IN ('historical_import', 'synthetic_seed')),
  source          varchar(255) NOT NULL,
  source_sha256   char(64),
  evidence        text,
  status          varchar(16)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'applied', 'failed', 'rolled_back')),
  operator        varchar(100),
  params          jsonb        NOT NULL DEFAULT '{}'::jsonb,
  report          jsonb        NOT NULL DEFAULT '{}'::jsonb,
  user_count      integer      NOT NULL DEFAULT 0,
  referral_count  integer      NOT NULL DEFAULT 0,
  created_at      timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  applied_at      timestamp,
  rolled_back_at  timestamp
);

-- Provenance on every signup.
ALTER TABLE waitlist_users
  ADD COLUMN IF NOT EXISTS data_source          varchar(32)  NOT NULL DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS is_synthetic         boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_batch_id      uuid REFERENCES import_batches(id),
  ADD COLUMN IF NOT EXISTS source_record_id     varchar(255),
  ADD COLUMN IF NOT EXISTS imported_at          timestamp,
  ADD COLUMN IF NOT EXISTS welcome_email_status varchar(32);

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS data_source     varchar(32) NOT NULL DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id);

-- Invariants the database itself enforces, so no script can get them wrong.
DO $$ BEGIN
  ALTER TABLE waitlist_users ADD CONSTRAINT waitlist_users_data_source_chk
    CHECK (data_source IN ('organic', 'historical_import', 'synthetic_seed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- is_synthetic and data_source can never disagree.
  ALTER TABLE waitlist_users ADD CONSTRAINT waitlist_users_synthetic_flag_chk
    CHECK (is_synthetic = (data_source = 'synthetic_seed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- Synthetic rows only ever use reserved, undeliverable .test addresses,
  -- and real rows can never use them.
  ALTER TABLE waitlist_users ADD CONSTRAINT waitlist_users_synthetic_email_chk
    CHECK (is_synthetic = (email LIKE '%.test')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- A synthetic row can never be recorded as having been emailed.
  ALTER TABLE waitlist_users ADD CONSTRAINT waitlist_users_synthetic_unsent_chk
    CHECK (NOT is_synthetic OR (welcome_email_sent_at IS NULL AND welcome_email_status = 'suppressed_synthetic'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE waitlist_users ADD CONSTRAINT waitlist_users_import_batch_chk
    CHECK ((data_source = 'organic') = (import_batch_id IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE referrals ADD CONSTRAINT referrals_no_self_chk CHECK (referrer_id <> referee_id) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE referrals ADD CONSTRAINT referrals_data_source_chk
    CHECK (data_source IN ('organic', 'historical_import', 'synthetic_seed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Idempotent imports: one row per stable source identifier.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_users_source_record_uq
  ON waitlist_users (source_record_id) WHERE source_record_id IS NOT NULL;

-- Dashboard: last-7-days, ordering, pagination, filters.
CREATE INDEX IF NOT EXISTS waitlist_users_created_at_idx ON waitlist_users (created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_users_batch_idx ON waitlist_users (import_batch_id) WHERE import_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_batch_idx ON referrals (import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Referral codes are looked up case-insensitively (lower(code) = lower(input))
-- but were generated case-sensitively. Enforce case-insensitive uniqueness
-- only if the existing data allows it; otherwise report and leave it.
DO $$ BEGIN
  IF EXISTS (
    SELECT lower(referral_code) FROM waitlist_users GROUP BY 1 HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'Skipped waitlist_users_referral_code_ci_uq: case-insensitive duplicate referral codes exist. Run scripts/waitlist/validate.ts.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS waitlist_users_referral_code_ci_uq ON waitlist_users (lower(referral_code));
  END IF;
END $$;

-- The admin "Delete" button used to remove rows with no trace. Every delete
-- now archives the full row and its referrals here first, so it can be undone.
CREATE TABLE IF NOT EXISTS waitlist_deletions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  email       varchar(255) NOT NULL,
  user_row    jsonb       NOT NULL,
  referrals   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  deleted_by  varchar(100) NOT NULL DEFAULT 'admin',
  deleted_at  timestamp   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  restored_at timestamp
);
CREATE INDEX IF NOT EXISTS waitlist_deletions_email_idx ON waitlist_deletions (email);

COMMIT;
