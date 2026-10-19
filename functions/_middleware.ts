/// <reference types="@cloudflare/workers-types" />
// Content negotiation: `Accept: text/markdown` gets the build-time markdown twin of the page (see integrations/markdown.mjs).
const wantsMarkdown = (accept: string) =>
  accept.split(',').some((part) => {
    const [type, ...params] = part.trim().split(';');
    return type.trim().toLowerCase() === 'text/markdown' && !params.some((p) => /^\s*q=0(\.0*)?\s*$/.test(p));
  });

export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return next();
  if (!wantsMarkdown(request.headers.get('Accept') ?? '')) {
    const res = await next();
    const html = new Response(res.body, res);
    html.headers.append('Vary', 'Accept');
    return html;
  }
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  const md = await (env as { ASSETS: Fetcher }).ASSETS.fetch(new URL(`${path}index.md`, url));
  if (!md.ok) return next();
  const text = await md.text();
  return new Response(text, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'x-markdown-tokens': String(Math.ceil(text.length / 4)),
    },
  });
};
