// A page's SEO falls back to the site's SEO the way v7 assembled it
// (@decocms/tanstack 7.77.3, buildPageSeo): the search page and the unknown
// topic/post pages give no description, so the site's description is theirs.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withSiteSeo } from "../src/seo/types";

const site = {
  title: "Blog — Engenharia, Performance, Design e Produto",
  description: "Artigos sobre engenharia de software.",
  titleTemplate: "%s",
  descriptionTemplate: "%s",
};

describe("withSiteSeo", () => {
  it("fills what the page leaves empty from the site", () => {
    assert.deepEqual(withSiteSeo({ title: "Busca — Blog" }, site), {
      title: "Busca — Blog",
      description: "Artigos sobre engenharia de software.",
    });
  });

  it("keeps what the page sets", () => {
    assert.deepEqual(withSiteSeo({ title: "A", description: "B", noIndexing: true }, site), {
      title: "A",
      description: "B",
      noIndexing: true,
    });
  });

  it("gives a page without SEO the site's title and description", () => {
    assert.deepEqual(withSiteSeo(undefined, site), { title: site.title, description: site.description });
  });

  it("applies the page's templates, else the site's", () => {
    const templated = { ...site, titleTemplate: "%s | Site", descriptionTemplate: "%s." };
    assert.deepEqual(withSiteSeo({ title: "A", description: "B" }, templated), { title: "A | Site", description: "B." });
    assert.deepEqual(withSiteSeo({ title: "A", titleTemplate: "%s - Page" }, templated), {
      title: "A - Page",
      description: "Artigos sobre engenharia de software..",
    });
  });
});
