"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Message = {
  id: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { name: string | null; id: string };
  senderId: string;
  recipientId: string;
};

export function MessageThread({
  messages,
  currentUserId,
  clientProfileId,
}: {
  messages: Message[];
  currentUserId: string;
  clientProfileId: string;
}) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/messages/mark-read", { method: "POST" }).then((r) => {
      if (r.ok) router.refresh();
    });
  }, [router]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientClientProfileId: clientProfileId,
          body: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage("");
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card flex flex-col">
      <div className="max-h-[60vh] space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-slate-400">No messages yet. Send a message to start.</p>
        ) : (
          [...messages].reverse().map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    isMe
                      ? "bg-brand-500/30 text-white"
                      : "bg-surface border border-surface-border text-slate-200"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs text-slate-500">{msg.sender.name ?? "Admin"}</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex gap-2 border-t border-surface-border pt-4">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message…"
          rows={2}
          className="input-field min-w-0 flex-1 resize-none"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
