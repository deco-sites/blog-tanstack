import { registerCachePattern, setCacheProfile } from "@decocms/start/sdk/cacheHeaders";

// Sitemap doesn't change on every post — cache aggressively
registerCachePattern({
  test: (p) => p === "/sitemap.xml",
  profile: "static",
});

// Blog post pages (editorial content) — very stable, cache aggressively
// fresh = 30 min: serves cached HTML without revalidation
// swr = 24 h: serve stale while background revalidation happens (fast)
// sie = 48 h: serve stale on origin error
setCacheProfile("product", {
  edge: { fresh: 1800, swr: 86_400, sie: 172_800 },
  browser: { fresh: 300, swr: 3_600, sie: 14_400 },
});

// Blog post listing pages (home, category, author)
// fresh = 10 min, swr = 2 h (slightly more dynamic than single posts)
setCacheProfile("listing", {
  edge: { fresh: 600, swr: 7_200, sie: 86_400 },
  browser: { fresh: 60, swr: 600, sie: 3_600 },
});

// Search results (/search?q=…) — keep conservative due to query cardinality
setCacheProfile("search", {
  edge: { fresh: 300, swr: 1_800, sie: 7_200 },
  browser: { fresh: 30, swr: 180, sie: 900 },
});
