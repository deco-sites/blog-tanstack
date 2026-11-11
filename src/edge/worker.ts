/**
 * The Worker (src/worker-entry.ts serves it; the tests run it with a stand-in for TanStack Start):
 * TanStack Start behind `createDecoWorker` (@decocms/tanstack), which owns drafts (a `?__draft=`
 * link or the draft cookie, on a host the CMS allows), the CMS redirects, the visitor and its tests
 * and campaigns, Studio framing (CSP `frame-ancestors` and `script-src`), the security headers,
 * `x-page-status`, `/deco/_liveness` and the request metric. What stays the site's is the page
 * cache (./page-cache.ts), HEAD, and the visitor cookie while no test needs it (below).
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

/** The visitor cookie `createDecoWorker` sends a first-time visitor (@decocms/blocks/experiments). */
const VISITOR_COOKIE = "deco_segment=";

/** Whether the release saves an A/B test, decided once per content revision. */
let savedTests: { revision: string; any: Promise<boolean> } | undefined;

async function releaseSavesTests(): Promise<boolean> {
  const client = cms.client();
  const revision = await client.revision();
  if (savedTests?.revision !== revision) {
    // The tests the worker splits visitors by (`readAssignments` reads the same block).
    const any = client.resolve<unknown>("experiments").then(([tests]) =>
      tests !== null && typeof tests === "object" ? Object.keys(tests).length > 0 : false,
    );
    savedTests = { revision, any };
  }
  return savedTests.any;
}

/**
 * `createDecoWorker` gives every first-time visitor a year-long `deco_segment` cookie: a random id
 * an A/B test splits visitors by (campaigns are by date, for everyone). v7 sent none, and while the
 * release saves no test nothing reads it, so it is dropped; a test saved in Studio brings it back,
 * without a deploy. A failed render (5xx, often content that didn't load) is left as it is, and so
 * is a response when the release can't be read.
 */
async function withoutIdleVisitorCookie(response: Response): Promise<Response> {
  if (response.status >= 500) return response;
  const cookies = response.headers.getSetCookie();
  if (!cookies.some((cookie) => cookie.startsWith(VISITOR_COOKIE))) return response;
  if (await releaseSavesTests().catch(() => true)) return response;
  const out = new Response(response.body, response);
  out.headers.delete("Set-Cookie");
  for (const cookie of cookies) if (!cookie.startsWith(VISITOR_COOKIE)) out.headers.append("Set-Cookie", cookie);
  return out;
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
  const serve = async (request: Request, env: unknown, ctx: ExecutionContextLike) =>
    withoutIdleVisitorCookie(await worker.fetch(request, env, ctx));

  return {
    async fetch(request: Request, env: unknown, ctx: ExecutionContextLike): Promise<Response> {
      if (request.method !== "HEAD") return serve(request, env, ctx);
      // HEAD answers what GET does, without the body: the worker hands only GETs to the page cache,
      // which sets the page's Cache-Control and Vary (and may answer from the edge copy). The
      // request metric counts it as the GET it is served as.
      const response = await serve(new Request(request, { method: "GET" }), env, ctx);
      await response.body?.cancel();
      return new Response(null, response);
    },
  };
}
