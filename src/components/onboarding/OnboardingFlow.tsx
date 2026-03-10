"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileInput,
  Upload,
  MessageSquare,
  Target,
  LayoutDashboard,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

type DocumentCategory = "ID" | "UTILITY_BILL" | "SOCIAL_EIN" | "CREDIT_REPORT" | "OTHER";

const TOTAL_STEPS = 6;
const WALKTHROUGH_VIDEO = process.env.NEXT_PUBLIC_PORTAL_WALKTHROUGH_VIDEO;
const CREDIT_MONITORING_URL =
  process.env.NEXT_PUBLIC_CREDIT_MONITORING_URL ||
  "https://myfreescorenow.com/enroll/?AID=ApexfinitySolutionsLLC&PID=51023";

const STEP_LABELS = [
  "Welcome",
  "Get Credit Monitoring",
  "Portal Tour",
  "Upload Details",
  "What Happens Next",
  "Support",
];

const TOUR_CARDS = [
  { label: "Dashboard", caption: "Your overview; scores, status, next steps.", icon: LayoutDashboard },
  { label: "Upload Center", caption: "Submit ID, proof of address, dispute docs, etc.", icon: Upload },
  { label: "Progress Tracker", caption: "See what's done and in progress.", icon: Target },
  { label: "Messages", caption: "Get updates and reply here.", icon: MessageSquare },
  { label: "Support", caption: "Ask questions and get help.", icon: HelpCircle },
];

const UPLOAD_ITEMS: { label: string; helper: string; required: boolean; category: DocumentCategory }[] = [
  { label: "Photo ID", helper: "Government-issued ID", required: true, category: "ID" },
  { label: "Proof of address", helper: "Utility bill or similar", required: true, category: "UTILITY_BILL" },
  { label: "SSN card", helper: "Social Security card (optional)", required: false, category: "SOCIAL_EIN" },
  { label: "Credit monitoring login or access", helper: "How we can access your report (optional)", required: false, category: "OTHER" },
  { label: "Supporting documents", helper: "Any other relevant docs (optional)", required: false, category: "OTHER" },
];

