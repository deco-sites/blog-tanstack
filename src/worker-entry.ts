/**
 * The Worker's entry: TanStack Start behind `createDecoWorker` (@decocms/tanstack), which owns drafts
 * (a `?__draft=` link or the draft cookie, on a host the CMS allows), the CMS redirects, the visitor
 * and its tests and campaigns, Studio framing (CSP `frame-ancestors` and `script-src`), the security
 * headers, `x-page-status`, `/deco/_liveness` and the request metric.
 *
 * What stays the site's is the page cache below: the Cloudflare Cache API, with the profiles this
 * blog has always served (src/edge/cache-profiles.ts), keyed by path and query (tracking params
 * dropped), `<build>.<content revision>` (`cacheVersion`: a publish changes every key without a
 * deploy), the device and the tests and campaigns the worker decided (never the visitor's id).
 * The worker calls it only for GETs of the current release, never for a preview, never in `vite dev`.
 */
import {
  assignmentsKey,
  cacheVersion,
  createDecoWorker,
  DEGRADED_HEADER,
  isServerFnPath,
  type PageRequest,
  serverFnPagePath,
} from "@decocms/tanstack/worker";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { cms } from "./cms";
import { cacheControl, detectCacheProfile, PROFILES } from "./edge/cache-profiles";
import { CSP_REPORT_ONLY, LEGACY_FRAME_ANCESTORS } from "./edge/headers";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

/** Query params that never change a page: left out of the cache key. */
const TRACKING_PARAMS = /^(utm_\w+|gclid|gclsrc|dclid|fbclid|msclkid|mc_cid|mc_eid|_ga|_gl|yclid|igshid|ttclid|twclid|li_fat_id)$/i;

/** When the edge copy was stored, so its age can be compared with the profile. */
const STORED_AT = "x-edge-stored-at";

/** A request's profile: a GET server function (a client-side navigation) takes its page's. */
function profileOf(url: URL) {
  if (!isServerFnPath(url.pathname)) return detectCacheProfile(url);
  const page = serverFnPagePath(url);
  return page ? detectCacheProfile(new URL(page, url.origin)) : "listing";
}

function cacheKey(url: URL, version: string, device: string, assigned: string): Request {
  const key = new URL(url);
  key.hash = "";
  for (const name of [...key.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(name)) key.searchParams.delete(name);
  }
  if (version) key.searchParams.set("__v", version);
  key.searchParams.set("__device", device);
  // The request's tests and campaigns (`assignmentsKey`), never the visitor: "" without any.
  if (assigned) key.searchParams.set("__a", assigned);
  return new Request(key.toString(), { method: "GET" });
}

function edgeCache(): Cache | null {
  return typeof caches !== "undefined" ? ((caches as unknown as { default?: Cache }).default ?? null) : null;
}

async function pageCache(page: PageRequest): Promise<Response> {
  const { url, ctx } = page;
  const profileName = profileOf(url);
  const profile = PROFILES[profileName];

  const withHeaders = (resp: Response, state: string) => {
    const out = new Response(resp.body, resp);
    out.headers.delete(STORED_AT);
    out.headers.delete("cf-cache-status");
    // A 404 page is content too: it gets the same cache headers (only 200s are stored, below).
    if ((out.ok || out.status === 404) && !out.headers.has("set-cookie")) {
      out.headers.set("Cache-Control", cacheControl(profileName));
      out.headers.set("Vary", "Accept-Encoding");
      out.headers.set("CDN-Cache-Control", "no-store");
    }
    out.headers.set("X-Cache", state);
    out.headers.set("X-Cache-Profile", profileName);
    return out;
  };

  const cache = edgeCache();
  if (!profile.isPublic || !cache) {
    const resp = await page.render();
    if (!profile.isPublic) {
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", cacheControl(profileName));
      out.headers.set("X-Cache", "BYPASS");
      return out;
    }
    return withHeaders(resp, "BYPASS");
  }

  // The revision the page renders (on the previous index while a publish's new blocks load).
  const version = await cacheVersion(cms, __BUILD_HASH__, url);
  const key = cacheKey(url, version, page.device, assignmentsKey(page.assignments));
  const { edge } = profile;

  const revalidate = async () => {
    const fresh = await page.render();
    if (fresh.status === 200 && !fresh.headers.has("set-cookie") && fresh.headers.get(DEGRADED_HEADER) !== "true") {
      const stored = new Response(fresh.clone().body, fresh);
      stored.headers.set("Cache-Control", `public, max-age=${edge.fresh + edge.swr + edge.sie}`);
      stored.headers.set(STORED_AT, String(Date.now()));
      ctx.waitUntil(cache.put(key, stored).catch(() => {}));
    }
    return fresh;
  };

  const hit = await cache.match(key).catch(() => undefined);
  if (hit) {
    const age = (Date.now() - Number(hit.headers.get(STORED_AT) ?? 0)) / 1000;
    if (age <= edge.fresh) return withHeaders(hit, "HIT");
    if (age <= edge.fresh + edge.swr) {
      ctx.waitUntil(revalidate().catch(() => undefined));
      return withHeaders(hit, "STALE-HIT");
    }
    try {
      const fresh = await revalidate();
      if (fresh.status < 500) return withHeaders(fresh, "MISS");
    } catch {
      // fall through to the stale copy
    }
    if (age <= edge.fresh + edge.swr + edge.sie) return withHeaders(hit, "STALE-ERROR");
  }

  return withHeaders(await revalidate(), "MISS");
}

export default createDecoWorker({
  serverEntry: createServerEntry({ fetch: handler.fetch }),
  cms,
  dev: import.meta.env.DEV,
  // v7's report-only list, and v7's extra frame ancestor; the worker adds Studio's origins
  // (production and staging) to `frame-ancestors` and `script-src`.
  csp: { reportOnly: CSP_REPORT_ONLY, frameAncestors: LEGACY_FRAME_ANCESTORS },
  preload: { styles: [appCss] },
  pageCache,
});
