# Guidde (or AI Guide) — Full Walkthrough Script & Prompt

Use the **Prompt** section below in your AI app (Guidde, etc.) to generate a step-by-step walkthrough. Use the **Full script** section for voiceover or to double-check every screen.

---

## Prompt to paste into Guidde / your AI guide

Copy everything below the line into your tool.

---

**Create a product walkthrough for a client portal (CreditLyft Portal). The app is a credit-repair and capital-readiness portal. Record or describe the following flow in order.**

**1. First-time visit and login**
- User lands on the portal URL (e.g. client-portal.thecredithub.io).
- Login page: email, password, "Sign in." Link to "Create account" for new clients.
- After sign-in, new clients are redirected to onboarding (not the dashboard).

**2. Onboarding (6 steps, dark theme, orange buttons)**
- **Step 1 — Welcome:** Heading "Welcome to Elite." Short intro that the portal is for credit reset, funding readiness, and progress. One button: "Start Onboarding."
- **Step 2 — Get Credit Monitoring:** Copy says they need active credit monitoring. Two actions: "I Already Have Monitoring" (secondary) and "Get Credit Monitoring" (primary, opens affiliate in new tab). A box for "I already have monitoring" lets them upload a credit report PDF right there (Choose PDF / Uploaded) or "I'll do it later." Quick checklist: Signed up for monitoring, Can access your report, Ready to continue. Bottom CTA: "Continue to next step."
- **Step 3 — Portal tour:** "How to Navigate Your Client Portal." Optional video embed or cards for Dashboard, Upload Center, Progress, Messages, Support. CTA: "Continue to next step."
- **Step 4 — Upload details:** "Upload Your Credit Repair Details." Photo ID and Proof of address are required; SSN card and others optional. Each row has inline "Choose file" / "Uploaded" (files go to Document Vault). Copy says they can continue and upload later in the portal. CTA: "Continue to next step."
- **Step 5 — What happens next:** Numbered list (we review profile, map strategy, work begins, you get updates, funding readiness). CTA: "Continue to next step."
- **Step 6 — Support:** "Need Help? / Support." Where to ask questions, reply time, direct support number. Teal completion box: "You're all set…" and one button: "Go to my dashboard." Clicking it marks onboarding complete and redirects to the dashboard.

**3. Dashboard**
- **Mobile:** Menu is collapsed by default; tap the hamburger to open the sidebar. Tap outside or the X to close.
- Sidebar (left): CreditLyft Portal logo, then "Take the tour" button, then nav: Dashboard, Credit Import, Tasks, Progress, Messages, Agreement, Applications, Document Vault, Scripts & Guidance, Timeline, Profile. Sign out at bottom.
- Main area: Dashboard home with score snapshot (if they uploaded a report), next steps, tasks, progress summary, charts. If no data yet, a "Get started" CTA to Credit Import.

**4. Credit Import**
- Page title: "Import your credit report."
- If they already have a report/audit: "Your latest report" card with date, scores (e.g. EX: 620, EQ: 615, TU: 618), negative items count, and **Late payments (parsed)** count. Below that, a **Late payment list (verify)** table (see "Late payment list — what to show" below). Buttons: "View audit" and "Download audit PDF."
- On **View audit** (`/dashboard/audits/[id]`): same **Late payments (parsed)** table so clients can verify without returning to Credit Import.
- Below: "Upload a new report" / **Upload report (PDF)** — credit report **PDF only** (no screenshot upload, no manual score entry). Button: "Upload and analyze." Optional: "Connect monitoring" flow to save provider credentials (automation depends on backend).

**Late payment list — what to show (for narration / verification)**

Use this so the guide explicitly calls out the parsed late-payment rows (from each account’s **30 / 60 / 90 / 120 Days Past Due** table in the PDF, Equifax / Experian / TransUnion columns when the count is greater than zero).

