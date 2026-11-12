/**
 * The site's Content-Security-Policy, as `createDecoWorker` (src/edge/worker.ts) takes it. The
 * worker adds the security headers, Studio's origins (production and staging) to `frame-ancestors`
 * and `script-src`, and a draft's no-store / noindex headers itself.
 */

/** Report-only CSP: v7 sent this site's list the same way (`csp` option of createDecoWorkerEntry). */
export const CSP_REPORT_ONLY: readonly string[] = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
];
