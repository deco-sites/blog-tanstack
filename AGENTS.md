# Agent notes

## Post content blocks

deco Studio's blog editor chooses how to edit each block in `post.sections` by
its file name:

- **Inline editor**: the names of the blocks in `@decocms/apps-blog`
  (`node_modules/@decocms/apps-blog/src/sections/blocks/`), plus `ProductCard`
  and `ProductShelf`. The editor reads and writes the props of the app block
  with that name, whatever the site's section declares.
- **Form**: every other name. Studio builds the form from the section's `Props`.

When a section's props drift from the app block it is named after, Studio shows
its fields empty, and saving writes data the section cannot render. A post on a
site built from this template went blank that way.

When you write or change a section in `src/sections/Blog/Post/`:

- Under an app block's name, accept that block's props: the same prop names and
  its encodings. Studio saves Steps `steps`, Checklist `items` and Table
  `headers`/`rows` as JSON text, and List `items` as one item per line;
  `jsonList` in `src/sdk/blog/jsonList.ts` reads JSON text and arrays alike.
  Extra optional props are fine: Studio keeps them on save but cannot edit them.
- For a new look, create a section with a name of its own, as `Summary.tsx` and
  `Definition.tsx` do, and mark HTML props `@format rich-text` so Studio's form
  edits them as formatted text.
- Register the section in `CUSTOM_BLOCKS` in `src/sdk/blog/blocks.tsx`, then run
  `bun run generate`.

When you write post content (`.deco/blocks/collections%2Fblog%2Fposts%2F*.json`),
give each block the props its section's `Props` declares. Callout takes `info`,
`tip` or `warning`; the "Resumo" and "Definição" boxes are the Summary and
Definition blocks.

## Section schema

deco Studio's editor reads every section's form from `.deco/meta.gen.json`, so
the file is committed. After changing a section, loader or app, run
`bun run generate` and commit the regenerated file; CI fails when it is stale.
