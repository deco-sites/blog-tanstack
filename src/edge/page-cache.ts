/**
 * The page cache `createDecoWorker` calls (src/edge/worker.ts): the Cloudflare Cache API, with the
 * profiles this blog has always served (./cache-profiles.ts), keyed by path and query (tracking
 * params dropped), `<build>.<content revision>` (`cacheVersion`: a publish changes every key without
 * a deploy), the device and the tests and campaigns the worker decided (never the visitor's id).
 * The worker calls it only for GETs of the current release, never for a preview, never in `vite dev`.
 *
 * A page rendered without some content it needs (a CDN read that failed) says so with
 * `DEGRADED_HEADER` (src/components/PageBlocks.tsx): it is never stored, never kept by the browser,
 * and a stale copy is served in its place while `stale-if-error` lasts.
 */
import {
  assignmentsKey,
  cacheVersion,
  DEGRADED_HEADER,
  isServerFnPath,
  type PageCache,
  serverFnPagePath,
} from "@decocms/tanstack/worker";
import { cms } from "../cms";
import { cacheControl, detectCacheProfile, PROFILES } from "./cache-profiles";

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

/** A page rendered without some of its content. */
const isDegraded = (resp: Response) => resp.headers.get(DEGRADED_HEADER) === "true";

/** The page cache for the build `buildHash` (`__BUILD_HASH__`). */
export function createPageCache(buildHash: string): PageCache {
  return async function pageCache(page) {
    const { url, ctx } = page;
    const profileName = profileOf(url);
    const profile = PROFILES[profileName];

    const withHeaders = (resp: Response, state: string) => {
      const out = new Response(resp.body, resp);
      out.headers.delete(STORED_AT);
      out.headers.delete("cf-cache-status");
      if (isDegraded(out)) {
        // Nobody keeps it: the next request renders again.
        out.headers.set("Cache-Control", cacheControl("private"));
      } else if ((out.ok || out.status === 404) && !out.headers.has("set-cookie")) {
        // A 404 page is content too: it gets the same cache headers (only 200s are stored, below).
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
    const version = await cacheVersion(cms, buildHash, url);
    const key = cacheKey(url, version, page.device, assignmentsKey(page.assignments));
    const { edge } = profile;

    const revalidate = async () => {
      const fresh = await page.render();
      if (fresh.status === 200 && !fresh.headers.has("set-cookie") && !isDegraded(fresh)) {
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
      // Too old to serve first: a new render, unless it failed (an error, or content that didn't
      // load), when the stale copy stands in while stale-if-error lasts.
      const fresh = await revalidate().catch(() => undefined);
      if (fresh && fresh.status < 500 && !isDegraded(fresh)) return withHeaders(fresh, "MISS");
      if (age <= edge.fresh + edge.swr + edge.sie) {
        await fresh?.body?.cancel();
        return withHeaders(hit, "STALE-ERROR");
      }
      if (fresh) return withHeaders(fresh, "MISS");
    }

    return withHeaders(await revalidate(), "MISS");
  };
}
