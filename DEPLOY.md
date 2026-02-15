# Deploy: Next.js Waitlist App

This app is a **single Next.js service** (no separate backend). Deploy to one host and point it at a PostgreSQL database.

---

## What You Need

| Item | Purpose |
|------|--------|
| **PostgreSQL** | Database (Supabase, Neon, Render Postgres, etc.) |
| **Host** | Vercel, Netlify, or Render (Node runtime) |
| **Env vars** | See below |

---

## Required Environment Variables

Set these on your host (Vercel / Netlify / Render → Project → Environment variables).

| Key | Required | Description |
|-----|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (e.g. from Supabase) |
| `NODE_ENV` | No | `production` (hosts usually set this) |
| `PORT` | No | Set by host (e.g. Vercel/Render); default `4000` |
| `CORS_ORIGIN` | No | Default `*` (single app; rarely needed) |

---

## Option A: Vercel + Supabase (free tier)

1. **Database (Supabase)**  
   - [supabase.com](https://supabase.com) → New project → create DB.  
   - **Settings → Database** → Connection string (URI).  
   - Use **Connection pooling** (Transaction mode) for serverless.  
   - Copy URI and replace `[YOUR-PASSWORD]` → this is your `DATABASE_URL`.

2. **App (Vercel)**  
   - [vercel.com](https://vercel.com) → Add New → Project → import this repo.  
   - **Framework:** Next.js (auto-detected).  
   - **Build command:** `bun run build` (or `bun build`).  
   - **Environment variables:** Add `DATABASE_URL`.  
   - Deploy.

3. **Migrations**  
   - Run once locally (or from CI) before/after first deploy:  
     `DATABASE_URL="your-supabase-uri" bun run db:migrate`  
   - Or use Vercel’s “Build” or “Pre-deploy” step to run `bun run db:migrate` if you add it to your pipeline.

---

## Option B: Netlify + Supabase

1. **Database:** Same as Option A (Supabase → `DATABASE_URL`).

2. **App (Netlify):**  
   - Add site from Git → choose repo.  
   - **Build command:** `bun run build`.  
   - **Publish directory:** `.next` (or use Netlify’s Next.js plugin defaults).  
   - Add env vars: `DATABASE_URL`.

3. **Migrations:** Run `bun run db:migrate` locally with `DATABASE_URL` or from your CI.

---

## Option C: Render (single service)

The repo includes `render.yaml` for a single Next.js web service.

1. **Database:** Create a PostgreSQL instance on Render (or use Supabase/Neon) and copy `DATABASE_URL`.

2. **Web Service:**  
   - [render.com](https://render.com) → New → Web Service → connect repo.  
   - Or use **Blueprint** and attach `render.yaml`.  
   - **Build:** `bun install && bun run build`  
   - **Start:** `bun run start`  
   - **Pre-deploy (optional):** `bun run db:migrate`

3. **Environment:** In Render Dashboard → Service → Environment, set `DATABASE_URL`.

---

## Running Migrations

Migrations are Drizzle files in `src/lib/db/migrations/`. Run them against your production DB once (and after adding new migrations):

```bash
DATABASE_URL="postgresql://..." bun run db:migrate
```

Use your production `DATABASE_URL` (e.g. Supabase URI). You can run this from your machine or from a deploy step.

---

## Checklist Before Go-Live

- [ ] `DATABASE_URL` set on the host and migrations run.
- [ ] Build succeeds (`bun run build`).
- [ ] Open `/join` and submit an email; check DB for the new row.
---

## Troubleshooting

**“Failed to connect to database”**  
- Confirm `DATABASE_URL` is set in the host’s environment (not only in `.env` locally).  
- Use the **pooler** URI from Supabase (port 6543) for serverless.  
- If the password has `@`, `#`, `%`, etc., URL-encode them (e.g. `%40` for `@`).

**Supabase paused (free tier)**  
- Free projects pause after inactivity. Open the Supabase project in the dashboard to wake it; then retry.

---

## Summary

| What | Where |
|------|--------|
| **App** | One Next.js app (Vercel, Netlify, or Render). |
| **Database** | PostgreSQL (`DATABASE_URL`) — e.g. Supabase. |
| **Migrations** | Run `bun run db:migrate` with production `DATABASE_URL`. |
| **Env vars** | `DATABASE_URL` required. |
