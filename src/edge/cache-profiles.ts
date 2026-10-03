/**
 * Page cache profiles: how long a response may be served from the edge
 * (Cloudflare Cache API) and from the browser, picked per URL. Carried over
 * from @decocms/start 6.x with this site's overrides (formerly cache-config.ts).
 */
export type CacheProfileName = "static" | "product" | "listing" | "search" | "private" | "none";

/** Seconds: fresh = served as is; swr = served stale while revalidating; sie = served stale on origin errors. */
interface Window {
  fresh: number;
  swr: number;
  sie: number;
}

interface CacheProfile {
  edge: Window;
  browser: Window;
  isPublic: boolean;
}

const NEVER: Window = { fresh: 0, swr: 0, sie: 0 };

export const PROFILES: Record<CacheProfileName, CacheProfile> = {
  // Home page and sitemap.
  static: {
    edge: { fresh: 900, swr: 7_200, sie: 21_600 },
    browser: { fresh: 120, swr: 1_800, sie: 7_200 },
    isPublic: true,
  },
  // Blog post pages (editorial content): very stable.
  product: {
    edge: { fresh: 1_800, swr: 86_400, sie: 172_800 },
    browser: { fresh: 300, swr: 3_600, sie: 14_400 },
    isPublic: true,
  },
  // Listing pages (posts, topics, authors) and everything not matched below.
  listing: {
    edge: { fresh: 600, swr: 7_200, sie: 86_400 },
    browser: { fresh: 60, swr: 600, sie: 3_600 },
    isPublic: true,
  },
  // Search results (?q=): conservative, the query space is large.
  search: {
    edge: { fresh: 300, swr: 1_800, sie: 7_200 },
    browser: { fresh: 30, swr: 180, sie: 900 },
    isPublic: true,
  },
  private: { edge: NEVER, browser: NEVER, isPublic: false },
  none: { edge: NEVER, browser: NEVER, isPublic: false },
};

const PRIVATE_PREFIX_RE = /^\/(cart|checkout|account|login|my-account)(\/|$)/;

/** The profile for a URL. The first rule that matches wins. */
export function detectCacheProfile(url: URL): CacheProfileName {
  const { pathname: p, searchParams: sp } = url;
  if (p === "/sitemap.xml") return "static";
  if (PRIVATE_PREFIX_RE.test(p)) return "private";
  if (p.startsWith("/api/") || p.startsWith("/_build")) return "none";
  if (p === "/s" || p.startsWith("/s/") || sp.has("q")) return "search";
  if (p.endsWith("/p")) return "product";
  if (p === "/" || p === "") return "static";
  return "listing";
}

/** The Cache-Control (browser) header for a profile. */
export function cacheControl(profile: CacheProfileName): string {
  const { browser, edge, isPublic } = PROFILES[profile];
  if (!isPublic || (edge.fresh === 0 && browser.fresh === 0)) {
    return "private, no-cache, no-store, must-revalidate";
  }
  const parts = ["public", browser.fresh > 0 ? `max-age=${browser.fresh}` : "max-age=0"];
  if (edge.fresh > 0) parts.push(`s-maxage=${edge.fresh}`);
  if (browser.swr > 0) parts.push(`stale-while-revalidate=${browser.swr}`);
  if (browser.sie > 0) parts.push(`stale-if-error=${browser.sie}`);
  return parts.join(", ");
}
