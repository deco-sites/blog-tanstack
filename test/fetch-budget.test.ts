// The CDN fetch budget, end to end through the worker (test/worker.ts: createDecoWorker, the page
// cache, then the page) and the fake delivery CDN (test/fake-delivery.ts), in a cold process
// (node:test runs each file in its own):
//
// - a cold page reads `latest.json` once, the page it routes to, the config blocks named in code
//   (`site`, `deco-blog`) and the blog's collections it shows (posts, and on the post page the
//   categories), each body once, and never another page's body. What the worker reads itself (the
//   redirect lookup, the tests and campaigns, the page cache's revision) adds nothing to that;
// - a warm request of the same revision reads nothing at all, whatever page it is;
// - nothing ever calls `client.list()` (removed in @decocms/blocks 8.12: it throws).
//
// test/fetch-budget-post.test.ts pins a cold post page, test/sitemap.test.ts the sitemap.
import { request } from "./worker";
import { blockNamesRead, deliveryLog, resetDeliveryLog } from "./fake-delivery";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

async function open(href: string) {
  const { res, body } = await request(href);
  // A section that threw (client.list() throws) must not pass for one that read less.
  assert.match(body, /<!-- 0 failed -->/, href);
  return res;
}

const POSTS = (names: string[]) => names.filter((name) => name.startsWith("collections/blog/posts/"));
const PAGES = (names: string[]) => names.filter((name) => name.startsWith("pages-"));

describe("CDN fetch budget", () => {
  it("cold home: 19 requests, the index, the home page, the named config blocks and the posts, once each", async () => {
    resetDeliveryLog();
    const res = await open("/");
    assert.equal(res.headers.get("x-cache"), "MISS");
    const read = blockNamesRead();
    console.log(`[fetch-budget] cold "/": ${deliveryLog.length} delivery requests (${read.length} bodies + latest.json)`);
    assert.deepEqual(deliveryLog.filter((path) => path === "latest.json"), ["latest.json"]);
    assert.equal(new Set(read).size, read.length, "a body was fetched twice");
    assert.deepEqual(PAGES(read), ["pages-blog-home"]);
    assert.ok(read.includes("site") && read.includes("deco-blog"));
    assert.equal(POSTS(read).length, 15); // every post, once: the header's search index and post count need them all
    // Nothing the home page doesn't show: no author or category documents.
    assert.deepEqual(
      read.filter((name) => name.startsWith("collections/blog/authors/") || name.startsWith("collections/blog/categories/")),
      [],
    );
    assert.equal(deliveryLog.length, 19);
  });

  it("warm: the same page reads nothing; another page reads only its own body", async () => {
    resetDeliveryLog();
    assert.equal((await open("/")).headers.get("x-cache"), "HIT");
    await open("/?page=2");
    assert.deepEqual(deliveryLog, []);
    await open("/search?q=react");
    assert.deepEqual(blockNamesRead(), ["pages-blog-search"]);
    assert.equal(deliveryLog.length, 1);
  });

  it("a post page after the home: 6 requests, its own page body and the categories, then nothing", async () => {
    resetDeliveryLog();
    await open("/tanstack-start-guide");
    const read = blockNamesRead();
    console.log(`[fetch-budget] then "/tanstack-start-guide": ${deliveryLog.length} delivery requests`);
    assert.ok(!deliveryLog.includes("latest.json"), "the index was read again");
    assert.deepEqual(PAGES(read), ["pages-blog-post"]);
    assert.deepEqual(POSTS(read), []);
    assert.equal(deliveryLog.length, 6);
    resetDeliveryLog();
    await open("/tanstack-start-guide");
    assert.equal((await request("/this-post-does-not-exist")).res.status, 404);
    assert.deepEqual(deliveryLog, []);
  });
});
