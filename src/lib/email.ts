import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? "CreditLyft Portal <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send a single email. No-op if RESEND_API_KEY is not set (e.g. local dev).
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] (no RESEND_API_KEY) would send:", { to, subject });
    }
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text: text ?? undefined,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] Send failed:", e);
    return false;
  }
}

/**
 * Notify client that they have a new message from the portal (e.g. admin sent a message).
 */
export async function sendNewMessageNotification(params: {
  toEmail: string;
  clientName: string;
  messagePreview: string;
  portalUrl: string;
}): Promise<boolean> {
  const { toEmail, clientName, messagePreview, portalUrl } = params;
  const messagesUrl = `${portalUrl.replace(/\/$/, "")}/dashboard/messages`;
  const subject = "You have a new message — CreditLyft Portal";
  const html = `
    <p>Hi${clientName ? ` ${clientName}` : ""},</p>
    <p>You have a new message in your CreditLyft Portal.</p>
    ${messagePreview ? `<p><em>${escapeHtml(messagePreview)}</em></p>` : ""}
    <p><a href="${messagesUrl}">View message</a></p>
    <p style="color:#64748b;font-size:12px;">CreditLyft Portal</p>
  `;
  const text = `You have a new message in your CreditLyft Portal. View it here: ${messagesUrl}`;
  return sendEmail({ to: toEmail, subject, html, text });
}

/**
 * Send password reset email with link. Returns true if sent (or skipped in dev).
 */
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): Promise<boolean> {
  const { toEmail, resetUrl, expiresInMinutes = 60 } = params;
  const subject = "Reset your password — CreditLyft Portal";
  const html = `
    <p>You requested a password reset for your CreditLyft Portal account.</p>
    <p><a href="${escapeHtml(resetUrl)}">Reset password</a></p>
    <p>This link expires in ${expiresInMinutes} minutes. If you didn't request this, you can ignore this email.</p>
    <p style="color:#64748b;font-size:12px;">CreditLyft Portal</p>
  `;
  const text = `Reset your password: ${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes.`;
  return sendEmail({ to: toEmail, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 500);
}
