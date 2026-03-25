"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  creditMonitoringEmail: string;
  creditMonitoringUsername: string;
  creditMonitoringNotes: string;
  businessName: string;
  businessEntityType: string;
  llcState: string;
  ein: string;
  preferredContactMethod: string;
};

export function ProfileForm({
  clientProfileId,
  initial,
}: {
  clientProfileId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address?.trim() || undefined,
          city: form.city?.trim() || undefined,
          state: form.state?.trim() || undefined,
          zip: form.zip?.trim() || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          businessName: form.businessName?.trim() || undefined,
          businessEntityType: form.businessEntityType || undefined,
          llcState: form.llcState?.trim() || undefined,
          ein: form.ein?.trim() || undefined,
          preferredContactMethod: form.preferredContactMethod || undefined,
          creditMonitoringEmail: form.creditMonitoringEmail?.trim() || null,
          creditMonitoringUsername: form.creditMonitoringUsername?.trim() || null,
          creditMonitoringNotes: form.creditMonitoringNotes?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-elevated space-y-5 p-6">
      <h2 className="section-heading">Personal</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-firstName">First name <span className="text-slate-500">(required)</span></label>
          <input
            id="profile-firstName"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-lastName">Last name <span className="text-slate-500">(required)</span></label>
          <input
            id="profile-lastName"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="input-field"
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="profile-email">Email <span className="text-slate-500">(required)</span></label>
        <input
          id="profile-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="profile-phone">Phone <span className="text-slate-500">(required)</span></label>
        <input
          id="profile-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="profile-dateOfBirth">Date of birth <span className="text-slate-500">(optional)</span></label>
        <input
          id="profile-dateOfBirth"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          className="input-field"
        />
      </div>
      <div>
        <label className="label" htmlFor="profile-contactMethod">Preferred contact method <span className="text-slate-500">(optional)</span></label>
        <select
          id="profile-contactMethod"
          value={form.preferredContactMethod}
          onChange={(e) => setForm((f) => ({ ...f, preferredContactMethod: e.target.value }))}
          className="input-field"
        >
          <option value="">—</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="portal">Portal message</option>
        </select>
      </div>

      <h2 className="section-heading mt-8">Address <span className="text-slate-500 font-normal text-sm">(optional)</span></h2>
      <div>
        <label className="label">Street address</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="input-field"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">State</label>
          <input
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">ZIP</label>
          <input
            value={form.zip}
            onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>

      <h2 className="section-heading mt-8">
        Credit monitoring <span className="text-slate-500 font-normal text-sm">(optional)</span>
      </h2>
      <p className="text-sm text-slate-400">
        Save the login or member details for your monitoring service so your file stays complete. Do not share passwords in unsecured email — the portal is the right place for this.
      </p>
      <div>
        <label className="label" htmlFor="profile-cm-email">Monitoring login email</label>
        <input
          id="profile-cm-email"
          type="email"
          value={form.creditMonitoringEmail}
          onChange={(e) => setForm((f) => ({ ...f, creditMonitoringEmail: e.target.value }))}
          className="input-field"
          placeholder="e.g. the email you use on MyFreeScoreNow"
        />
      </div>
      <div>
        <label className="label" htmlFor="profile-cm-user">Username / member ID</label>
        <input
          id="profile-cm-user"
          value={form.creditMonitoringUsername}
          onChange={(e) => setForm((f) => ({ ...f, creditMonitoringUsername: e.target.value }))}
          className="input-field"
          placeholder="If different from email"
        />
      </div>
      <div>
        <label className="label" htmlFor="profile-cm-notes">Notes</label>
        <textarea
          id="profile-cm-notes"
          value={form.creditMonitoringNotes}
          onChange={(e) => setForm((f) => ({ ...f, creditMonitoringNotes: e.target.value }))}
          className="input-field min-h-[4rem]"
          placeholder="Portal URL, security word hints, or other non-password details you want on file"
        />
      </div>

      <h2 className="section-heading mt-8">Business <span className="text-slate-500 font-normal text-sm">(optional)</span></h2>
      <div>
        <label className="label">Business name</label>
        <input
          value={form.businessName}
          onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
          className="input-field"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Business entity type</label>
          <select
            value={form.businessEntityType}
            onChange={(e) => setForm((f) => ({ ...f, businessEntityType: e.target.value }))}
            className="input-field"
          >
            <option value="">—</option>
            <option value="LLC">LLC</option>
            <option value="Corporation">Corporation</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">LLC state</label>
          <input
            value={form.llcState}
            onChange={(e) => setForm((f) => ({ ...f, llcState: e.target.value }))}
            className="input-field"
            placeholder="e.g. DE, WY"
          />
        </div>
      </div>
      <div>
        <label className="label">EIN</label>
        <input
          value={form.ein}
          onChange={(e) => setForm((f) => ({ ...f, ein: e.target.value }))}
          className="input-field"
          placeholder="Optional"
        />
      </div>

      {error && (
        <p className="rounded bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>
      )}
      {saved && (
        <p className="rounded bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Profile saved.</p>
      )}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