export function OnboardingFlow({ reviewMode = false }: { reviewMode?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [creditChecklist, setCreditChecklist] = useState([false, false, false]);
  const [reportUploaded, setReportUploaded] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [documentByCategory, setDocumentByCategory] = useState<Record<string, boolean>>({});
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const reportInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setUploadError("");
  }, [step]);

  useEffect(() => {
    if (step !== 2 && step !== 4) return;
    let cancelled = false;
    fetch("/api/documents")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { documents?: { category: string }[] } | null) => {
        if (cancelled || !data?.documents) return;
        const docs = data.documents;
        if (step === 2) {
          const hasReport = docs.some((d) => d.category === "CREDIT_REPORT");
          setReportUploaded(hasReport);
        }
        if (step === 4) {
          const byCat: Record<string, boolean> = {};
          for (const d of docs) {
            byCat[d.category] = true;
          }
          setDocumentByCategory((prev) => ({ ...prev, ...byCat }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [step]);

  async function uploadCreditReport(file: File) {
    setUploadError("");
    setUploadingReport(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/credit/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setReportUploaded(true);
      else setUploadError(data.error ?? "Upload failed");
    } finally {
      setUploadingReport(false);
      if (reportInputRef.current) reportInputRef.current.value = "";
    }
  }

  async function uploadDocument(file: File, category: DocumentCategory, index: number) {
    setUploadError("");
    setUploadingCategory(String(index));
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("category", category);
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setDocumentByCategory((prev) => ({ ...prev, [category]: true }));
      else setUploadError(data.error ?? "Upload failed");
    } finally {
      setUploadingCategory(null);
      const input = docInputRefs.current[index];
      if (input) input.value = "";
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (res.ok) {
        // Full navigation so dashboard layout sees updated onboardingCompletedAt
        window.location.href = "/dashboard";
        return;
      }
      router.refresh();
    } finally {
      setCompleting(false);
    }
  }

  const toggleChecklist = (i: number) => setCreditChecklist((c) => c.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-700 bg-zinc-900 shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <span className="font-semibold text-white">Client Portal</span>
        </div>
      </header>

      {/* Sticky progress bar */}
      <div className="sticky top-14 z-10 border-b border-zinc-700 bg-zinc-800 px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium text-zinc-400">Step {step} of {TOTAL_STEPS}</p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i + 1)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-orange-500" : "bg-zinc-600"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {reviewMode && (
          <div className="mb-6 rounded-xl border border-orange-500/40 bg-orange-950/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-medium text-orange-200">You've already completed setup.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Go to dashboard
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar: Your progress (desktop) */}
          <aside className="hidden shrink-0 lg:block lg:w-56">
            <div className="sticky top-36 rounded-xl border border-zinc-600 bg-zinc-800 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your progress</p>
              <ul className="mt-3 space-y-1">
                {STEP_LABELS.map((label, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setStep(i + 1)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        step === i + 1
                          ? "bg-orange-500/20 font-medium text-orange-300"
                          : "text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {i + 1 < step ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-500 text-xs">
                          {i + 1}
                        </span>
                      )}
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content card */}
          <main className="min-w-0 flex-1">
            <div className="rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-sm md:p-8">
              {step === 1 && (
                <>
                  <h1 className="text-2xl font-bold text-white">Welcome to Premium</h1>
                  <p className="mt-2 text-zinc-300">
                    This portal is your central hub for credit reset, funding readiness, and progress tracking. Follow the steps below to get fully set up.
                  </p>
                  <p className="mt-2 text-zinc-300">
                    Setup only takes a few minutes. Complete each section in order for the smoothest experience.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Start Onboarding <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-white">Get Credit Monitoring</h2>
                  <p className="mt-2 text-zinc-300">
                    Before we begin, you'll need active credit monitoring so your profile can be reviewed accurately.
                  </p>
                  <p className="mt-1 text-zinc-300">
                    If you already have monitoring, you can continue. If not, sign up first using the button below, then come back and mark yourself ready.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setCreditChecklist([true, true, true])}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      I Already Have Monitoring
                    </button>
                    {CREDIT_MONITORING_URL.startsWith("http") ? (
                      <a
                        href={CREDIT_MONITORING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Get Credit Monitoring <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={CREDIT_MONITORING_URL}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Get Credit Monitoring
                      </Link>
                    )}
                  </div>
                  <div className="mt-4 rounded-lg border border-zinc-600 bg-zinc-700/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">I already have monitoring</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Upload your credit report (PDF) here. It will be saved to your document vault and you can continue to the next step.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={reportInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCreditReport(f);
                        }}
                      />
                      {reportUploaded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/20 px-3 py-2 text-sm font-medium text-orange-300">
                          <CheckCircle2 className="h-4 w-4" /> Uploaded
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={uploadingReport}
                          onClick={() => reportInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-70"
                        >
                          {uploadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileInput className="h-4 w-4" />}
                          {uploadingReport ? "Uploading…" : "Choose PDF"}
                        </button>
                      )}
                      <span className="text-zinc-500 text-sm">or</span>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-lg border border-zinc-500 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-600"
                      >
                        I'll do it later
                      </button>
                    </div>
                    {uploadError && (
                      <p className="mt-3 text-sm text-red-400">{uploadError}</p>
                    )}
                  </div>
                  <div className="mt-6 rounded-lg border border-zinc-600 bg-zinc-700/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick checklist</p>
                    <ul className="mt-3 space-y-2">
                      {["Signed up for monitoring", "Can access your report", "Ready to continue"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleChecklist(i)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              creditChecklist[i] ? "border-orange-500 bg-orange-500" : "border-zinc-500 bg-zinc-700"
                            }`}
                          >
                            {creditChecklist[i] && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </button>
                          <span className="text-sm text-zinc-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Continue to next step <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-xl font-bold text-white">How to Navigate Your Client Portal</h2>
                  <p className="mt-2 text-zinc-300">
                    A quick tour of where to find everything. Watch the walkthrough below or use the labels as your guide.
                  </p>
                  {WALKTHROUGH_VIDEO ? (
                    <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-zinc-900">
                      {WALKTHROUGH_VIDEO.includes("loom.com") ? (
                        <iframe
                          src={WALKTHROUGH_VIDEO.replace("/share/", "/embed/")}
                          allowFullScreen
                          className="h-full w-full"
                        />
                      ) : WALKTHROUGH_VIDEO.includes("youtube.com") || WALKTHROUGH_VIDEO.includes("youtu.be") ? (
                        <iframe
                          src={WALKTHROUGH_VIDEO.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                          allowFullScreen
                          className="h-full w-full"
                        />
                      ) : (
                        <iframe src={WALKTHROUGH_VIDEO} allowFullScreen className="h-full w-full" />
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {TOUR_CARDS.map(({ label, caption, icon: Icon }) => (
                        <div
                          key={label}
                          className="flex gap-3 rounded-lg border border-zinc-600 bg-zinc-700/50 p-4"
                        >
                          <div className="rounded-lg bg-orange-500/20 p-2">
                            <Icon className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{label}</p>
                            <p className="text-sm text-zinc-400 mt-0.5">{caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Continue to next step <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="text-xl font-bold text-white">Upload Your Credit Repair Details</h2>
                  <p className="mt-2 text-zinc-300">
                    Photo ID and proof of address are required. The rest are optional. You can continue and upload anything you don't have yet in the portal later.
                  </p>
                  <p className="mt-1 text-zinc-400 text-sm">Please ensure all information is accurate before submitting.</p>
                  <ul className="mt-4 space-y-3">
                    {UPLOAD_ITEMS.map(({ label, helper, required, category }, index) => {
                      const uploaded = documentByCategory[category];
                      const uploading = uploadingCategory === String(index);
                      return (
                        <li key={label} className="flex items-start justify-between gap-4 rounded-lg border border-zinc-600 bg-zinc-700/50 p-3">
                          <div>
                            <p className="font-medium text-white">
                              {label}
                              {required && <span className="ml-1 text-orange-400">(required)</span>}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">{helper}</p>
                          </div>
                          <div className="shrink-0">
                            <input
                              ref={(el) => { docInputRefs.current[index] = el; }}
                              type="file"
                              accept=".pdf,application/pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadDocument(f, category, index);
                              }}
                            />
                            {uploaded ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-300">
                                <CheckCircle2 className="h-3.5 w-3" /> Uploaded
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={uploading}
                                onClick={() => docInputRefs.current[index]?.click()}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-500 bg-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-500 disabled:opacity-70"
                              >
                                {uploading ? <Loader2 className="h-3.5 w-3 animate-spin" /> : <FileInput className="h-3.5 w-3" />}
                                {uploading ? "Uploading…" : "Choose file"}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm text-zinc-400">
                    Files are saved to your Document Vault. You can also upload or add more later from the portal.
                  </p>
                  {uploadError && (
                    <p className="mt-3 text-sm text-red-400">{uploadError}</p>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Continue to next step <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <h2 className="text-xl font-bold text-white">What Happens Next</h2>
                  <p className="mt-2 text-zinc-300">
                    Once you've completed onboarding and we have your details, here's what to expect. We keep it clear and straightforward — no hype, no unrealistic promises.
                  </p>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-zinc-300">
                    <li>We review your profile and documents.</li>
                    <li>We map out the repair strategy.</li>
                    <li>Work begins on the credit reset process.</li>
                    <li>You receive updates through the portal.</li>
                    <li>Funding readiness and next-step strategy follow as appropriate.</li>
                  </ol>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Continue to next step <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <h2 className="text-xl font-bold text-white">Need Help? / Support</h2>
                  <p className="mt-2 text-zinc-300">
                    If you run into any issues during onboarding, use the support section or message area inside the portal and we'll guide you from there.
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                    <li>Where to ask questions: Support or Messages in the portal.</li>
                    <li>Reply time: typically within 24–48 hours.</li>
                    <li><strong className="text-white">Direct support — calls or text: <a href="tel:+18144984572" className="text-orange-400 hover:underline">+1 (814) 498-4572</a></strong></li>
                    <li>If you're stuck: send a message in the portal so we keep everything in one place.</li>
                    <li>The portal is the best place to stay on top of progress and updates.</li>
                  </ul>
                  <div className="mt-6 rounded-xl border border-orange-500/40 bg-orange-950/40 p-4">
                    <p className="font-medium text-orange-100">
                      You're all set. When you're ready, head to your dashboard to see your progress and next steps. You can finish any remaining uploads there.
                    </p>
                    {reviewMode ? (
                      <Link
                        href="/dashboard"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Go to my dashboard
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={completing}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
                      >
                        {completing ? "Completing…" : "Go to my dashboard"}
                      </button>
                    )}
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          You can always revisit setup from your dashboard.
        </p>
      </div>
    </div>
  );
}
