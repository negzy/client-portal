"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-primary px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-background-secondary to-navy-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-lg border border-surface-border bg-surface-card p-8 shadow-card backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CreditLyft Portal
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Credit repair · Funding readiness · Capital access
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Sign in to track progress, manage tasks, and access your funding readiness dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="rounded bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full py-2.5">
              Sign in
            </button>
            <p className="text-center text-sm text-text-muted">
              <Link href="/forgot-password" className="font-medium text-brand-500 hover:text-brand-400">
                Forgot password?
              </Link>
            </p>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-brand-500 hover:text-brand-400">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-slate-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
