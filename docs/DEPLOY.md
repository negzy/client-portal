# Deploy CreditLyft Portal (TCH Portal)

## Quick deploy — Vercel (recommended)

1. **Push your code** to GitHub (or GitLab/Bitbucket).

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New → Project.
   - Import your repo. Vercel will detect Next.js.

3. **Database (pick one)**

### A. Neon Postgres via Vercel (simplest — no Supabase pooler tuning)

You still do this part in the browser; the repo is already wired for the env vars Neon injects.

1. Vercel → your project → **Storage** → **Create database** / [Neon on the Marketplace](https://vercel.com/marketplace/neon).
2. Finish the wizard (region, name). Neon’s **Vercel-managed integration** attaches to your project.
3. Under the database → **Connect Project** → choose this repo’s Vercel project and environments (**Production** at minimum).
4. Vercel injects at least **`DATABASE_URL`** (pooled) and **`DATABASE_URL_UNPOOLED`** (direct). Prisma uses both (`schema.prisma`). Pull locally with:
   ```bash
   vercel env pull .env.local
   ```
5. **Schema on the new empty DB:** from your laptop (with pulled env or paste URLs):
   ```bash
   npm install
   npx prisma db push
   ```
   Or, if you use migrations: `npx prisma migrate deploy` with `DATABASE_URL_UNPOOLED` set to the direct URL.
6. **Moving data from old Supabase:** dump/restore with `pg_dump` / `psql`, or re-seed if you can afford an empty DB. Files in **Supabase Storage** stay there until you change `SUPABASE_*` to another provider.

### B. Keep Supabase Postgres

Prisma needs **two** URLs:

| Variable | Typical source (Supabase) |
|----------|----------------------------|
| `DATABASE_URL` | **Transaction pooler**, port **6543**, `?pgbouncer=true` |
| `DATABASE_URL_UNPOOLED` | **Direct** `db.<ref>.supabase.co`, port **5432** |

- Do **not** use **Session** pooler for `DATABASE_URL` on Vercel.
- Encode special characters in the password (`encodeURIComponent`).
- One line per value in Vercel, no extra quotes.

IPv4 notes on Supabase’s **Session** tab are about the network path, not a reason to switch to Session mode for this app.

4. **Environment variables** (Project → Settings → Environment Variables)

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `DATABASE_URL` | Yes | Pooled (Neon: auto; Supabase: transaction pooler **6543**). |
   | `DATABASE_URL_UNPOOLED` | Yes | Direct (Neon: auto; Supabase: **5432**). |
   | `NEXTAUTH_SECRET` | Yes | Generate: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Yes | Production URL, e.g. `https://your-app.vercel.app` |

   Optional (from `.env.example`):

   - `RESEND_API_KEY`, `EMAIL_FROM` — email
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **file uploads** (Document Vault, Credit Import, audits). You can keep Supabase **only** for Storage while Neon hosts Postgres.
   - `TWILIO_*`, `NEXT_PUBLIC_CREDIT_MONITORING_URL`, `STRIPE_*`

5. **Deploy**

   - Build runs `node scripts/run-production-build.cjs` (sets missing `DATABASE_URL_UNPOOLED` when only `DATABASE_URL` exists, then `prisma generate` + `next build`).
   - After custom domain: update `NEXTAUTH_URL`.

6. **Optional: Supabase Storage**

   - Bucket (e.g. `portal-uploads`), service role can read/write.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Vercel.

---

## Other platforms

- Same env vars: `DATABASE_URL` + `DATABASE_URL_UNPOOLED` (or duplicate the same URL for both when there is no pooler).
- Run `npm run build` / `npm start`; run `npx prisma db push` or `migrate deploy` against production as needed.

---

## After first deploy

1. Register an admin (or `npm run db:seed` pointed at production — change default passwords).
2. Test login, uploads, Credit Import, audit PDF.
