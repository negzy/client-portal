# Client Onboarding — Seamless Flow Script

Use this as the **single source of truth** for what a client sees and does during onboarding. It's written from the **client's perspective** so the flow feels clear, premium, and seamless. Give this to your main portal repo or team so they can match the experience exactly.

---

## Design principles (client view)

- **One path:** There's only one "next" action. No guessing.
- **Progress always visible:** Client always sees "Step X of 6" and a checklist of steps (completed = checkmark, current = highlighted).
- **One primary button per section:** Each section ends with a single CTA: "Start Onboarding", "Continue to next step", or "Go to my dashboard".
- **White, clean layout:** White header, light gray background, white cards, soft borders. Teal for buttons and "done" states. Checklist style for steps and the credit-monitoring checklist.
- **Short copy:** Headings and body text are brief. No long paragraphs.

---

## Exact flow (what the client sees and does)

### When they first land

- **Screen:** Light gray background. White header with "Client Portal" and a "Demo mode" toggle (optional; hide for real clients if you prefer).
- **Below header:** Sticky bar showing "Step 1 of 6" and a horizontal progress strip (six circles: 1 = active, rest gray). Progress bar fills as they move.
- **Layout:** On large screens, a **sidebar** (left) with "Your progress" and a vertical checklist of 6 steps. Current step is highlighted; completed steps show a checkmark and can be clicked to jump back. Main content (right) is the current section in a white card.

---

### Step 1 — Welcome / Start Here

- **Card:** White, rounded, soft shadow.
- **Heading:** "Welcome to Premium"
- **Body (short):**
  - This portal is your central hub for credit reset, funding readiness, and progress tracking. Follow the steps below to get fully set up.
  - Setup only takes a few minutes. Complete each section in order for the smoothest experience.
- **Single CTA:** **"Start Onboarding"** (teal button). Clicking scrolls to Step 2.

**Client action:** Click "Start Onboarding".

---

### Step 2 — Get Credit Monitoring

- **Heading:** "Get Credit Monitoring"
- **Body:**
  - Before we begin, you'll need active credit monitoring so your profile can be reviewed accurately.
  - If you already have monitoring, you can continue. If not, sign up first using the button below, then come back and mark yourself ready.
- **Two buttons:**
  - **"I Already Have Monitoring"** (secondary/outline). Clicking marks the checklist as done.
  - **"Get Credit Monitoring"** (primary teal). Opens affiliate link in a new tab.
- **Checklist (in a light gray box):**
  - "Quick checklist" with three items; each has a checkbox the client can tick:
    - Signed up for monitoring
    - Can access your report
    - Ready to continue
- **Single CTA:** **"Continue to next step"** (teal). Scrolls to Step 3.

**Client action:** Either "I already have" or "Get monitoring", tick the checklist as they go, then "Continue to next step".

---

### Step 3 — How to Navigate Your Client Portal

- **Heading:** "How to Navigate Your Client Portal"
- **Body:** A quick tour of where to find everything. Watch the walkthrough below or use the labels and screenshots as your guide.
- **Optional:** Embedded video (Loom/YouTube) **or** a row of screenshots with short captions (Dashboard, Upload Center, Progress, Messages, Support).
- **Grid of cards:** Five areas with icon + title + one-line description:
  - Dashboard — Your overview; scores, status, next steps.
  - Upload Center — Submit ID, proof of address, dispute docs, etc.
  - Progress Tracker — See what's done and in progress.
  - Messages — Get updates and reply here.
  - Support — Ask questions and get help.
- **Single CTA:** **"Continue to next step"**. Scrolls to Step 4.

**Client action:** Read or watch, then "Continue to next step".

---

### Step 4 — Upload Your Credit Repair Details

- **Heading:** "Upload Your Credit Repair Details"
- **Body:**
  - Submit the information we need to get started. Complete information helps speed up the process; missing information may delay work.
  - Please ensure all information is accurate before submitting.
- **Upload items (in order):**
  1. Photo ID  
  2. Proof of address  
  3. Credit monitoring login or access instructions  
  4. Previous dispute letters (if applicable)  
  5. Explanation of negative accounts / issues  
  6. Supporting documents  
- **Single CTA:** **"Continue to next step"**. Scrolls to Step 5.

**Client action:** Upload what they have (or do it in Document Vault), then "Continue to next step".

---

### Step 5 — What Happens Next

- **Heading:** "What Happens Next"
- **Body:** Once you've completed onboarding and we have your details, here's what to expect. We keep it clear and straightforward — no hype, no unrealistic promises.
- **Numbered list (1–5):**
  1. We review your profile and documents.  
  2. We map out the repair strategy.  
  3. Work begins on the credit reset process.  
  4. You receive updates through the portal.  
  5. Funding readiness and next-step strategy follow as appropriate.  
- **Single CTA:** **"Continue to next step"**. Scrolls to Step 6.

**Client action:** Read, then "Continue to next step".

---

### Step 6 — Need Help? / Support

- **Heading:** "Need Help? / Support"
- **Body:** If you run into any issues during onboarding, use the support section or message area inside the portal and we'll guide you from there.
- **Completion block (light teal box):**
  - "You're all set. When you're ready, head to your dashboard to see your progress and next steps."
  - **Single CTA:** **"Go to my dashboard"** (teal). Marks onboarding complete and redirects to dashboard.

**Client action:** Click "Go to my dashboard". Onboarding is done.

---

## Checklist for implementation

- [ ] **First page:** New clients (without `onboardingComplete`) land on this onboarding flow, not the dashboard.
- [ ] **Progress UI:** Sticky "Step X of 6" bar + progress strip; optional sidebar "Your progress" checklist (clickable steps).
- [ ] **One CTA per section:** Welcome → "Start Onboarding"; Steps 2–5 → "Continue to next step"; Step 6 → "Go to my dashboard".
- [ ] **Credit monitoring:** Two buttons + three-item checklist; primary CTA "Continue to next step".
- [ ] **Portal tour:** Video embed **or** screenshots + captions; five areas (Dashboard, Upload Center, Progress, Messages, Support).
- [ ] **Upload section:** Six upload types with labels; "Continue to next step" at bottom.
- [ ] **Completion:** "Go to my dashboard" sets `onboardingComplete` and redirects to dashboard.
- [ ] **Theme:** White header, light gray page background, white cards, teal primary buttons.
