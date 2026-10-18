import type { Env } from "./types";

export async function sendLicenseEmail(
  env: Env,
  to: string,
  name: string,
  key: string,
  paymentId: string,
): Promise<void> {
  const text = `Hi ${name},

Thank you for buying Folio. Your license key is below.

${key}

To activate:
1. Copy the whole key above.
2. Open Folio and choose Folio > License… (or click Activate at the bottom left of a Folio window).
3. Paste the key and click Activate.

One license works on one Mac. To move Folio to another Mac, choose Deactivate on the old one first, then activate on the new one.

If Folio isn't right for you, reply to this email within 30 days for a refund.
`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      // Resend dedupes on this, so a retry after a crash can't send twice.
      "Idempotency-Key": `folio-license-${paymentId}`,
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject: "Your Folio license key", text }),
  });
  if (!res.ok) throw new Error(`email provider returned ${res.status}`);
}
