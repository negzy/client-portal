"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to update password");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-elevated space-y-5 p-6">
      <h2 className="section-heading">Change password</h2>
      <p className="section-sub">Update your sign-in password. Use at least 8 characters.</p>
      <div>
        <label className="label" htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-field"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="label" htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
      {success && (
        <p className="rounded bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Password updated.</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
