# Waitlist data tools

Production numbers come only from real signups. Synthetic data lives only in a
staging/local database, is labelled everywhere, and can never be emailed.

| Tool | Where it may run | What it does |
|---|---|---|
| `validate.ts` | anywhere (read-only) | Metrics + every integrity invariant as an explicit SQL query |
| `import.ts` | production | Restores genuine signups (e.g. from a pre-deletion backup). Dry-run by default |
| `seed-synthetic.ts` | staging / local only | Fictional test users to hit target totals for load/UI testing |

Run with Node 24 (native TypeScript). `DATABASE_URL` comes from the environment or `.env`.

## 1. Apply the migration (once per database, before deploying this code)

```bash
pg_dump --format=custom -f before-0001.dump "$DATABASE_URL"   # backup first
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f src/lib/db/sql/0001_data_integrity.sql
npm run waitlist:validate
```

Additive and idempotent: existing rows become `data_source = 'organic'`, nothing is
rewritten. Deploy the app **after** this; the new code reads the new columns.
Undo: `src/lib/db/sql/0001_data_integrity.down.sql`. Don't run `db:push` against
production; schema changes ship as SQL in `src/lib/db/sql/`.

## 2. Restore deleted signups (production)

Export from the backup, restored to a separate branch/project (never over prod):

```sql
\copy (SELECT * FROM waitlist_users) TO 'users.csv' CSV HEADER
\copy (SELECT * FROM referrals)      TO 'referrals.csv' CSV HEADER
```

```bash
npm run waitlist:import -- --users users.csv --referrals referrals.csv --timestamp-tz UTC \
  --source "supabase backup 2026-03-01" --evidence "pre-deletion backup of the live waitlist"
# review the preview and .backups/import-report-*.csv, then:
npm run waitlist:import -- ...same flags... --apply --expect-users N --expect-referrals M
npm run waitlist:validate
```

- Keeps original ids, timestamps, referral codes and magic-link tokens, so old links keep working.
- Rows already present (same id/email/source id) are skipped: re-running is safe.
- Never invents dates, referrals or "email sent" states. Rows with no real timestamp are rejected.
- Restored rows without a recorded welcome email are `held_import`: excluded from "Send all".
- Runs `pg_dump` of the waitlist tables before writing (`--skip-backup "<provider backup id>"` to opt out).
- One transaction. Any failure writes nothing and leaves a `failed` row in `import_batches`.
- `--list` shows batches; `--rollback <batch-id>` removes exactly that batch.

Accepted CSV columns: `email`, `created_at` (required), `id`, `username`, `first_name`,
`last_name`, `phone_number`, `marketing_opt_in`, `additional_remarks`, `referral_code`,
`magic_link_token`, `welcome_email_sent_at`, `source_record_id`, `referred_by_email` or
`referred_by_code`. Only import people who actually signed up. Bought, scraped or
"free bulk" email lists are rejected by policy: they are not signups, emailing them is
spam under India's DPDP Act, and it gets the sending domain blocked.

## 3. Synthetic staging data

```bash
T=$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(u.hostname+(u.port?":"+u.port:"")+u.pathname)')
npm run waitlist:seed -- --confirm-target $T --init-environment staging   # once
npm run waitlist:seed -- --confirm-target $T --seed sparkeefy-2026 \
  --total 7143 --referrals 3071 --last7 10 --spike-total 4000            # preview
npm run waitlist:seed -- ...same... --apply
npm run waitlist:validate -- --expect-total 7143 --expect-referrals 3071 --expect-last7 10
npm run waitlist:seed -- --confirm-target $T --rollback <batch-id>
```

Targets are final totals: the tool counts what is already there and adds the difference.
Refuses unless NODE_ENV/VERCEL_ENV is not production, the DB carries a staging marker,
and `--confirm-target` matches. Emails are `@seed.sparkeefy.test`; the schema rejects a
synthetic row with a deliverable address or a "sent" email, and the app never sends to `.test`.
The 19–20 Feb spike is **synthetic scenario data**, not campaign performance.

## Tests

```bash
TEST_PG_URL=postgresql://user@localhost:5432/postgres npm run test:data
```

Creates and drops its own database. Covers the planner, double imports, failure part-way
through, rollback safety, the production guards and the schema constraints.
