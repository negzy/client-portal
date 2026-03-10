# Deploy to Vercel

## Add this project to Vercel (quick)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```
2. **Vercel** → [vercel.com](https://vercel.com) → **Add New…** → **Project** → import your repo.
3. **Settings:** Framework = Next.js, Root = `.`, Build = `npm run build` (default).
4. **Environment variables** (Settings → Environment Variables). Use **only letters, numbers, underscore** in variable **names**:

   | Variable | Value | Required |
   |----------|--------|----------|
   | `DATABASE_URL` | Postgres URL. **Supabase:** use the **Transaction** pooler string (host `aws-0-XX.pooler.supabase.com`, port **6543**), not the direct DB host (`db.xxx.supabase.co`). Add `?pgbouncer=true` at the end. | Yes |
   | `NEXTAUTH_SECRET` | e.g. `openssl rand -base64 32` | Yes |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` (no trailing slash) | Yes |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (same as your DB project) | For uploads |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | For uploads |
   | `RESEND_API_KEY` | Resend key (optional) | No |
   | `EMAIL_FROM` | Sender (optional) | No |

5. **Deploy** (or Redeploy after adding env vars).
6. **Database:** run `npx prisma db push` once against your production DB (same `DATABASE_URL`).

---

## 1. Push your code to GitHub

If you haven’t already:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. Import your GitHub repo (e.g. `TCH-Portal`).
4. Leave **Framework Preset** as Next.js and **Root Directory** as `.`.
5. **Build Command:** `npm run build` (already runs `prisma generate && next build`).
6. **Output Directory:** leave default (Next.js).
7. Click **Deploy** (it will fail until env vars are set; add them next).

## 3. Environment variables

In the Vercel project: **Settings** → **Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Your Postgres connection string | **Required.** For Supabase, use the **Connection pooling** (transaction) URL (e.g. port **6543**) so serverless doesn’t exhaust connections. |
| `NEXTAUTH_SECRET` | A long random string | **Required.** e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL | **Required.** e.g. `https://your-app.vercel.app` (no trailing slash). Update after first deploy if the URL changes. |
| `RESEND_API_KEY` | Your Resend API key | Optional; needed for password reset and message notification emails. |
| `EMAIL_FROM` | Sender address | Optional; e.g. `CreditLyft <notify@yourdomain.com>` if using Resend. |

After adding variables, go to **Deployments** → … on the latest deployment → **Redeploy**.

## 4. Database

- Run migrations (or `prisma db push`) against your **production** database before or right after first deploy.
- Use the same `DATABASE_URL` you set in Vercel. For Supabase, prefer the **pooler** URL for serverless.

## 5. Post-deploy

1. Open `https://your-app.vercel.app`.
2. Create an account or sign in.
3. Set `NEXTAUTH_URL` to the final URL if you used a placeholder (then redeploy).

---

## File uploads (Supabase Storage)

Uploads use **Supabase Storage** when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (onboarding, Document Vault, Credit Import, audit PDFs). Without them, uploads fail on Vercel.

**To enable (same Supabase project as your DB):**

1. **Supabase Dashboard** → **Storage** → **New bucket** → name: **`portal-uploads`** → set to **Public** (so download links work).
2. **Project Settings** → **API** → copy **Project URL** and **service_role** (secret) key.
3. In **Vercel** → **Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL (e.g. `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key
4. **Redeploy.**

Local dev uses the `uploads/` folder when these env vars are not set.

For a production setup, you’d switch to **Vercel Blob** or **S3** (or similar) and change the upload/download routes to use that storage. The app will still run on Vercel for auth, dashboard, messages, profile, and tasks; only file-based features (vault, credit PDF upload, audit PDFs) need storage changes for full production use.
