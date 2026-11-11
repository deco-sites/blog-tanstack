import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cacheControl, detectCacheProfile } from "../src/edge/cache-profiles";
import { decoParseSearch, decoStringifySearch } from "@decocms/tanstack/router";
import { CSP_REPORT_ONLY, LEGACY_FRAME_ANCESTORS } from "../src/edge/headers";
import { pageHead } from "../src/seo/head";

describe("cache profiles", () => {
  const profile = (href: string) => detectCacheProfile(new URL(href, "http://blog.test"));

  it("picks a profile per URL", () => {
    assert.equal(profile("/"), "static");
    assert.equal(profile("/?page=2"), "static");
    assert.equal(profile("/sitemap.xml"), "static");
    assert.equal(profile("/search?q=react"), "search");
    assert.equal(profile("/search"), "listing");
    assert.equal(profile("/tanstack-start-guide"), "listing");
    assert.equal(profile("/account"), "private");
  });

  it("derives Cache-Control from the profile", () => {
    assert.equal(cacheControl("static"), "public, max-age=120, s-maxage=900, stale-while-revalidate=1800, stale-if-error=7200");
    assert.equal(cacheControl("listing"), "public, max-age=60, s-maxage=600, stale-while-revalidate=600, stale-if-error=3600");
    assert.equal(cacheControl("search"), "public, max-age=30, s-maxage=300, stale-while-revalidate=180, stale-if-error=900");
    assert.equal(cacheControl("private"), "private, no-cache, no-store, must-revalidate");
  });
});

describe("pageHead", () => {
  it("falls back to the page name with the site name", () => {
    const head = pageHead({ name: "Blog Post", seo: {} }, "Blog", "Blog");
    assert.deepEqual(head.meta[0], { title: "Blog Post | Blog" });
    assert.ok(head.meta.some((m) => m.name === "twitter:card" && m.content === "summary"));
  });

  it("emits Open Graph, Twitter and canonical tags from the SEO", () => {
    const head = pageHead(
      { name: "x", seo: { title: "T", description: "D", image: "https://i/x.jpg", canonical: "https://b/x" } },
      "Blog",
      "Blog",
    );
    assert.ok(head.meta.some((m) => m.property === "og:image" && m.content === "https://i/x.jpg"));
    assert.ok(head.meta.some((m) => m.name === "twitter:card" && m.content === "summary_large_image"));
    assert.deepEqual(head.links, [{ rel: "canonical", href: "https://b/x" }]);
  });
});

describe("search params", () => {
  it("give back the query string they read, empty values included (no 307 for ?utm_source=)", () => {
    for (const search of ["?utm_source=", "?q=react&page=", "?a=&b=", "?tag=a&tag=b", "?q=caf%C3%A9"]) {
      assert.equal(decoStringifySearch(decoParseSearch(search)), search);
    }
    assert.equal(decoStringifySearch({ q: undefined, page: null, s: "" }), "?s=");
  });
});

describe("content security policy", () => {
  it("keeps v7's report-only list and its extra frame ancestor (the worker adds Studio's origins)", () => {
    assert.deepEqual(LEGACY_FRAME_ANCESTORS, ["https://*.deco.studio"]);
    assert.ok(CSP_REPORT_ONLY.some((d) => d.startsWith("script-src 'self'")));
  });
});
