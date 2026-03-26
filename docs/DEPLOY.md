# Deploy CreditLyft Portal (TCH Portal)

## Quick deploy — Vercel (recommended)

1. **Push your code** to GitHub (or GitLab/Bitbucket).

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New → Project.
   - Import your repo. Vercel will detect Next.js.

3. **Environment variables** (Project → Settings → Environment Variables)

   Set these for **Production** (and Preview if you want):

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `DATABASE_URL` | Yes | Use Supabase **Transaction pooler** only on Vercel (port **6543**, not Session, not direct 5432). See **Supabase `DATABASE_URL` checklist** below. |
   | `NEXTAUTH_SECRET` | Yes | Generate: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Yes | Your production URL, e.g. `https://your-app.vercel.app` |

   Optional (from `.env.example`):

   - `RESEND_API_KEY`, `EMAIL_FROM` — email (e.g. onboarding)
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **required for file uploads** on Vercel (Document Vault, Credit Import, audits). Without these, uploads fall back to local disk (not persistent on Vercel).
   - `TWILIO_*` — SMS
   - `NEXT_PUBLIC_CREDIT_MONITORING_URL` — “Get Credit Monitoring” link
   - `STRIPE_*` — billing

### Supabase `DATABASE_URL` checklist (Vercel / serverless)

Use this so Prisma can connect and you avoid pool exhaustion (“max clients”) and invalid URL errors.

- In Supabase open your project → **Connect** (or **Project Settings → Database**).
- Under connection strings, choose **Transaction pooler** (sometimes labeled **Transaction mode** / port **6543**).
  - Do **not** use **Session pooler** for Vercel (small serverless connection cap → `MaxClientsInSessionMode`).
  - Do **not** use the **direct** `db.xxx.supabase.co:5432` URL as `DATABASE_URL` on Vercel (too many real DB connections).
- Copy the **URI** Supabase shows **exactly** (user, host, port, database name). It should include **`6543`** and usually ends with something like `?pgbouncer=true` (keep that).
- **Password:** if it contains `@ : / ? # & % +` or spaces, run  
  `node -e "console.log(encodeURIComponent('YOUR_DB_PASSWORD'))"`  
  and replace the password segment in the URI with the encoded value only.
- In Vercel → **Environment variables** → `DATABASE_URL`: paste **one line**, **no** wrapping `"` quotes, no trailing spaces or line breaks.
- **Redeploy** production after saving env (Deployments → … → Redeploy).

**Username / host:** Supabase often shows `postgres.[project-ref]` and a **pooler** host (e.g. `aws-0-....pooler.supabase.com`) or `db.[ref].supabase.co:6543`. Use **their** string—do not mix a Session URI with a Transaction port.

**Migrations:** Run `prisma migrate deploy` from your machine (or CI) using the **direct** connection string (port **5432**) when you need migrations; keep Vercel’s `DATABASE_URL` as the **transaction** pooler for the running app.

4. **Database migrations**

   Run migrations against your **production** DB before or right after first deploy:

   ```bash
   DATABASE_URL="your-production-pooler-url" npx prisma migrate deploy
   ```

   If you added the `AdminNote` model and never ran the migration:

   ```bash
   npx prisma migrate dev --name add_admin_notes
   # then for production:
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

5. **Deploy**

   - Click **Deploy**. Vercel runs `prisma generate && next build` (from `package.json`).
   - After deploy, set `NEXTAUTH_URL` to your real domain if you use a custom domain.

6. **Optional: Supabase Storage for uploads**

   - In Supabase: create a bucket (e.g. `portal-uploads`), set policy so service role can read/write.
   - In Vercel: add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - The app uses these in `@/lib/blob` for Document Vault, Credit Import, and audit PDFs so uploads persist.

---

## Other platforms

- **Netlify:** Use Next.js runtime; set same env vars; run `prisma migrate deploy` against production DB.
- **Railway / Render / Fly.io:** Use `npm run build` and `npm run start`; add a PostgreSQL service and set `DATABASE_URL`; run migrations in a release step or manually.
- **Docker:** Add a `Dockerfile` that runs `npm run build`, `npx prisma migrate deploy`, and `npm run start`; ensure persistent storage for uploads or use Supabase Storage.

---

## After first deploy

1. Open your production URL and **register** an admin user (or use seed in a one-off script with production `DATABASE_URL` to create admin@… / client@…).
2. If you use credentials from seed, **change passwords** in production.
3. Test: login (client + admin), Credit Import (upload a PDF), Document Vault, and audit PDF download.
