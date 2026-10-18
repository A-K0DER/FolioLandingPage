import { Webhook } from "standardwebhooks";
import { signLicense } from "./crypto";
import { sendLicenseEmail } from "./email";
import type { Env } from "./types";

interface DodoEvent {
  type?: string;
  data?: {
    payment_id?: string;
    status?: string;
    created_at?: string;
    is_partial?: boolean;
    customer?: { email?: string | null; name?: string | null };
    product_cart?: { product_id?: string }[] | null;
  };
}

const text = (body: string, status: number) => new Response(body, { status });

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const raw = await request.text();
  let event: DodoEvent;
  try {
    const headers = {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    };
    event = new Webhook(env.DODO_WEBHOOK_SECRET).verify(raw, headers) as DodoEvent;
  } catch {
    return text("invalid signature", 401);
  }

  const store = env.LICENSE_STORE.getByName("global");
  const data = event.data ?? {};
  const paymentId = data.payment_id;

  if (event.type === "payment.succeeded") {
    if (!paymentId || (data.status && data.status !== "succeeded")) return text("ignored", 200);
    if (!data.product_cart?.some((p) => p.product_id === env.FOLIO_PRODUCT_ID)) return text("ignored", 200);

    const email = data.customer?.email?.trim();
    const created = data.created_at ? new Date(data.created_at) : null;
    if (!email || !created || Number.isNaN(created.getTime())) {
      console.error("payment.succeeded missing email or created_at", paymentId);
      return text("unprocessable payment", 422);
    }
    const issued = created.toISOString().slice(0, 10);
    const name = data.customer?.name?.trim() || email;

    const order = await store.recordPayment({ paymentId, email, name, issued });
    if (order.handled) return text("duplicate", 200);
    if (order.status === "refunded") {
      await store.markHandled(paymentId);
      return text("refunded", 200);
    }
    try {
      const key = await signLicense({ email, issued, name, order: paymentId, product: "folio" }, env.FOLIO_LICENSE_PRIVATE_KEY);
      await sendLicenseEmail(env, email, name, key, paymentId);
    } catch (e) {
      console.error("license email failed", paymentId, e instanceof Error ? e.message : "error");
      return text("email failed", 502);
    }
    await store.markHandled(paymentId);
    return text("ok", 200);
  }

  if (event.type === "refund.succeeded") {
    if (!paymentId || (data.status && data.status !== "succeeded")) return text("ignored", 200);
    if (data.is_partial) return text("partial refund ignored", 200);
    await store.refund(paymentId);
    return text("ok", 200);
  }

  return text("ignored", 200);
}
