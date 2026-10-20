/**
 * Who each bulk email may go to, as SQL conditions on `waitlist_users`.
 * Shared by the app (via sql.raw) and the data-tool tests so they cannot drift.
 * Synthetic rows (.test addresses) and restored-but-held rows never qualify.
 */

/** "Send all unsent" welcome emails: real, organic signups never emailed. */
export const BULK_WELCOME_ELIGIBLE_SQL = `(welcome_email_sent_at IS NULL AND NOT is_synthetic
  AND data_source = 'organic' AND welcome_email_status IS NULL)`;

/**
 * Referral push: real signups who already got their welcome email, ticked
 * marketing opt-in, and have not had this email yet.
 */
export const REFERRAL_PUSH_ELIGIBLE_SQL = `(NOT is_synthetic AND marketing_opt_in
  AND welcome_email_sent_at IS NOT NULL AND referral_push_sent_at IS NULL
  AND email NOT LIKE '%.test')`;
