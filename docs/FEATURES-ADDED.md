# Features added (DisputeFox-style + previously excluded)

Everything is in the codebase; you can leave features unused if you don’t need them.

---

## Schema (Prisma)

- **Contact** — `source`, `hotness`, `affiliateId`; default `status` is `"lead"` for new leads.
- **ClientProfile** — `agreementSignedAt`, `agreementDocumentUrl`, `stripeCustomerId`, `processStage`.
- **Invoice** — client billing (amountCents, status, dueDate, paidAt, optional Stripe).
- **Affiliate** — name, email, code, commissionRate.
- **Referral** — links Affiliate + Contact; status pending/converted/paid.
- **PortalSettings** — siteName, logoUrl, primaryColor (white-label; single row).
- **POARequest** — clientProfileId, status (requested/completed/expired), documentUrl.
- **ClientNote** — internal notes per client (authorId, body, isPinned).
- **Reminder** — assignedToId, dueAt, optional clientProfileId (calendar-style).
- **Workflow** — name, trigger, steps (JSON), isActive (email automation).
- **DisputeInstruction**, **Creditor**, **Furnisher** — dispute letter libraries.

**Apply schema:** Run when your DB is reachable:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add_billing_affiliates_poa_etc
```

Then (optional) seed portal settings and test users:

```bash
npm run db:seed
```

---

## Lead capture & conversion

- **Public form:** `/lead` — name, email, phone, state, business name, notes. No auth. Submits to `POST /api/leads`.
- **Admin:** `/admin/leads` — list of contacts with no `clientProfileId` (leads). “Convert to client” opens a modal to set a password and creates User + ClientProfile, links Contact.
- **Affiliate:** On lead submit, optional `affiliateCode` in body; if it matches an Affiliate code, Contact gets `affiliateId` and a Referral (pending) is created.

---

## Billing (optional)

- **Admin:** `/admin/invoices` — list of invoices (client, amount, status, due). No “create invoice” UI yet; you can create via API or add a button on client page.
- **Stripe:** Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env` when you want live payments. Pay links / checkout can be added later.

---

## SMS (optional)

- **Lib:** `src/lib/sms.ts` — `sendSms({ to, body })` using Twilio. No-op if `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are not set.
- Use from any API route (e.g. send SMS when admin sends message, or from a workflow).

---

## Affiliates

- **Admin:** `/admin/affiliates` — list affiliates, “Add affiliate” (name, email, referral code). Leads submitted with `affiliateCode` are attributed and create a Referral.

---

## White-label

- **PortalSettings** — one row (seed creates it). Not wired into layout yet; you can add an admin “Portal settings” form and read `portalSettings` in layout to set logo/primary color.

---

## POA (Power of Attorney)

- **Admin:** `/admin/poa` — list POA requests by client and status. Request POA from a client file (add “Request POA” on admin client page if you want; model and list are there).
- **Client:** “Complete POA” can be a placeholder page or link to external notary when you’re ready.

---

## PWA

- **Manifest:** `public/manifest.json` — name, theme_color, start_url `/dashboard`. Optional icons: add `public/icon-192.png` and `public/icon-512.png` if you want “Add to home screen” to show icons.
- **Layout:** `manifest` and `themeColor` are in root layout metadata.

---

## Client agreement (e-sign)

- **Client:** `/dashboard/agreement` — shows engagement text and “I agree” + “Sign agreement”. Signed state stored as `agreementSignedAt` on ClientProfile.
- **API:** `POST /api/agreement/sign` with `{ clientProfileId }` (user must own that profile).
- **Nav:** “Agreement” added to client sidebar.

---

## Landing page

- **Get in touch:** Header nav includes “Get in touch” → `/lead`.

---

## .env.example

Added (all optional):

- `RESEND_API_KEY`, `EMAIL_FROM` — email
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — billing

---

## Not built in this pass

- **Portal settings UI** — form in admin to edit logo/color (model exists).
- **Notes UI** — ClientNote CRUD on admin client page (model exists).
- **Reminders/calendar** — Reminder model exists; no calendar view yet.
- **Workflows** — Workflow model exists; no runner or admin UI yet.
- **DisputeInstruction / Creditor / Furnisher** — models exist; no admin CRUD pages yet.
- **Stripe checkout** — Invoice list only; no “Pay” button or Stripe Checkout yet.
- **2FA** — not added.

You can add these incrementally when needed.
