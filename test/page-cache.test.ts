// The page cache (src/edge/page-cache.ts) against an in-memory Cache API (test/fake-cache.ts): a
// clean 200 is stored; a degraded page (`x-deco-degraded: true`) is never stored nor kept by the
// browser, and once the stored copy is past stale-while-revalidate, it is served instead of a
// degraded render while stale-if-error lasts.
import "./fake-delivery";
import { edgeCache, executionContext } from "./fake-cache";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { PageRequest } from "@decocms/tanstack/worker";
import { DEGRADED_HEADER } from "../src/components/PageBlocks";
import { PROFILES } from "../src/edge/cache-profiles";
import { createPageCache } from "../src/edge/page-cache";

const pageCache = createPageCache("test");
const html = (body: string, headers: Record<string, string> = {}) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });

async function serve(href: string, render: () => Response) {
  const ctx = executionContext();
  const res = await pageCache({
    request: new Request(href),
    url: new URL(href),
    visitor: {} as PageRequest["visitor"],
    assignments: { version: null, experiments: {}, campaigns: {} },
    device: "desktop",
    env: {},
    ctx,
    render: async () => render(),
  });
  const body = await res.text();
  await ctx.settled();
  return { res, body };
}

const degraded = () => html("degraded", { [DEGRADED_HEADER]: "true" });
const { edge } = PROFILES.listing;

describe("page cache", () => {
  beforeEach(() => edgeCache.clear());

  it("stores a clean page and serves it fresh", async () => {
    const first = await serve("http://blog.test/topics", () => html("whole"));
    assert.equal(first.res.headers.get("x-cache"), "MISS");
    assert.equal(edgeCache.size, 1);
    const second = await serve("http://blog.test/topics", () => html("other"));
    assert.equal(second.res.headers.get("x-cache"), "HIT");
    assert.equal(second.body, "whole");
  });

  it("never stores a degraded page, and tells the browser not to keep it", async () => {
    const { res, body } = await serve("http://blog.test/topics", degraded);
    assert.equal(body, "degraded");
    assert.equal(edgeCache.size, 0);
    assert.equal(res.headers.get("cache-control"), "private, no-cache, no-store, must-revalidate");
    assert.equal(res.headers.get("x-cache"), "MISS");
  });

  it("serves the stale copy instead of a degraded render while stale-if-error lasts", async () => {
    await serve("http://blog.test/topics", () => html("whole"));
    edgeCache.age(edge.fresh + edge.swr + 60);
    const stale = await serve("http://blog.test/topics", degraded);
    assert.equal(stale.res.headers.get("x-cache"), "STALE-ERROR");
    assert.equal(stale.body, "whole");

    // Past stale-if-error, the degraded render is all there is.
    edgeCache.age(edge.sie);
    const late = await serve("http://blog.test/topics", degraded);
    assert.equal(late.res.headers.get("x-cache"), "MISS");
    assert.equal(late.body, "degraded");
  });

  it("revalidates a stale copy in the background, and keeps it when the new render is degraded", async () => {
    await serve("http://blog.test/topics", () => html("whole"));
    edgeCache.age(edge.fresh + 60);
    const stale = await serve("http://blog.test/topics", degraded);
    assert.equal(stale.res.headers.get("x-cache"), "STALE-HIT");
    assert.equal(stale.body, "whole");
    edgeCache.age(-(edge.fresh + 60)); // back to fresh: the stored copy is still the clean one
    assert.equal((await serve("http://blog.test/topics", degraded)).body, "whole");
  });
});
