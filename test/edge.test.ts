import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cacheControl, detectCacheProfile } from "../src/edge/cache-profiles";
import { detectDevice } from "../src/edge/device";
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

describe("detectDevice", () => {
  it("tells phones, tablets and desktops apart", () => {
    assert.equal(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "mobile");
    assert.equal(detectDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
    assert.equal(detectDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), "desktop");
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
