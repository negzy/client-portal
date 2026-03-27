"use client";

import { useState } from "react";
import Link from "next/link";

export default function LeadCapturePage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error?.message ?? data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "Thanks! We'll be in touch.");
      setForm({ fullName: "", email: "", phone: "" });
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold">Get in touch</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Leave your details and we&apos;ll reach out about credit repair and funding readiness.
        </p>
        {status === "success" && (
          <p className="mt-4 rounded-lg bg-emerald-500/20 p-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{message}</p>
        )}
        {status !== "success" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Name *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {status === "loading" ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-orange-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
