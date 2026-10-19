// Cloudflare Pages Function: stores sign-ups in the SUBSCRIBERS KV namespace.
// Setup: create a KV namespace, bind it as SUBSCRIBERS in the Pages project, then set emailCapture: true in src/data/site.ts.
interface Env { SUBSCRIBERS?: KVNamespace }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  if (form.get('website')) return new Response(null, { status: 204 }); // honeypot
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return new Response('Invalid email', { status: 400 });
  }
  if (!env.SUBSCRIBERS) return new Response('Not configured', { status: 503 });
  await env.SUBSCRIBERS.put(email, new Date().toISOString());
  return new Response(null, { status: 204 });
};
