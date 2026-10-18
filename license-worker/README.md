# Folio license server

A Cloudflare Worker that sells and activates Folio licenses.

- `POST /api/public/dodo-webhook` receives Dodo Payments webhooks. A successful Folio payment makes an Ed25519-signed key and emails it to the buyer. A full refund marks the order refunded.
- `POST /api/public/activate` and `POST /api/public/deactivate` are called by the Folio Mac app. One Mac per key.

State (orders, seats, handled payments, rate-limit counters) lives in one SQLite-backed Durable Object, `LicenseStore`. It handles one request at a time, which is what makes seat taking atomic.

## Layout

```
src/index.ts     routes, validation, rate limit, activation logic
src/webhook.ts   Dodo signature check, payment and refund handling
src/store.ts     LicenseStore Durable Object
src/crypto.ts    key and token signing, verification
src/email.ts     Resend client and the email text
test/            Vitest (Workers runtime)
```

## Setup

```sh
cd license-worker
npm install        # .npmrc sets legacy-peer-deps because npm's peer resolver crashes on this tree
npm test
```

### 1. Keypair

Generate it with your `folio-license generate-keys` tool. You get two values:

| Value | Where it goes |
|---|---|
| Private key (base64 of the 32-byte seed) | Worker **secret** `FOLIO_LICENSE_PRIVATE_KEY`. Never in git. |
| Public key (base64 of the raw 32 bytes) | `FOLIO_LICENSE_PUBLIC_KEY` in `wrangler.jsonc` (it is not secret), and compiled into the Folio app. |

Use one keypair for test and one for live if you want a test key to be worthless in production.

### 2. Config in `wrangler.jsonc`

Replace the `REPLACE_…` values and `EMAIL_FROM` in the `test` and `production` blocks. `EMAIL_FROM` must be on a domain you have verified in Resend. The test product ID is already filled in. The live ID comes at go-live.

### 3. Secrets

Test and live are separate Workers (`folio-license-test`, `folio-license`) with separate storage.

```sh
npx wrangler secret put FOLIO_LICENSE_PRIVATE_KEY --env test
npx wrangler secret put DODO_WEBHOOK_SECRET       --env test   # whsec_… from Dodo (step 5)
npx wrangler secret put RESEND_API_KEY            --env test
```

Repeat with `--env production` at go-live. Each command prompts for the value, so it never lands in shell history.

Live URLs (production route `mac-folio.com/api/public/*`):

- `https://mac-folio.com/api/public/dodo-webhook` (Dodo, no double slash)
- `https://mac-folio.com/api/public/activate` and `/deactivate` (the Mac app)

### 4. Deploy the test Worker

```sh
npm run deploy:test
```

Wrangler prints the URL, e.g. `https://folio-license-test.<your-subdomain>.workers.dev`.

### 5. Dodo product and webhook (test mode)

1. In Dodo, switch to **test mode**. Create a **One Time** digital product with no license-key or file entitlement. The test product is `pdt_0Nq1EUkyJ4XjGzf8ordZ1`.
2. **Developer → Webhooks → Create Webhook.** URL: `https://<worker-host>/api/public/dodo-webhook`. Subscribe to `payment.succeeded` and `refund.succeeded`.
3. Copy the signing secret (`whsec_…`) and store it with `wrangler secret put DODO_WEBHOOK_SECRET --env test`.
4. Use **Send Example** on the endpoint to check it answers 200. The example's product ID won't match, so the Worker ignores it. That still proves the signature check works. Then make a real test-mode purchase to see the email.

The Worker reads `data.product_cart[].product_id`, `data.customer.{email,name}` and `data.created_at` from `payment.succeeded`, and `data.payment_id` and `data.is_partial` from `refund.succeeded`. These come from Dodo's API reference. Confirm them against your first real test payload (Dodo dashboard → webhook → logs).

## Local development

```sh
cp .dev.vars.example .dev.vars   # fill in the three secrets
npx wrangler dev                 # http://localhost:8787
```

`wrangler dev` uses the top-level config, so set a real `FOLIO_LICENSE_PUBLIC_KEY` there (or the matching key will never verify). The Folio Debug build can point at it with `FOLIO_ACTIVATION_URL=http://localhost:8787`.

To get an order locally you need a signed webhook. `dodo wh listen http://localhost:8787/api/public/dodo-webhook` forwards real test-mode events, but it creates its own webhook, so check which signing secret it prints and use that in `.dev.vars`. Unsigned events from `dodo wh trigger` are rejected with 401 by design.

Quick check of the app routes:

```sh
curl -s -X POST localhost:8787/api/public/activate -H 'Content-Type: application/json' \
  -d '{"key":"FOLIO-…","machine":"00112233445566778899AABBCCDDEEFF"}'
```

## API summary

Both app routes: `POST`, `application/json`, body `{ "key", "machine" }` where `machine` is 32 hex digits (lowercase is accepted and uppercased).

| Route | Result |
|---|---|
| activate | `200 {"token"}` · `403 invalid_key` / `refunded` · `409 seat_in_use` with `since` · `400` bad body · `429` |
| deactivate | `200 {}` · `404 not_activated` · `403 invalid_key` · `400` · `429` |

Requests with an `Origin` header get 403, and no CORS headers are sent. Rate limit: 20 requests per minute per IP across both routes, set with the optional var `RATE_LIMIT_PER_MIN`.

A refund only stops *new* activations. A Mac that is already activated keeps its token. Deactivate works for refunded orders.

## Go-live checklist

- [ ] Create the product in Dodo **live mode**. Put its ID in `FOLIO_PRODUCT_ID` in the `production` block.
- [ ] Create the live webhook (same URL shape, production Worker host, same two events). Copy its `whsec_…`.
- [ ] Set the production secrets: `FOLIO_LICENSE_PRIVATE_KEY`, `DODO_WEBHOOK_SECRET` (live), `RESEND_API_KEY` (all with `--env production`).
- [ ] Check that the production `FOLIO_LICENSE_PUBLIC_KEY` matches the private key you uploaded and the key compiled into the app that ships.
- [ ] `npm run deploy`.
- [ ] Make one real purchase. Confirm the email arrives, then activate, repeat-activate, and deactivate from the app.
- [ ] Refund that purchase in Dodo. Confirm the `refund.succeeded` delivery got a 200 and that a new activation now returns `refunded`.
- [ ] Optional: add a custom route for the Worker in `wrangler.jsonc` (for example `license.<your-domain>`) before the app ships, so the URL in the app never has to change.

## Operational notes

- **Retries.** Dodo retries any non-2xx. A failed email returns 502, so the payment is retried and no key is lost.
- **Refund before payment.** Events can arrive out of order. A refund for an unknown payment is stored, so a late payment event does not send a key.
- **Partial refunds** and chargebacks (`dispute.*`) do not revoke a license. Dispute handling (`dispute.lost`, `dispute.accepted`) is not implemented yet.
- **Logs** contain event names, payment IDs and status only. No keys, tokens or emails.
