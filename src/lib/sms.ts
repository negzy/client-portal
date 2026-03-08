/**
 * SMS via Twilio (optional). No-op if TWILIO_* env not set.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export type SendSmsParams = { to: string; body: string };

export async function sendSms({ to, body }: SendSmsParams): Promise<boolean> {
  if (!accountSid || !authToken || !fromNumber) {
    if (process.env.NODE_ENV === "development") {
      console.log("[sms] (no Twilio config) would send to", to, body.slice(0, 50) + "...");
    }
    return false;
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }).toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[sms] Twilio error:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[sms] Send failed:", e);
    return false;
  }
}
