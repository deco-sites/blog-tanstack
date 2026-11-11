import { request } from "./worker";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cacheControl, detectCacheProfile } from "../src/edge/cache-profiles";
import { decoParseSearch, decoStringifySearch } from "@decocms/tanstack/router";
import { liveAssignmentKeys } from "@decocms/tanstack/worker";
import { cms } from "../src/cms";
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

describe("the worker (src/edge/worker.ts)", () => {
  it("lets Studio (production and staging) and v7's *.deco.studio frame the site, and keeps v7's report-only list", async () => {
    const { res } = await request("/");
    const ancestors = res.headers.get("content-security-policy") ?? "";
    for (const origin of ["'self'", "https://studio.decocms.com", "https://studio-stg.decocms.com", "https://*.deco.studio"]) {
      assert.ok(ancestors.startsWith("frame-ancestors ") && ancestors.includes(` ${origin}`), `${origin} in ${ancestors}`);
    }
    const reportOnly = res.headers.get("content-security-policy-report-only") ?? "";
    assert.ok(reportOnly.includes("img-src 'self' data: https: blob:"));
    assert.ok(res.headers.has("x-cache"), "a live page goes through the page cache");
  });

  it("never puts a draft in the page cache, and sends it uncached and noindex", async () => {
    // Port 9 (discard) on loopback: a draft host the CMS admits, with nothing listening.
    for (const [href, headers] of [
      ["/?__draft=" + encodeURIComponent("127.0.0.1:9/drafts/gone@v1"), undefined],
      ["/", { cookie: "__deco_draft=junk" }],
    ] as const) {
      const { res } = await request(href, { headers });
      assert.equal(res.headers.get("x-cache"), null, href);
      assert.match(res.headers.get("cache-control") ?? "", /no-cache/);
      assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
    }
  });

  it("answers HEAD with GET's headers and no body", async () => {
    for (const href of ["/topics", "/"]) {
      const get = await request(href);
      const head = await request(href, { method: "HEAD" });
      assert.equal(head.res.status, get.res.status);
      assert.equal(head.body, "");
      for (const name of ["cache-control", "vary", "content-type", "content-security-policy"]) {
        assert.equal(head.res.headers.get(name), get.res.headers.get(name), `${href} ${name}`);
      }
      assert.match(head.res.headers.get("cache-control") ?? "", /^public, /);
    }
  });

  it("sends a first-time visitor no cookie while the release saves no test (as v7)", async () => {
    assert.deepEqual(await liveAssignmentKeys(cms), [""]);
    const { res } = await request("/authors");
    assert.equal(res.status, 200);
    assert.deepEqual(res.headers.getSetCookie(), []);
  });
});
