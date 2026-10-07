// Resolves real pages from the committed content through the same openPage the
// catch-all route calls. Run `deco content` first (npm test does, via pretest).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BlockDescriptor } from "../src/model";
import { openPage } from "../src/open-page.server";

const ORIGIN = "http://blog.test";

async function open(href: string) {
  const page = await openPage<BlockDescriptor>(href, new Request(ORIGIN + href));
  const results = await Promise.all(page.blocks.map((block) => block.value));
  const sections = results.map((result) => {
    assert.equal(result.failed, false);
    return result.value as BlockDescriptor;
  });
  return { ...page, sections };
}

function section<C extends BlockDescriptor["component"]>(sections: BlockDescriptor[], component: C) {
  const found = sections.find((s) => s.component === component);
  assert.ok(found, `no ${component} section`);
  return found as Extract<BlockDescriptor, { component: C }>;
}

describe("openPage", () => {
  it("renders the home page with its SEO and the latest posts", async () => {
    const page = await open("/");
    assert.equal(page.status, 200);
    assert.equal(page.seo?.title, "Blog — Engenharia, Performance, Design e Produto");
    assert.equal(page.seo?.type, "website");
    assert.deepEqual(page.sections.map((s) => s.component), ["blog-header", "blog-home"]);
    const home = section(page.sections, "blog-home").props;
    assert.equal(home.currentPage, 1);
    assert.equal(home.origin, ORIGIN);
    assert.equal(home.siteConfig.name, "Blog");
    assert.equal(home.posts?.length, 15);
    assert.equal(home.posts?.[0].slug, "seo-geo-guide-2025"); // newest first
  });

  it("reads pagination and search from the URL", async () => {
    const home = section((await open("/?page=2&q=react")).sections, "blog-home").props;
    assert.equal(home.currentPage, 2);
    assert.equal(home.query, "react");
  });

  it("gives the header its search index", async () => {
    const header = section((await open("/topics")).sections, "blog-header").props;
    assert.equal(header.posts?.length, 15);
  });

  it("renders a post with its own SEO and canonical URL", async () => {
    const page = await open("/tanstack-start-guide");
    assert.equal(page.status, 200);
    assert.equal(page.seo?.title, "Construindo com TanStack Start: guia prático — Blog");
    assert.equal(page.seo?.canonical, `${ORIGIN}/tanstack-start-guide`);
    const post = section(page.sections, "blog-post-section").props;
    assert.equal(post.page?.post.slug, "tanstack-start-guide");
    assert.equal(post.relatedPosts?.length, 4);
  });

  it("filters by the author and topic in the URL", async () => {
    const author = await open("/authors/ana@deco.cx");
    assert.equal(author.seo?.title, "Posts de Ana Luiza Costa — Blog");
    const byAuthor = section(author.sections, "blog-home").props.posts ?? [];
    assert.ok(byAuthor.length > 0);
    assert.ok(byAuthor.every((p) => p.authors?.some((a) => a.email === "ana@deco.cx")));

    const topic = await open("/topics/design");
    assert.equal(topic.seo?.title, "Design — Blog");
    const byTopic = section(topic.sections, "blog-home").props.posts ?? [];
    assert.ok(byTopic.length > 0);
    assert.ok(byTopic.every((p) => p.categories?.some((c) => c.slug === "design")));
  });

  it("answers an unknown post slug with the post page and a 404", async () => {
    const page = await open("/this-post-does-not-exist");
    assert.equal(page.status, 404);
    assert.equal(page.name, "Blog Post");
    assert.equal(section(page.sections, "blog-post-section").props.page, null);
  });

  it("answers an unknown path with the /404 page and a 404", async () => {
    const page = await open("/a/b/c");
    assert.equal(page.status, 404);
    assert.equal(page.name, "Blog Post");
  });

  it("hands over every block already settled, so the first HTML chunk holds them all", async () => {
    // A deliberate exception to the guide (see open-page.server.ts): the blocks
    // only read content in memory, and rendering them in the first chunk keeps
    // the hero image's preload in the head, as on v7.
    const page = await openPage<BlockDescriptor>("/", new Request(ORIGIN + "/"));
    for (const block of page.blocks) {
      const settled = block.value as typeof block.value & { status?: string; value?: unknown };
      assert.equal(settled.status, "fulfilled");
      assert.deepEqual(settled.value, await block.value);
    }
  });
});
