// A post's body blocks render by type: stored under the short name the block
// map gives them (what the site editor saves for a new block) or the v7 name
// older content uses, and as the descriptor a resolved body block returns.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { client } from "../src/cms";
import BlogPostSection from "../src/sections/Blog/BlogPostSection";
import type { BlogPost, PostBodyBlock } from "../src/vendor/blog/types";
import { View } from "../src/views";

function render(sections: unknown[]) {
  const post: BlogPost = {
    title: "Post",
    excerpt: "",
    date: "2025-01-01",
    slug: "post",
    sections: sections as PostBodyBlock[],
  };
  return renderToStaticMarkup(createElement(BlogPostSection, { page: { "@type": "BlogPostPage", post } }));
}

const headings = (type: string) => [
  { __resolveType: type, level: "h2", text: "Primeiros passos" },
  { __resolveType: type, level: "h3", text: "Instalação" },
];

describe("post body blocks", () => {
  it("renders a post-heading block, with its anchor and table-of-contents entry", () => {
    // The table of contents shows from two entries on.
    const html = render(headings("post-heading"));
    assert.match(html, /<h2[^>]*id="primeiros-passos"[^>]*>Primeiros passos<\/h2>/);
    assert.match(html, /data-anchor="primeiros-passos"/);
    assert.match(html, /data-anchor="instalacao"/);
  });

  it("renders the same headings saved under their v7 name", () => {
    assert.equal(render(headings("blog/sections/blocks/Heading.tsx")), render(headings("post-heading")));
  });

  it("renders the descriptor a resolved post-heading block returns", async () => {
    const c = await client(new Request("http://blog.test/"));
    const resolved = await Promise.all(
      headings("post-heading").map(async (block) => {
        const [value, error] = await c.resolve<PostBodyBlock>(block);
        assert.equal(error, null);
        return value;
      }),
    );
    assert.deepEqual(resolved[0], { component: "post-heading", props: { level: "h2", text: "Primeiros passos" } });
    assert.equal(render(resolved), render(headings("post-heading")));
  });

  it("lists steps and checklists by their short names in the table of contents", () => {
    const html = render([
      { __resolveType: "post-steps", title: "Instalação", steps: [] },
      { __resolveType: "post-checklist", title: "Antes de publicar", items: [] },
    ]);
    assert.match(html, /data-anchor="instalacao"/);
    assert.match(html, /data-anchor="antes-de-publicar"/);
  });

  it("skips a body block of an unknown type", () => {
    assert.doesNotMatch(render([{ __resolveType: "post-unknown", text: "nada" }]), /nada/);
  });

  it("renders a body block placed on a page as a section of its own, as v7 did", () => {
    const html = renderToStaticMarkup(
      createElement(View, { block: { component: "post-heading", props: { level: "h2", text: "Olá" } } }),
    );
    assert.match(html, /^<section id="Blog-blocks-Heading" data-manifest-key="site\/sections\/Blog\/blocks\/Heading.tsx">/);
    assert.match(html, /<h2[^>]*>Olá<\/h2>/);
  });
});