| Column | What it shows |
| ------ | --------------- |
| **Account** | Creditor / tradeline name from that account section in the report. |
| **Bureau** | Equifax, Experian, or TransUnion — whichever column had a count > 0 for that severity row. |
| **Severity** | One of **Late 30**, **Late 60**, **Late 90**, or **Late 120** (matches the “Days Past Due” row). |
| **Detail** | Text like `Late 30 (report count: N)` — **N** is the number read from the PDF for that bureau. |

**Example lines (illustrative — not real data):**

- Account: **CAP ONE AUTO FIN** · Bureau: **Experian** · Severity: **Late 30** · Detail: **Late 30 (report count: 1)**
- Account: **DISCOVER CARD** · Bureau: **TransUnion** · Severity: **Late 60** · Detail: **Late 60 (report count: 2)**

If the PDF has no qualifying past-due counts, the table is empty and copy explains that no structured late-payment rows were parsed.

**5. Document Vault**
- "Document vault" — Upload and view ID, utility bills, credit reports, etc. Upload control and a list of existing documents with category labels (ID, Utility bill, Credit report, etc.). Download or remove per document.

**6. Other key areas (brief)**
- **Tasks:** List of assigned tasks (credit/funding/docs, etc.) with status.
- **Progress (Credit & progress):** Negative items table with real data from your report: account, bureau, type, status (e.g. disputed, pending, removed), round (e.g. Round 1, Round 2), whether letters have been sent and when, and date imported.
- **Messages:** Threads with the team; unread badge in sidebar when there are unread messages.
- **Profile:** Name, email, phone (required); optional fields; change password.

**7. In-app tour (optional for the walkthrough)**
- In the sidebar, "Take the tour" opens a modal that walks through: Welcome, Dashboard, Credit Import, Document Vault, Tasks & Progress, Messages, Profile, You're all set. Use this to show new users how the portal is organized.

**Technical notes for the guide:** The app uses a dark theme (dark background, orange primary buttons). Onboarding has a sticky "Step X of 6" bar and a sidebar "Your progress" on desktop. One primary CTA per section. New clients cannot skip onboarding (they are redirected until they complete it); they can use Credit Import and Document Vault during onboarding.

---

## Full script (for voiceover or step-by-step)

Use this when recording or when your AI needs exact copy for each step.

---

### Scene 1 — Login
**Screen:** Portal login page.  
**Say:** "Go to the client portal URL and sign in with your email and password. New users can click Create account to register."  
**Do:** Enter credentials, click Sign in.

---

### Scene 2 — Onboarding intro (Step 1)
**Screen:** Onboarding, Step 1 of 6. "Welcome to Elite" card.  
**Say:** "New clients land here first. This is your central hub for credit reset and funding readiness. Click Start Onboarding to begin."  
**Do:** Click "Start Onboarding."

---

### Scene 3 — Get Credit Monitoring (Step 2)
**Screen:** Step 2. "Get Credit Monitoring" with two buttons and the "I already have monitoring" box.  
**Say:** "You’ll need credit monitoring so we can review your profile. If you already have it, use the first button. You can upload your report PDF right here or choose I’ll do it later. If you don’t have monitoring, click Get Credit Monitoring to sign up in a new tab. Tick the checklist when you’re ready, then continue."  
**Do:** Either upload a PDF or click "I'll do it later"; click "Continue to next step."

---

### Scene 4 — Portal tour (Step 3)
**Screen:** Step 3. "How to Navigate Your Client Portal" and cards or video.  
**Say:** "This step shows where everything lives: Dashboard, Upload Center, Progress, Messages, and Support. Watch the video or skim the cards, then continue."  
**Do:** Click "Continue to next step."

---

### Scene 5 — Upload details (Step 4)
**Screen:** Step 4. "Upload Your Credit Repair Details" with Photo ID, Proof of address, SSN card, and other rows. Each has "Choose file" or "Uploaded."  
**Say:** "Upload your Photo ID and proof of address here; the rest is optional. Files are saved to your Document Vault. You can upload more later from the portal. Click Continue when you’re done or ready to move on."  
**Do:** Optionally upload a file or two; click "Continue to next step."

---

