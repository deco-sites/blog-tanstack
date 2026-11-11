// The sitemap's CDN budget, through the worker (test/worker.ts), in a cold process (node:test runs
// each file in its own): the route lists the pages from the content index (`entries("page")`) and
// reads no block body. The worker's redirect lookup matches "/sitemap.xml" to the post page
// ("/:slug") and prefetches it, as it does for every one-segment path: 2 requests.
import { request } from "./worker";
import { blockNamesRead, deliveryLog, resetDeliveryLog } from "./fake-delivery";
import assert from "node:assert/strict";
import { it } from "node:test";

it("the sitemap reads the content index and no body of its own", async () => {
  resetDeliveryLog();
  const { res, body } = await request("/sitemap.xml");
  assert.equal(res.status, 200);
  assert.match(body, /<loc>http:\/\/blog\.test\/topics<\/loc>/);
  assert.doesNotMatch(body, /:slug|:email/);
  assert.equal(deliveryLog[0], "latest.json");
  assert.deepEqual(blockNamesRead(), ["pages-blog-post"]); // the worker's prefetch, not the route's
  assert.equal(deliveryLog.length, 2);
});
