# CreditLyft Portal

Web-based client portal and admin dashboard for credit repair and funding-readiness businesses. Built as an internal fulfillment system with architecture ready for future SaaS (multi-tenant) and mobile.

## Modules

- **CreditLyft Audit** — Credit import, analysis, negative-item extraction, auto PDF audit
- **CreditLyft Reset** — Dispute tracking (Round 1–4), letter generator
- **CreditLyft Access** — Funding readiness, capital access progress, application tracker
- **CreditLyft Vault** — Document vault (ID, utility, reports, bureau letters, etc.)
- **CreditLyft Timeline** — Activity feed

## Roles

- **Client** — Dashboard, credit import/upload, progress, tasks, applications, scripts, vault, messages, timeline
- **Admin / VA** — Clients, dispute tracker, letter generator, bank/product matrix, tasks, messages

## Tech stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Prisma** + PostgreSQL
- **NextAuth.js** (credentials, role-based)
- **@react-pdf/renderer** for audit and letter PDFs

## Setup

1. **Environment**

   ```bash
   cp .env.example .env
   ```

   Set:

   - `DATABASE_URL` — PostgreSQL connection string
   - `NEXTAUTH_SECRET` — random string (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000`

2. **Database**

   ```bash
   npm install
   npx prisma db push
   npx prisma generate
   npm run db:seed
   ```

3. **Run**

   ```bash
   npm run dev
   ```

   - App: http://localhost:3000  
   - **Admin:** admin@creditlyft.local / admin123  
   - **Client:** client@creditlyft.local / client123  

## Credit monitoring (v1)

Supported providers in the import form:

- MyFreeScoreNow  
- IdentityIQ  
- SmartCredit  
- MyScoreIQ  

MVP does not integrate with provider APIs; use **Manual upload** (PDF/screenshot) or manual entry handled by admin. The system is designed so provider import can be added later.

## MVP features

- Client auth + dashboard  
- Credit import (provider form + manual PDF/screenshot/entry)  
- Automatic audit + negative-item structure + PDF audit  
- Dispute tracker (rounds, outcomes)  
- Funding readiness / capital access tracker  
- Tasks + document vault  
- Application tracker  
- Letter generator (bureau, MOV, creditor, CFPB)  
- Messaging (client–admin)  
- Admin: clients, disputes, letters, bank matrix, tasks, messages  

## Project structure

- `src/app` — Routes (dashboard, admin, API)
- `src/components` — UI (dashboard nav, credit import, tasks, vault, admin)
- `src/lib` — Prisma, auth, credit-audit, audit-pdf, letter-pdf
- `prisma/schema.prisma` — Data model (multi-tenant ready)

## Security notes

- Passwords hashed with bcrypt.
- Role-based access: middleware protects `/dashboard` and `/admin` by role.
- Document download: clients only their vault/audits; admins allowed under `uploads/`.
- In production, encrypt credential fields for credit import and use a secrets manager.

## Future (SaaS / mobile)

- Add `tenantId` (or similar) to key models for multi-tenancy.
- Replace local file storage with S3 (or compatible) for documents and PDFs.
- Add provider integrations for automated credit pull where available.
- Mobile app can reuse the same API and auth (e.g. JWT from NextAuth).
