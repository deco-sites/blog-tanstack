/**
 * The headers the worker entry (src/worker-entry.ts) adds to responses: the security headers every
 * HTML page carries, and the ones a draft preview needs. Kept apart from the worker so tests can
 * read them without TanStack Start's server entry.
 */

/**
 * Who may frame the site: deco Studio, whose site editor previews the blog in an iframe (v7's
 * `DECO_ADMIN_FRAME_ANCESTORS`), plus a Studio running on this machine in `vite dev`. Sent on every
 * HTML response as an enforced `Content-Security-Policy: frame-ancestors`, with no
 * `X-Frame-Options`, as v7's `createDecoWorkerEntry` does (`DEFAULT_FRAME_ANCESTORS_CSP`): CSP
 * `frame-ancestors` supersedes X-Frame-Options and, unlike SAMEORIGIN, can allow Studio's origin
 * while refusing every other site.
 */
export function frameAncestors(dev: boolean): string[] {
  return [
    "'self'",
    "https://studio.decocms.com",
    "https://*.deco.studio",
    ...(dev ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
  ];
}

/** Report-only CSP: v7 sent this site's list the same way (`csp` option of createDecoWorkerEntry). */
const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
];

/** The security headers of every HTML response (v7's DEFAULT_SECURITY_HEADERS plus this site's CSP). */
export function securityHeaders(dev: boolean): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Content-Security-Policy": `frame-ancestors ${frameAncestors(dev).join(" ")}`,
    "Content-Security-Policy-Report-Only": CSP_DIRECTIVES.join("; "),
  };
}

/**
 * A draft preview's response: never stored, never indexed (v7's `applyDraftCookieAndHeaders`,
 * @decocms/tanstack 7.x src/sdk/draft.ts). With the pointer in a cookie, a draft and the published
 * page share one URL, so `no-store` is what stops a browser or CDN from keeping unpublished content
 * under the public URL; `Vary: Cookie` keeps any intermediary that honours it from mixing the two;
 * `X-Robots-Tag` keeps a leaked draft link out of search results.
 */
export function withDraftHeaders(resp: Response): Response {
  const out = new Response(resp.body, resp);
  out.headers.set("Cache-Control", "no-store, private");
  out.headers.set("CDN-Cache-Control", "no-store");
  const vary = out.headers.get("Vary");
  if (!vary) out.headers.set("Vary", "Cookie");
  else if (!/\bcookie\b/i.test(vary)) out.headers.set("Vary", `${vary}, Cookie`);
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  out.headers.set("X-Cache", "BYPASS");
  return out;
}
