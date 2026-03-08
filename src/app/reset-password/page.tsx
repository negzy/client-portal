"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (!token) {
      setError("Invalid reset link. Request a new one.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background-primary px-4">
        <div className="rounded-lg border border-surface-border bg-surface-card p-8 shadow-card text-center">
          <h1 className="text-xl font-bold text-white">Invalid link</h1>
          <p className="mt-2 text-sm text-text-secondary">This reset link is missing or invalid. Request a new one.</p>
          <Link href="/forgot-password" className="mt-4 inline-block font-medium text-brand-500 hover:text-brand-400">
            Request reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-primary px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-background-secondary to-navy-900" />
      <div className="relative w-full max-w-md">
        <div className="rounded-lg border border-surface-border bg-surface-card p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-white">Set new password</h1>
          <p className="mt-2 text-sm text-text-secondary">Choose a password at least 8 characters long.</p>

          {success ? (
            <p className="mt-6 text-emerald-400">Password updated. Redirecting to sign in…</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="label">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="rounded bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-muted">
            <Link href="/login" className="font-medium text-brand-500 hover:text-brand-400">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface text-slate-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
