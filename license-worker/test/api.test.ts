import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { Webhook } from "standardwebhooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MAC_A = "00112233445566778899AABBCCDDEEFF";
const MAC_B = "FFEEDDCCBBAA99887766554433221100";
const PRODUCT = "pdt_test_folio";

let sent: { to: string; text: string; idempotencyKey: string | null }[] = [];
let emailOk = true;
let counter = 0;
const realFetch = globalThis.fetch;

beforeEach(() => {
  sent = [];
  emailOk = true;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("https://api.resend.com/")) return realFetch(input, init);
    if (!emailOk) return new Response("nope", { status: 500 });
    const body = JSON.parse(init!.body as string);
    const headers = new Headers(init!.headers);
    sent.push({ to: body.to[0], text: body.text, idempotencyKey: headers.get("Idempotency-Key") });
    return new Response("{}", { status: 200 });
  });
});
afterEach(() => vi.restoreAllMocks());

const call = (path: string, init: RequestInit) =>
  exports.default.fetch(new Request(`https://license.test${path}`, { method: "POST", ...init }));

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  call(path, { headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

function signedWebhook(event: unknown, opts: { id?: string; secret?: string } = {}) {
  const payload = JSON.stringify(event);
  const id = opts.id ?? `evt_${++counter}`;
  const ts = new Date();
  const sig = new Webhook(opts.secret ?? env.DODO_WEBHOOK_SECRET).sign(id, ts, payload);
  return call("/api/dodo-webhook", {
    headers: {
      "Content-Type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "webhook-signature": sig,
    },
    body: payload,
  });
}

const paymentEvent = (paymentId: string, over: Record<string, unknown> = {}) => ({
  type: "payment.succeeded",
  data: {
    payload_type: "Payment",
    payment_id: paymentId,
    status: "succeeded",
    created_at: "2026-10-18T23:30:00Z",
    customer: { customer_id: "cus_1", email: "ada@example.com", name: "Ada Lovelace" },
    product_cart: [{ product_id: PRODUCT, quantity: 1 }],
    ...over,
  },
});

const refundEvent = (paymentId: string, over: Record<string, unknown> = {}) => ({
  type: "refund.succeeded",
  data: { payload_type: "Refund", refund_id: "ref_1", payment_id: paymentId, status: "succeeded", is_partial: false, ...over },
});

/** Buys Folio through the webhook and returns the key from the email. */
async function buy(): Promise<{ key: string; paymentId: string }> {
  const paymentId = `pay_${++counter}_${crypto.randomUUID().slice(0, 8)}`;
  const res = await signedWebhook(paymentEvent(paymentId));
  expect(res.status).toBe(200);
  const key = sent.at(-1)!.text.match(/FOLIO-[A-Za-z0-9_.-]+/)![0];
  return { key, paymentId };
}

describe("webhook", () => {
  it("rejects a bad signature with 401 and does nothing", async () => {
    const res = await signedWebhook(paymentEvent("pay_bad"), { secret: "whsec_" + btoa("another-secret-another-secret!!") });
    expect(res.status).toBe(401);
    expect((await call("/api/dodo-webhook", { body: "{}" })).status).toBe(401);
    expect(sent).toHaveLength(0);
  });

  it("emails the key once; a retried webhook sends nothing more", async () => {
    const paymentId = `pay_dup_${crypto.randomUUID().slice(0, 8)}`;
    const event = paymentEvent(paymentId);
    expect((await signedWebhook(event, { id: "evt_same" })).status).toBe(200);
    expect((await signedWebhook(event, { id: "evt_same" })).status).toBe(200);
    expect((await signedWebhook(event, { id: "evt_other_delivery" })).status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("ada@example.com");
    expect(sent[0].idempotencyKey).toBe(`folio-license-${paymentId}`);
    expect(sent[0].text).toContain("Folio > License");
  });

  it("returns 502 when the email fails, and sends on the retry", async () => {
    const paymentId = `pay_mailfail_${crypto.randomUUID().slice(0, 8)}`;
    emailOk = false;
    expect((await signedWebhook(paymentEvent(paymentId))).status).toBe(502);
    emailOk = true;
    expect((await signedWebhook(paymentEvent(paymentId))).status).toBe(200);
    expect(sent).toHaveLength(1);
  });

  it("ignores other products, other events and unsuccessful payments", async () => {
    expect((await signedWebhook(paymentEvent("pay_x1", { product_cart: [{ product_id: "pdt_other" }] }))).status).toBe(200);
    expect((await signedWebhook(paymentEvent("pay_x2", { status: "failed" }))).status).toBe(200);
    expect((await signedWebhook({ type: "payment.failed", data: { payment_id: "pay_x3" } })).status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it("uses the email as the name when there is none, and the payment's UTC date", async () => {
    const res = await signedWebhook(paymentEvent("pay_noname", { customer: { email: "n@example.com", name: null } }));
    expect(res.status).toBe(200);
    const key = sent[0].text.match(/FOLIO-([A-Za-z0-9_-]+)\./)![1];
    const details = JSON.parse(atob(key.replace(/-/g, "+").replace(/_/g, "/")));
    expect(details).toEqual({ email: "n@example.com", issued: "2026-10-18", name: "n@example.com", order: "pay_noname", product: "folio" });
  });

  it("a refund that arrives before its payment stops the key being emailed", async () => {
    await signedWebhook(refundEvent("pay_early_refund"));
    expect((await signedWebhook(paymentEvent("pay_early_refund"))).status).toBe(200);
    expect(sent).toHaveLength(0);
  });
});

describe("activation", () => {
  it("activates, and a repeat on the same Mac returns the same token", async () => {
    const { key } = await buy();
    const first = await post("/api/activate", { key, machine: MAC_A });
    expect(first.status).toBe(200);
    const { token } = (await first.json()) as { token: string };
    expect(token).toMatch(/^FOLIOACT-/);
    const details = JSON.parse(atob(token.slice(9).split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
    expect(details).toMatchObject({ machine: MAC_A, email: "ada@example.com", name: "Ada Lovelace", product: "folio" });
    expect(details.activated).toBe(new Date().toISOString().slice(0, 10));

    const again = await post("/api/activate", { key, machine: MAC_A.toLowerCase() });
    expect(again.status).toBe(200);
    expect(((await again.json()) as { token: string }).token).toBe(token);
  });

  it("gives a second Mac 409 with only the day; deactivate frees the seat for it", async () => {
    const { key } = await buy();
    expect((await post("/api/activate", { key, machine: MAC_A })).status).toBe(200);

    const blocked = await post("/api/activate", { key, machine: MAC_B });
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual({ error: "seat_in_use", since: new Date().toISOString().slice(0, 10) });

    const freed = await post("/api/deactivate", { key, machine: MAC_A });
    expect(freed.status).toBe(200);
    expect(await freed.json()).toEqual({});

    expect((await post("/api/activate", { key, machine: MAC_B })).status).toBe(200);
  });

  it("a Mac that doesn't hold the seat cannot free it", async () => {
    const { key } = await buy();
    expect((await post("/api/deactivate", { key, machine: MAC_A })).status).toBe(404);
    await post("/api/activate", { key, machine: MAC_A });
    const res = await post("/api/deactivate", { key, machine: MAC_B });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_activated" });
    expect((await post("/api/activate", { key, machine: MAC_B })).status).toBe(409);
  });

  it("refused as refunded after a refund, but deactivate still works", async () => {
    const { key, paymentId } = await buy();
    await post("/api/activate", { key, machine: MAC_A });
    expect((await signedWebhook(refundEvent(paymentId))).status).toBe(200);

    const res = await post("/api/activate", { key, machine: MAC_B });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "refunded" });
    expect((await post("/api/activate", { key, machine: MAC_A })).status).toBe(403);
    expect((await post("/api/deactivate", { key, machine: MAC_A })).status).toBe(200);
  });

  it("a partial refund does not revoke the license", async () => {
    const { key, paymentId } = await buy();
    await signedWebhook(refundEvent(paymentId, { is_partial: true, amount: 100 }));
    expect((await post("/api/activate", { key, machine: MAC_A })).status).toBe(200);
  });

  it("rejects tampered, wrong-product and unknown-order keys with 403 invalid_key", async () => {
    const { key } = await buy();
    const [d, s] = key.slice(6).split(".");
    const tampered = `FOLIO-${d.slice(0, 12)}${d[12] === "A" ? "B" : "A"}${d.slice(13)}.${s}`;
    for (const bad of [tampered, "FOLIO-abc.def", "garbage", ""]) {
      const res = await post("/api/activate", { key: bad, machine: MAC_A });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "invalid_key" });
    }
    expect((await post("/api/deactivate", { key: tampered, machine: MAC_A })).status).toBe(403);

    const { signLicense } = await import("../src/crypto");
    const unknown = await signLicense(
      { email: "x@example.com", issued: "2026-10-18", name: "X", order: "pay_never_paid", product: "folio" },
      env.FOLIO_LICENSE_PRIVATE_KEY,
    );
    const res = await post("/api/activate", { key: unknown, machine: MAC_A });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "invalid_key" });
  });

  it("rejects bad machine codes and malformed bodies with 400", async () => {
    const { key } = await buy();
    for (const machine of ["", "123", MAC_A + "0", "0011-2233-4455-6677-8899-AABB-CCDD-EEFF", "Z".repeat(32), 12345, null]) {
      expect((await post("/api/activate", { key, machine })).status).toBe(400);
      expect((await post("/api/deactivate", { key, machine })).status).toBe(400);
    }
    expect((await post("/api/activate", { machine: MAC_A })).status).toBe(400);
    expect((await call("/api/activate", { headers: { "Content-Type": "application/json" }, body: "{nope" })).status).toBe(400);
    expect((await call("/api/activate", { headers: { "Content-Type": "text/plain" }, body: "{}" })).status).toBe(400);
  });

  it("refuses browser requests and sends no CORS headers", async () => {
    const { key } = await buy();
    const res = await post("/api/activate", { key, machine: MAC_A }, { Origin: "https://evil.example" });
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const ok = await post("/api/activate", { key, machine: MAC_A });
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await exports.default.fetch(new Request("https://license.test/api/activate", { method: "OPTIONS" }))).status).toBe(405);
  });

  it("concurrent activations of one key give exactly one winner", async () => {
    const { key } = await buy();
    const macs = Array.from({ length: 12 }, (_, i) => i.toString(16).padStart(2, "0").toUpperCase().repeat(16));
    const results = await Promise.all(macs.map((machine) => post("/api/activate", { key, machine })));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(11);
  });
});
