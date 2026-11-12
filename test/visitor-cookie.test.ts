// No visitor cookie on a failed render either (src/edge/worker.ts): once the worker knows the
// release saves no test, a 503 (a page whose content didn't load) drops it too, reading nothing more.
// In a cold process, through the worker (test/worker.ts).
import { deliveryLog, failingBlocks, resetDeliveryLog } from "./fake-delivery";
import { request } from "./worker";
import assert from "node:assert/strict";
import { it } from "node:test";

it("sends a first-time visitor no cookie on a 503 either", async () => {
  failingBlocks.add("collections/blog/posts/react-compiler");
  try {
    const sitemap = await request("/sitemap.xml");
    assert.equal(sitemap.res.status, 200);
    assert.deepEqual(sitemap.res.headers.getSetCookie(), []);
    const { res } = await request("/");
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("x-deco-degraded"), "true");
    assert.deepEqual(res.headers.getSetCookie(), []);
  } finally {
    failingBlocks.clear();
  }
  resetDeliveryLog();
  await request("/authors");
  assert.ok(!deliveryLog.includes("latest.json"), "the cookie decision read the index again");
});
