/**
 * The Worker (src/worker-entry.ts serves it; the tests run it with a stand-in for TanStack Start):
 * TanStack Start behind `createDecoWorker` (@decocms/tanstack), which owns drafts (a `?__draft=`
 * link or the draft cookie, on a host the CMS allows), the CMS redirects, the visitor and its tests
 * and campaigns, Studio framing (CSP `frame-ancestors` and `script-src`), the security headers,
 * `x-page-status`, `/deco/_liveness` and the request metric. What stays the site's is the page
 * cache (./page-cache.ts).
 */
import { createDecoWorker, type ExecutionContextLike, type ServerEntry } from "@decocms/tanstack/worker";
import { cms } from "../cms";
import { CSP_REPORT_ONLY } from "./headers";
import { createPageCache } from "./page-cache";

export interface BlogWorkerOptions {
  /** TanStack Start's server entry. */
  serverEntry: ServerEntry;
  /** The build's id (`__BUILD_HASH__`), part of every page cache key. */
  buildHash: string;
  dev?: boolean;
  /** Stylesheets every page preloads (a `Link` header). */
  styles?: readonly string[];
}

export function blogWorker({ serverEntry, buildHash, dev = false, styles = [] }: BlogWorkerOptions) {
  const worker = createDecoWorker({
    serverEntry,
    cms,
    dev,
    // v7's report-only list. The worker adds Studio's origins (production and staging, and
    // `*.deco.studio`, which v7 also allowed) to `frame-ancestors` and `script-src`.
    csp: { reportOnly: CSP_REPORT_ONLY },
    preload: { styles },
    pageCache: createPageCache(buildHash),
  });
  return {
    fetch: (request: Request, env: unknown, ctx: ExecutionContextLike): Promise<Response> =>
      worker.fetch(request, env, ctx),
  };
}
