# Deploy (free tier): Vercel + Render + Supabase

This guide gets the waitlist app live at **$0/month** using:

- **Vercel** (or **Netlify**) – Next.js frontend
- **Render** – Express backend (free; sleeps after 15 min inactivity)
- **Supabase** – PostgreSQL (free; may pause after 1 week inactivity)

Trade-off: first request after idle can take ~30–60 seconds while Render and/or Supabase wake up.

---

## 1. Database: Supabase

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in with GitHub.
2. **New project** → pick org, name (e.g. `sparkeefy-waitlist`), DB password, region → **Create**.
3. In the project: **Settings** → **Database** → under **Connection string** choose **URI** and copy it.
4. It looks like:  
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`  
   Replace `[YOUR-PASSWORD]` with your actual DB password and save it; you’ll use it as `DATABASE_URL`.

---

## 2. Backend: Render

1. Push this repo to GitHub (if you haven’t already).
2. Go to [render.com](https://render.com) → **Get started** → sign in with GitHub.
3. **New** → **Web Service**.
4. Connect the repo and pick the branch (e.g. `main`).
5. Configure:
   - **Name:** `waitlist-api` (or any name).
   - **Region:** same as Supabase if possible (e.g. Oregon).
   - **Runtime:** Node.
   - **Build command:**  
     `pnpm install && pnpm prisma generate`
   - **Start command:**  
     `pnpm run start:prod`
   - **Instance type:** **Free**.
6. **Environment** – add these (required and recommended from `.env.example`):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (Render sets this; you can leave it) |
   | `DATABASE_URL` | Your Supabase connection string from step 1 |
   | `FRONTEND_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (add after step 3) |
   | `CORS_ORIGIN` | Same as `FRONTEND_URL`, or `https://your-app.vercel.app,https://your-custom.com` |
   | `SESSION_COOKIE_NAME` | `sparkeefy_session` (or keep default) |
   | `SESSION_DURATION_DAYS` | `30` |

   Optional: `SMTP_*` for emails (see `.env.example`).

7. **Advanced** → **Pre-deploy command** (optional; runs migrations before each deploy):  
   `pnpm prisma migrate deploy`  
   (If you use the repo’s `render.yaml` blueprint, this is already set.)

8. **Create Web Service**. Wait for the first deploy. Note the service URL, e.g.  
   `https://waitlist-api-xxxx.onrender.com`  
   Your tRPC base URL is that + `/trpc`, e.g.  
   `https://waitlist-api-xxxx.onrender.com/trpc`.

9. In Render, open the service → **Environment** and add/update:
   - `FRONTEND_URL` = your Vercel URL (from step 3).
   - `CORS_ORIGIN` = same as `FRONTEND_URL` (and any other frontend origins).  
   Redeploy if you change these.

---

## 3. Frontend: Vercel (or Netlify)

**Vercel:**  
1. Go to [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New** → **Project** → import this repo.
3. **Configure:**
   - **Framework Preset:** Next.js.
   - **Build Command:** `pnpm run build` (or leave default).
   - **Output Directory:** leave default (Next.js).
4. **Environment variables** – add:

   | Key | Value |
   |-----|--------|
   | `NEXT_PUBLIC_API_URL` | Your Render tRPC URL, e.g. `https://waitlist-api-xxxx.onrender.com/trpc` |

5. **Deploy**. After deploy, copy the project URL (e.g. `https://your-app.vercel.app`).
6. In **Render** (step 2), set `FRONTEND_URL` and `CORS_ORIGIN` to that frontend URL and redeploy the backend.

**Netlify:** The repo already has `netlify.toml`. In Netlify: **Add new site** → **Import from Git** → choose repo → set **Build command** to `pnpm run build`, **Publish directory** to `.next` (or leave default if using the Next.js plugin). Add `NEXT_PUBLIC_API_URL` as above, then use the Netlify site URL for `FRONTEND_URL` / `CORS_ORIGIN` in Render.

---

## Troubleshooting: "Failed to connect to database" (P1001)

If Render logs **PrismaClientInitializationError** / **P1001**:

1. **Set `DATABASE_URL` in Render**  
   Render does **not** use a `.env` file. In **Dashboard → your Web Service → Environment**, add:
   - **Key:** `DATABASE_URL`  
   - **Value:** your full Supabase (or Postgres) connection string.

2. **Use the correct Supabase connection string**  
   In Supabase: **Settings → Database**:
   - Use **Connection pooling** (recommended for serverless), **Transaction** mode.
   - Copy the **URI** and replace `[YOUR-PASSWORD]` with your database password.
   - If the password contains `@`, `#`, `%`, etc., [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) it (e.g. `%40` for `@`).

3. **Wake Supabase if it’s paused**  
   Free-tier projects pause after about a week of no use. Open the project in the Supabase dashboard; it will resume and the next Render deploy should connect.

4. **Redeploy after changing env**  
   After adding or changing environment variables in Render, use **Manual Deploy → Deploy latest commit** so the new values are used.

---

## 4. Check it works

- Open your Vercel URL and join the waitlist. The first request after idle may be slow (cold start).
- If you see CORS or “failed to fetch” errors, double-check:
  - `NEXT_PUBLIC_API_URL` on Vercel = `https://<your-render-service>.onrender.com/trpc`
  - `FRONTEND_URL` and `CORS_ORIGIN` on Render = your Vercel URL (and any custom domains).

---

## Optional: Custom domain

- **Vercel:** Project → **Settings** → **Domains** → add your domain.
- **Render:** Service → **Settings** → **Custom Domains** → add domain and follow DNS instructions.
- After adding a domain, update `FRONTEND_URL`, `CORS_ORIGIN`, and `NEXT_PUBLIC_API_URL` if the frontend or API URL changes.

---

## Summary

| Service | Role | URL you need |
|--------|------|----------------|
| Supabase | PostgreSQL | `DATABASE_URL` (connection string) |
| Render | Express API | `https://<name>.onrender.com` → use `.../trpc` for `NEXT_PUBLIC_API_URL` |
| Vercel | Next.js app | Set as `FRONTEND_URL` and `CORS_ORIGIN` in Render |

All three have free tiers; the main limitation is cold starts after inactivity.
