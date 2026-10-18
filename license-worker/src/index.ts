import { signToken, verifyLicense } from "./crypto";
import { handleWebhook } from "./webhook";
import type { Env } from "./types";

export { LicenseStore } from "./store";

const MACHINE = /^[0-9A-Fa-f]{32}$/;
const MAX_BODY = 2048;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function readActivationBody(request: Request): Promise<{ key: string; machine: string } | Response> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "bad_request" }, 400);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "bad_request" }, 400);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const { key, machine } = (body ?? {}) as { key?: unknown; machine?: unknown };
  if (typeof key !== "string" || typeof machine !== "string" || !MACHINE.test(machine)) {
    return json({ error: "bad_request" }, 400);
  }
  return { key, machine: machine.toUpperCase() };
}

async function handleActivation(request: Request, env: Env, activate: boolean): Promise<Response> {
  const body = await readActivationBody(request);
  if (body instanceof Response) return body;

  const license = await verifyLicense(body.key, env.FOLIO_LICENSE_PUBLIC_KEY);
  if (!license) return json({ error: "invalid_key" }, 403);

  const store = env.LICENSE_STORE.getByName("global");

  if (!activate) {
    const res = await store.deactivate(license.order, body.machine);
    return res.kind === "ok" ? json({}) : json({ error: "not_activated" }, 404);
  }

  const today = new Date().toISOString().slice(0, 10);
  const res = await store.activate(license.order, body.machine, today);
  switch (res.kind) {
    case "unknown":
      return json({ error: "invalid_key" }, 403);
    case "refunded":
      return json({ error: "refunded" }, 403);
    case "in_use":
      return json({ error: "seat_in_use", since: res.since }, 409);
    case "ok": {
      const token = await signToken(
        {
          activated: res.activated,
          email: res.email,
          machine: body.machine,
          name: res.name,
          order: license.order,
          product: "folio",
        },
        env.FOLIO_LICENSE_PRIVATE_KEY,
      );
      return json({ token });
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const route =
      pathname === "/api/dodo-webhook" ? "webhook"
      : pathname === "/api/activate" ? "activate"
      : pathname === "/api/deactivate" ? "deactivate"
      : null;
    if (!route) return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    try {
      if (route === "webhook") return await handleWebhook(request, env);
      // The Mac app is not a browser and sends no Origin header. No CORS headers are ever returned.
      if (request.headers.has("Origin")) return json({ error: "forbidden" }, 403);
      return await handleActivation(request, env, route === "activate");
    } catch (e) {
      console.error("unhandled error", route, e instanceof Error ? e.message : "error");
      return json({ error: "server_error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
