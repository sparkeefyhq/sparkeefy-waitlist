# Handover: move the waitlist to the sparkeefy@gmail.com Vercel account

For Rahul. The code is ready. `main` builds cleanly as a standard Next.js 16 app and needs no `vercel.json`. Everything below is account and settings work that has to be done by someone logged in to the accounts.

The site (sparkeefy.com) currently runs on a Vercel account owned by the previous developer. The goal is a new project under **sparkeefy@gmail.com** that serves sparkeefy.com with all the existing signups.

---

## 0. Before you start

You need:
- **The old Vercel project:** a login, or the previous developer on a call. You need it to read the old settings (`DATABASE_URL`, etc.) and to release the domain.
- **The domain registrar login** for sparkeefy.com, wherever the DNS is managed.
- **A Resend account** that Sparkeefy owns and that has the sparkeefy.com sending domain verified.

> Shortcut: if the previous developer can still log in, Vercel can **transfer the whole project** to another account (Project → Settings → General → Transfer Project). That moves domains and env vars in one go. If that works, skip to step 4 and still do step 5 (new Resend key). Otherwise, follow every step.

## 1. Merge the open PRs into `main`

- **Deploy docs PR** (this file, corrected `DEPLOY.md`, leaked key removed from `.env.example`)
- **https://github.com/sparkeefyhq/sparkeefy-waitlist/pull/27**: script to restore the backup signups (step 7)

## 2. Database

In the **old** Vercel project, open Settings → Environment Variables → `DATABASE_URL` and look at the host to see where the database lives (e.g. `supabase.co`, `neon.tech`).

**A. The database is already in an account Sparkeefy owns:** reuse the same `DATABASE_URL` in the new project. No data move is needed.

**B. The database is in the previous developer's account (more likely):** move it to one Sparkeefy owns.
1. Create a Postgres database owned by sparkeefy@gmail.com, either Supabase directly or Vercel → Storage → Create Database. Use the **pooled** connection string as `DATABASE_URL`, since the app runs serverless.
2. Copy all tables and data (needs `pg_dump`/`psql` at least as new as the old server's Postgres version):
   ```bash
   pg_dump --no-owner --no-acl "$OLD_DATABASE_URL" | psql "$NEW_DATABASE_URL"
   ```
3. Check the copy:
   ```bash
   psql "$NEW_DATABASE_URL" -c "select count(*) from waitlist_users"
   ```
   It should match "Total signups" in the old admin panel (1,916 on Oct 18, 2026).

Only if you are starting from an **empty** database instead of copying: create the tables with `DATABASE_URL="..." npm run db:push`.

## 3. Create the Vercel project

1. Log in to vercel.com as **sparkeefy@gmail.com** → Add New → Project → Import Git Repository.
2. Give the Vercel GitHub app access to `sparkeefyhq/sparkeefy-waitlist` when asked, then pick the repo.
3. Leave the framework (Next.js), root directory, and build/install commands on their defaults. The repo has a `package-lock.json`, so Vercel uses npm.
4. Add these environment variables for Production (and Preview if you use it):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | From step 2 |
   | `ADMIN_SECRET` | A **new** strong password; it is the login for `/admin` |
   | `RESEND_API_KEY` | A **new** key from step 5 |
   | `RESEND_WEBHOOK_SECRET` | From step 5. It can be added after the first deploy; redeploy after adding it. |
   | `EMAIL_FROM` | Optional; default `Sparkeefy <welcome@sparkeefy.com>` |

5. Deploy.

## 4. Check the new deployment (on its `*.vercel.app` URL)

- `/api/health` → shows `"status":"ok"`. If it says `degraded`, the database connection is wrong.
- `/admin/login` with the new `ADMIN_SECRET` → signups are listed and the count matches step 2.
- `/join` → sign up with a test email → it appears in `/admin` and the welcome email arrives. Delete the test row afterwards.

## 5. Resend (emails)

- **Revoke the old API key.** A real-looking Resend key (`re_eVfJ…`) was committed in `.env.example` and is in the git history. In Resend → API Keys, revoke it and create a new one for `RESEND_API_KEY`.
- Resend → Webhooks → add an endpoint for `https://sparkeefy.com/api/resend/webhook` (use the `vercel.app` URL until step 6 is done). Copy its signing secret into `RESEND_WEBHOOK_SECRET` and redeploy.
- If the old Resend account belonged to the previous developer, verify sparkeefy.com in Sparkeefy's own Resend account. Resend shows the DNS records to add.

## 6. Move the domain

1. Old Vercel project → Settings → Domains → remove `sparkeefy.com` and `www.sparkeefy.com`.
2. New project → Settings → Domains → add both. Vercel shows the exact DNS records (and a TXT verification record if the domain is still claimed elsewhere). Set them at the registrar.
3. Once the new project shows the domains as valid, open https://sparkeefy.com and repeat the step 4 checks.

The Google Search Console verification file is in `public/`, so it moves with the code.

## 7. Restore the backup signups

After steps 2–4, on a machine with the repo, `npm install` run, and the new `DATABASE_URL` in `.env`:

```bash
npm run restore-signups -- sparkeefy_signups_backup.csv           # dry run: shows how many would be added
npm run restore-signups -- sparkeefy_signups_backup.csv --apply   # writes them
```

- The CSV (1,000 emails) comes from the founder.
- The script skips emails already on the list and sends no emails.
- The backup has no signup dates. Each restored row gets **Feb 19, 2026** and the remark **"Restored from backup - original date approx. Feb 19-20, 2026"**, which shows in the admin Remarks column.
- **Don't click "Send all unsent"** in `/admin` afterwards unless all ~1,000 restored people should get the welcome email now.

## 8. Clean up

- After the new site has run fine for a few days, delete the old Vercel project and the old database (if the data was copied), and remove the previous developer's access to anything Sparkeefy keeps.
- Optional: the current list includes obvious test or throwaway signups (e.g. `explorer@example.com`, `ghhhh@ghh.bn`, and addresses on temporary-email domains like `ensproxy.com` and `moravita.com`). Worth reviewing before sharing numbers.
