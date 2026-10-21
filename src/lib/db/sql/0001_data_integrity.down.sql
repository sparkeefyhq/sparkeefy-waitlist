-- Undo 0001. Refuses while any imported or synthetic rows remain: roll those
-- batches back first (scripts/waitlist/import.ts --rollback / seed-synthetic.ts --rollback).
BEGIN;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM waitlist_users WHERE data_source <> 'organic') THEN
    RAISE EXCEPTION 'Imported or synthetic rows still exist; roll their batches back first.';
  END IF;
END $$;

DROP INDEX IF EXISTS waitlist_users_referral_code_ci_uq;
DROP INDEX IF EXISTS waitlist_users_source_record_uq;
DROP INDEX IF EXISTS waitlist_users_created_at_idx;
DROP INDEX IF EXISTS waitlist_users_batch_idx;
DROP INDEX IF EXISTS referrals_batch_idx;

ALTER TABLE referrals
  DROP CONSTRAINT IF EXISTS referrals_no_self_chk,
  DROP CONSTRAINT IF EXISTS referrals_data_source_chk,
  DROP COLUMN IF EXISTS import_batch_id,
  DROP COLUMN IF EXISTS data_source;

ALTER TABLE waitlist_users
  DROP CONSTRAINT IF EXISTS waitlist_users_data_source_chk,
  DROP CONSTRAINT IF EXISTS waitlist_users_synthetic_flag_chk,
  DROP CONSTRAINT IF EXISTS waitlist_users_synthetic_email_chk,
  DROP CONSTRAINT IF EXISTS waitlist_users_synthetic_unsent_chk,
  DROP CONSTRAINT IF EXISTS waitlist_users_import_batch_chk,
  DROP COLUMN IF EXISTS welcome_email_status,
  DROP COLUMN IF EXISTS imported_at,
  DROP COLUMN IF EXISTS source_record_id,
  DROP COLUMN IF EXISTS import_batch_id,
  DROP COLUMN IF EXISTS is_synthetic,
  DROP COLUMN IF EXISTS data_source;

DROP TABLE IF EXISTS import_batches;
-- waitlist_deletions is kept on purpose: it may hold the only copy of deleted rows.

COMMIT;
