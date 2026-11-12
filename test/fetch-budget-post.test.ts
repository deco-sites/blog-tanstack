// The CDN fetch budget of a cold post page, through the worker (test/worker.ts), in a cold process:
// the index, the post page, the named config blocks, every post (the post's slug is in its body,
// and the related posts are sorted by date) and the categories (the breadcrumb), each once: 24.
import { request } from "./worker";
import { blockNamesRead, deliveryLog, resetDeliveryLog } from "./fake-delivery";
import assert from "node:assert/strict";
import { it } from "node:test";

it("cold post page: 24 requests, each body once", async () => {
  resetDeliveryLog();
  const { res, body } = await request("/tanstack-start-guide");
  assert.equal(res.status, 200);
  assert.match(body, /<!-- 0 failed -->/);
  const read = blockNamesRead();
  console.log(`[fetch-budget] cold "/tanstack-start-guide": ${deliveryLog.length} delivery requests`);
  assert.equal(new Set(read).size, read.length, "a body was fetched twice");
  assert.deepEqual(read.filter((name) => name.startsWith("pages-")), ["pages-blog-post"]);
  assert.equal(read.filter((name) => name.startsWith("collections/blog/posts/")).length, 15);
  assert.equal(read.filter((name) => name.startsWith("collections/blog/categories/")).length, 5);
  assert.deepEqual(read.filter((name) => name.startsWith("collections/blog/authors/")), []);
  assert.equal(deliveryLog.length, 24);
});
