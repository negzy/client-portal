# Client Portal Onboarding — Recording Script for Skool

Use this when recording a walkthrough of a client navigating the portal. Keep it short (5–8 min). Record in order so it matches the modules.

---

## In-app guided tour (for portal walkthrough)

After login, clients can click **"Take the tour"** in the sidebar. A step-by-step overlay walks them through Dashboard, Credit Import, Document Vault, Tasks & Progress, Messages, and Profile. You can **record your screen while clicking through the tour** and read each step aloud (or use your own words). No need to memorize — the copy is right there. Great for a quick “how the portal works” video.

---

## Before You Record

- Use a **clean test account** or demo mode so no real client data shows.
- Turn off notifications; use **Do Not Disturb**.
- Optional: use a tool like Loom, OBS, or QuickTime. Record at 1080p if you can.
- Have the portal open at the login screen so you start from "client's first view."

---

## Recording Flow (Follow This Order)

### 1. Log in & land on dashboard (0:00–0:45)

**Do:**  
- Go to the portal URL, enter demo login, hit Sign in.  
- Land on the main dashboard.

**Say (script):**  
*"This is your client portal. After you log in, you'll land here on your dashboard. This is your home base — you'll see a quick overview of where things stand and any action items."*

**Show:**  
- Dashboard cards/sections (progress, alerts, next steps) for a few seconds.

---

### 2. Where to find "Start here" / onboarding (0:45–1:30)

**Do:**  
- Click into the onboarding / "Start here" or "Get started" area (or first-time checklist if that's what you have).

**Say:**  
*"New clients should start with onboarding. Look for 'Start here' or 'Get started' — that's where you'll do the setup steps in order. It only takes a few minutes."*

**Show:**  
- The list of onboarding steps or sections so they see the sequence.

---

### 3. Credit monitoring step (1:30–2:15)

**Do:**  
- Scroll to the "Get credit monitoring" step.  
- Briefly show the copy and the two buttons (e.g. "I already have monitoring" / "Get credit monitoring").

**Say:**  
*"Step one is credit monitoring. We need this so we can review your full profile. If you already have it, you'll click 'I already have monitoring.' If not, use 'Get credit monitoring' to sign up, then come back and continue."*

**Show:**  
- The checklist (signed up, can access report, ready to continue) if you have it.

---

### 4. Quick tour: Dashboard, Uploads, Messages, Progress (2:15–4:00)

**Do:**  
- Go back to dashboard, then click through: **Uploads/Documents** → **Messages** → **Progress/Status** (or your actual labels).  
- Stay 15–20 seconds on each. Don't click into every subpage; just show "this is where you do X."

**Say:**  
- **Dashboard:** *"Dashboard is your overview — scores, status, next steps."*  
- **Uploads/Documents:** *"Here you upload what we need: ID, proof of address, credit monitoring access, any dispute letters or notes about issues. Complete uploads speed things up."*  
- **Messages:** *"Messages is where we send you updates and where you can reply. Check here if you're waiting on something from us."*  
- **Progress/Status:** *"Progress or Status shows where you are in the process and what's done. You'll see movement here as work gets done."*

---

### 5. Upload section — what to submit (4:00–5:00)

**Do:**  
- Open the upload/intake section.  
- Scroll through the list (photo ID, proof of address, monitoring details, dispute letters, explanation of issues, etc.) without filling real data.

**Say:**  
*"In the upload section you'll see exactly what we need: photo ID, proof of address, how we can access your credit monitoring, any past dispute letters, and a short explanation of the accounts or issues you want addressed. Fill what applies and upload. Accurate, complete info helps us start faster — missing stuff can delay things."*

**Show:**  
- Any checklist or progress indicator so they know they can come back and complete items.

---

### 6. What happens after you submit (5:00–5:45)

**Do:**  
- Either show the "What happens next" section in onboarding, or just stay on a summary view and point to it.

**Say:**  
*"Once you've submitted your details, we review your profile and documents, map out the strategy, and then work begins. You'll get updates in the portal. No hype — we'll keep you informed through here as we go."*

---

### 7. Where to get help (5:45–6:15)

**Do:**  
- Go to the support/help or messages area.

**Say:**  
*"If you get stuck during onboarding or later, use the support or message area inside the portal. That's the best place to ask questions and stay organized. We'll guide you from there."*

---

## After Recording

- Trim long pauses or mistakes.  
- Add a short title card at the start: e.g. "Client Portal — Quick Onboarding Walkthrough."  
- Upload to Skool and attach to the first onboarding module (see modules below).

---

## Quick checklist for the recording

- [ ] Login → dashboard  
- [ ] Onboarding / "Start here" and step list  
- [ ] Credit monitoring step + buttons  
- [ ] Tour: Dashboard → Uploads → Messages → Progress  
- [ ] Upload section and what to submit  
- [ ] What happens next  
- [ ] Support / where to get help  

You can reuse this same flow for the Credit DFY course and just point students to "watch the portal walkthrough first."

---

## Alternative: Screenshots + Explanation (No Screen Recording)

If you **can't screen record** (e.g. no tool, policy, or preference), use **screenshots and short explanations** instead. The main portal can show these in the "How to navigate your client portal" section so clients still get a clear tour.

### What to capture (in order)

1. **Dashboard** — Full-screen or cropped view of the client dashboard after login.  
   **Caption:** *"Dashboard — your overview of scores, status, and next steps."*

2. **Upload / Documents** — Page where clients upload ID, proof of address, etc.  
   **Caption:** *"Upload Center — submit ID, proof of address, and other documents here."*

3. **Progress / Status** — Page where they see progress or status.  
   **Caption:** *"Progress Tracker — see what's done and what's in progress."*

4. **Messages** — Inbox or messages view.  
   **Caption:** *"Messages — get updates and reply here."*

5. **Support / Help** — Where they can ask questions.  
   **Caption:** *"Support — ask questions and get help here."*

### How to do it

- Log in as a **client** (test account). Use a clean state so no real client data appears.
- For each of the 5 areas above, open that page and take a **screenshot** (e.g. Cmd+Shift+4 on Mac, or your browser's "Capture full page" if you want one long image).
- Save files with clear names: `dashboard.png`, `uploads.png`, `progress.png`, `messages.png`, `support.png`.
- Add the captions next to each image in the portal (or in the doc you hand to the main repo). The integration doc (`MAIN-PORTAL-INTEGRATION.md`) tells the main repo how to use "screenshots + explanations" instead of a video.

### Where these go in this portal

- Put the images in `public/onboarding-screenshots/` (e.g. `dashboard.png`, `uploads.png`, etc.).
- The onboarding "How to navigate your portal" step already supports either:
  - **Video:** set `NEXT_PUBLIC_PORTAL_WALKTHROUGH_VIDEO` to your Loom/YouTube URL.
  - **No video:** it shows the 5 areas with icons and captions (same text as above). To use real screenshots instead of icons, add the images to `public/onboarding-screenshots/` and the component can be updated to display them (see `SectionPortalWalkthrough` or the onboarding flow).

Result: Clients get the same guidance as the video walkthrough, but in a simple "screenshots + explanation" format that doesn't require a recording.
