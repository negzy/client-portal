"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Compass } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to your portal",
    body: "This short tour walks you through the main areas. You can replay it anytime from the sidebar.",
  },
  {
    title: "Dashboard",
    body: "Your home base. Here you’ll see your credit scores, next steps, tasks, and a quick view of your progress. Check back after uploading your report or when your team updates your account.",
  },
  {
    title: "Credit Import",
    body: "Upload your credit report PDF here. We use it to pull your scores and identify items to work on. You can upload a new report anytime your scores update.",
  },
  {
    title: "Document Vault",
    body: "Store your ID, proof of address, SSN card, and other documents we need. Everything stays in one place and is visible only to you and your team.",
  },
  {
    title: "Tasks & Progress",
    body: "Tasks show what to do next. Progress shows how your dispute and repair work is moving. Use these to stay on track.",
  },
  {
    title: "Messages",
    body: "Get updates from your team and reply here. We keep all communication in the portal so nothing gets lost.",
  },
  {
    title: "Profile",
    body: "Update your name, email, phone, and password. Make sure your contact details are correct so we can reach you.",
  },
  {
    title: "You’re all set",
    body: "Use the sidebar to jump to any section. If you need help, use Messages or your team’s support number. Good luck with your credit journey.",
  },
];

export function PortalTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;

  function close() {
    setOpen(false);
    setStep(0);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-brand-500/50 bg-brand-500/10 px-3 py-2.5 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-500/20 hover:text-brand-300"
      >
        <Compass className="h-5 w-5 shrink-0" />
        <span>Take the tour</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl"
            role="dialog"
            aria-labelledby="tour-title"
            aria-describedby="tour-body"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-surface-border hover:text-white"
              aria-label="Close tour"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-xs font-medium uppercase tracking-wider text-brand-500">
              Step {step + 1} of {total}
            </p>
            <h2 id="tour-title" className="mt-2 text-xl font-bold text-white">
              {current.title}
            </h2>
            <p id="tour-body" className="mt-3 text-slate-300">
              {current.body}
            </p>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={close}
                className="text-sm font-medium text-slate-400 hover:text-white"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm font-medium text-slate-200 hover:bg-surface-border"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                )}
                {isLast ? (
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
