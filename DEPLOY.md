# Deploy to Vercel

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

## File uploads (vault, credit reports, etc.)

The app currently stores uploaded files on the **local filesystem** (`uploads/`). On Vercel the filesystem is read-only and ephemeral, so:

- **Uploads will not persist** across requests or redeploys.
- You may see write errors when uploading documents or credit reports.

For a production setup, you’d switch to **Vercel Blob** or **S3** (or similar) and change the upload/download routes to use that storage. The app will still run on Vercel for auth, dashboard, messages, profile, and tasks; only file-based features (vault, credit PDF upload, audit PDFs) need storage changes for full production use.
