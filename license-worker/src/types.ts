export interface Env {
  LICENSE_STORE: DurableObjectNamespace<import("./store").LicenseStore>;
  FOLIO_LICENSE_PRIVATE_KEY: string;
  FOLIO_LICENSE_PUBLIC_KEY: string;
  FOLIO_PRODUCT_ID: string;
  DODO_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  /** Requests per minute per IP on the activation routes. Defaults to 20. */
  RATE_LIMIT_PER_MIN?: string;
}

type AppEnv = Env;

declare global {
  namespace Cloudflare {
    interface Env extends AppEnv {}
    interface GlobalProps {
      mainModule: typeof import("./index");
    }
  }
}
