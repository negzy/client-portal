"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminMessageForm({
  clientProfileId,
}: {
  clientProfileId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientClientProfileId: clientProfileId,
          body: body.trim(),
        }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-surface-border pt-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message to client…"
        rows={2}
        className="input-field min-w-0 flex-1 resize-none"
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className="btn-primary shrink-0"
      >
        Send
      </button>
    </form>
  );
}
