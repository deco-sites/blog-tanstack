// A page rendered without some content it needs (a CDN read that failed) still renders, but says
// so (`degraded`, sent as `x-deco-degraded: true`), so the page cache never stores it
// (src/edge/page-cache.ts, test/page-cache.test.ts). In a cold process: node:test runs each file
// in its own.
import { failingBlocks } from "./fake-delivery";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEGRADED_HEADER as SDK_DEGRADED_HEADER } from "@decocms/tanstack/worker";
import { DEGRADED_HEADER, pageHeaders } from "../src/components/PageBlocks";
import type { BlockDescriptor } from "../src/model";
import { openPage } from "../src/open-page.server";

const ORIGIN = "http://blog.test";
const open = (href: string) => openPage<BlockDescriptor>(href, new Request(ORIGIN + href));
const failedSections = async (page: Awaited<ReturnType<typeof open>>) =>
  (await Promise.all(page.blocks.map((block) => block.value))).filter((block) => block.failed).length;

describe("a page whose content fails to load", () => {
  it("uses the SDK's header name", () => {
    assert.equal(DEGRADED_HEADER, SDK_DEGRADED_HEADER);
  });

  // In order: the first reads the posts cold, the second the categories.
  it("renders degraded while a post's body can't be read, and whole again once it can", async () => {
    failingBlocks.add("collections/blog/posts/react-compiler");
    try {
      // Every section of the home page reads the posts: nothing rendered, so a 503.
      const home = await open("/");
      assert.equal(home.status, 503);
      assert.equal(home.degraded, true);
      assert.equal(await failedSections(home), home.blocks.length);
      assert.deepEqual(pageHeaders({ loaderData: home }), { "x-page-status": "503", [DEGRADED_HEADER]: "true" });

      // The post page doesn't throw (a 500): it can't tell whether the slug names a post, so it
      // renders, degraded, but without its own SEO (title, canonical) it is a 503 too.
      const post = await open("/tanstack-start-guide");
      assert.equal(post.status, 503);
      assert.equal(post.degraded, true);
      // A topic page's listing catches the failure, but its header (the search index) reads the
      // posts too: nothing rendered, a 503.
      const topic = await open("/topics/engineering");
      assert.equal(topic.degraded, true);
      assert.equal(topic.status, 503);
    } finally {
      failingBlocks.clear();
    }

    // A failed read isn't kept: the next request reads the collection again.
    const home = await open("/");
    assert.equal(home.degraded, false);
    assert.equal(await failedSections(home), 0);
    assert.deepEqual(pageHeaders({ loaderData: home }), {});
  });

  it("is degraded when a read the page catches fails (the categories of a post's breadcrumb)", async () => {
    failingBlocks.add("collections/blog/categories/engineering");
    try {
      // The post page catches it and renders without the category chain: a 200, not a page to cache.
      const post = await open("/tanstack-start-guide");
      assert.equal(post.status, 200);
      assert.equal(post.degraded, true);
      assert.equal(await failedSections(post), 0);
    } finally {
      failingBlocks.clear();
    }

    assert.equal((await open("/tanstack-start-guide")).degraded, false);
    assert.equal((await open("/this-post-does-not-exist")).status, 404);
  });
});
