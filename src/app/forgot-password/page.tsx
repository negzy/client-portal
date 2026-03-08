"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-primary px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-background-secondary to-navy-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.08),transparent)]" />
      <div className="relative w-full max-w-md">
        <div className="rounded-lg border border-surface-border bg-surface-card p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="mt-6 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400">
              If that email is on file, we sent a reset link. Check your inbox and spam folder.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="rounded bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? "Sending…" : "Send reset link"}
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
