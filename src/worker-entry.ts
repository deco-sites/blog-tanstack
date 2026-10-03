/**
 * The Worker's entry: TanStack Start's handler, wrapped with what the site
 * adds around every response (formerly createDecoWorkerEntry from
 * @decocms/start 6.x): security headers, the CSS preload hint, cache headers
 * per URL, and an edge page cache in the Cloudflare Cache API, split by device.
 */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { PAGE_STATUS_HEADER } from "./page-status";
import { cacheControl, detectCacheProfile, PROFILES } from "./edge/cache-profiles";
import { detectDevice } from "./edge/device";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

interface Env {
  CF_VERSION_METADATA?: { id?: string };
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

const serverEntry = createServerEntry({ fetch: handler.fetch });

const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy-Report-Only": CSP_DIRECTIVES.join("; "),
};

/** Query params that never change a page: left out of the cache key. */
const TRACKING_PARAMS = /^(utm_\w+|gclid|gclsrc|dclid|fbclid|msclkid|mc_cid|mc_eid|_ga|_gl|yclid|igshid|ttclid|twclid|li_fat_id)$/i;

/** Paths the page cache never serves: server functions, built assets and framework routes. */
const BYPASS_PREFIXES = ["/_serverFn", "/_build", "/assets/", "/api/"];

/** When the edge copy was stored, so its age can be compared with the profile. */
const STORED_AT = "x-edge-stored-at";

const isHtml = (resp: Response) => (resp.headers.get("content-type") ?? "").includes("text/html");

/** A page's own status (a CMS page can be a 404), set by the route through PAGE_STATUS_HEADER. */
function withPageStatus(resp: Response): Response {
  const status = Number(resp.headers.get(PAGE_STATUS_HEADER));
  if (!status) return resp;
  const headers = new Headers(resp.headers);
  headers.delete(PAGE_STATUS_HEADER);
  return new Response(resp.body, { status, statusText: "", headers });
}

function decorate(resp: Response): Response {
  const out = new Response(resp.body, resp);
  if (isHtml(out)) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!out.headers.has(k)) out.headers.set(k, v);
    }
    out.headers.append("Link", `<${appCss}>; rel=preload; as=style`);
  }
  return out;
}

function cacheKey(request: Request, env: Env): Request {
  const url = new URL(request.url);
  for (const name of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(name)) url.searchParams.delete(name);
  }
  const version = env.CF_VERSION_METADATA?.id;
  if (version) url.searchParams.set("__v", version);
  url.searchParams.set("__device", detectDevice(request.headers.get("user-agent") ?? ""));
  return new Request(url.toString(), { method: "GET" });
}

async function pageCache(request: Request, env: Env, ctx: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const profileName = detectCacheProfile(url);
  const profile = PROFILES[profileName];
  const cacheable =
    request.method === "GET" &&
    profile.isPublic &&
    !BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) &&
    typeof caches !== "undefined";

  const withHeaders = (resp: Response, state: string) => {
    const out = new Response(resp.body, resp);
    out.headers.delete(STORED_AT);
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

  if (!cacheable) {
    const resp = withPageStatus(await serverEntry.fetch(request));
    if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/assets/")) return resp;
    if (!profile.isPublic) {
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", cacheControl(profileName));
      out.headers.set("X-Cache", "BYPASS");
      return out;
    }
    return withHeaders(resp, "BYPASS");
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const key = cacheKey(request, env);

  const revalidate = async () => {
    const fresh = withPageStatus(await serverEntry.fetch(request.clone()));
    if (fresh.status === 200 && !fresh.headers.has("set-cookie")) {
      const stored = new Response(fresh.clone().body, fresh);
      stored.headers.set("Cache-Control", `public, max-age=${profile.edge.fresh + profile.edge.swr + profile.edge.sie}`);
      stored.headers.set(STORED_AT, String(Date.now()));
      await cache.put(key, stored);
    }
    return fresh;
  };

  const hit = await cache.match(key).catch(() => undefined);
  if (hit) {
    const age = (Date.now() - Number(hit.headers.get(STORED_AT) ?? 0)) / 1000;
    if (age <= profile.edge.fresh) return withHeaders(hit, "HIT");
    if (age <= profile.edge.fresh + profile.edge.swr) {
      ctx.waitUntil(revalidate().catch(() => undefined));
      return withHeaders(hit, "STALE-HIT");
    }
    try {
      const fresh = await revalidate();
      if (fresh.status < 500) return withHeaders(fresh, "MISS");
    } catch {
      // fall through to the stale copy
    }
    if (age <= profile.edge.fresh + profile.edge.swr + profile.edge.sie) return withHeaders(hit, "STALE-ERROR");
  }

  const resp = await revalidate();
  return withHeaders(resp, "MISS");
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    return decorate(await pageCache(request, env, ctx));
  },
};