### Scene 6 — What happens next (Step 5)
**Screen:** Step 5. Numbered list (review profile, map strategy, work begins, updates, funding readiness).  
**Say:** "Here’s what happens after onboarding: we review your profile, map the strategy, start work, send updates in the portal, and then focus on funding readiness. Click Continue."  
**Do:** Click "Continue to next step."

---

### Scene 7 — Support and finish (Step 6)
**Screen:** Step 6. Support info and teal box with "Go to my dashboard."  
**Say:** "If you need help, use Messages or the support number. When you’re ready, click Go to my dashboard to finish onboarding and enter the portal."  
**Do:** Click "Go to my dashboard."

---

### Scene 8 — Dashboard home
**Screen:** Dashboard. Sidebar with "Take the tour," nav links, main area with scores/next steps or "Get started."  
**Say:** "This is your dashboard. The sidebar has every section: Credit Import, Document Vault, Tasks, Progress, Messages, and Profile. Use Take the tour anytime for a quick walkthrough. The main area shows your scores and next steps, or a Get started prompt if you haven’t imported a report yet."  
**Do:** Point out sidebar and main content; optionally click "Take the tour" and step through it.

---

### Scene 9 — Credit Import
**Screen:** Credit Import page.  
**Say:** "Under Credit Import you’ll see your latest report if you’ve already uploaded one — scores, total negative items, how many late-payment rows we parsed, and a **Late payment list** you can check against your PDF. Each line shows the account name, bureau, late severity — Late 30 through Late 120 — and the count we read from the report. Open **View audit** for the same list on the audit page. Below that, upload a **PDF only** of your full 3-bureau report and click Upload and analyze — no manual scores or screenshots here. You can also use Connect monitoring to save provider login details if your program uses that."  
**Do:** Show "Your latest report" card, scroll the late-payment table, open View audit briefly; show PDF upload and optional provider connect.

---

### Scene 10 — Document Vault
**Screen:** Document Vault page.  
**Say:** "The Document Vault is where you store ID, proof of address, SSN card, and other documents. Upload here or from onboarding. You can view, download, or remove documents anytime."  
**Do:** Show upload area and document list.

---

### Scene 11 — Tasks, Progress, Messages, Profile (summary)
**Screen:** Quick visit to each.  
**Say:** "Tasks list what to do next. Credit & Progress shows each negative item with status — disputed, pending, or removed — which round it’s in, and whether letters have been sent. Messages is where you get updates and reply to your team — you’ll see an unread badge when there are new messages. In Profile you update your name, email, phone, and password."  
**Do:** Open each section briefly or name them in the sidebar.

---

### Scene 12 — Take the tour (optional)
**Screen:** Modal from "Take the tour" in sidebar.  
**Say:** "Click Take the tour in the sidebar to see this guided walkthrough. It goes through Dashboard, Credit Import, Document Vault, Tasks, Messages, and Profile. Clients can run it anytime."  
**Do:** Open tour, click Next through a few steps, then Done or Skip.

---

## One-paragraph summary for AI tools

**CreditLyft Portal client flow:** New users register or log in and are sent to a 6-step onboarding (dark theme, orange CTAs): (1) Welcome → Start Onboarding, (2) Get Credit Monitoring with optional inline PDF upload or "I'll do it later," (3) Portal tour, (4) Upload details with inline uploads for Photo ID, proof of address, SSN, (5) What happens next, (6) Support and "Go to my dashboard." After that they land on the dashboard with a sidebar (Take the tour, Credit Import, Document Vault, Tasks, Progress, Messages, Profile, etc.). Credit Import shows the latest report and scores when available, a **late payment verification table** (Account, Bureau, Late 30/60/90/120, detail with report count), and PDF-only re-upload (plus optional monitoring credentials). Document Vault holds ID and other docs. Tasks, Progress, and Messages complete the experience. The in-app "Take the tour" modal walks through each area.

---

You can paste the **Prompt** into Guidde (or your AI) to generate the walkthrough, and use the **Full script** for recording or to align narration with each screen.
