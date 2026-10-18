import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

// RFC 8032 test key. Never for real keys.
const TEST_SEED = "nWGxne/9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A=";
const TEST_PUBLIC = "11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          FOLIO_LICENSE_PRIVATE_KEY: TEST_SEED,
          FOLIO_LICENSE_PUBLIC_KEY: TEST_PUBLIC,
          FOLIO_PRODUCT_ID: "pdt_test_folio",
          DODO_WEBHOOK_SECRET: "whsec_" + btoa("folio-test-webhook-secret-0123456789"),
          RESEND_API_KEY: "re_test",
          EMAIL_FROM: "Folio <license@example.com>",
        },
      },
    }),
  ],
});
