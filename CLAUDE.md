# blog-tanstack

TanStack Start on Cloudflare Workers, on `@decocms/blocks` v8 and `@decocms/tanstack` (same
version). Bun is the package manager (`bun.lock`).

## Hard rules

- **Content is never bundled.** `src/cms.ts` is `createCMS({ blocks, site: "blog-tanstack" })`: the
  Studio site's hosted release, read at runtime from `delivery.decocms.com`. Never import
  `.deco/blocks` or a generated content module into app code, and never re-add `deco content`.
- **Never `client.list()`** (removed in 8.12: it throws) and never read every block. A request reads
  the index (`latest.json`), the page `client.routes()` matched and what it references, the config
  blocks named in code (`site`, `deco-blog`; `CMS` is inline in the index) and the blog collections
  through `src/vendor/blog/core/records.ts` (`client.entries(type)` + one `resolve(name)` per
  document, kept per revision). Sitemaps and enumerations read `entries()`, never bodies.
  `test/fetch-budget.test.ts` pins the CDN requests a cold and a warm request make; keep it green.
- **Never rename a saved type.** Content stores v7 names (`site/sections/Blog/*.tsx`,
  `blog/loaders/*.ts`, `website/sections/Seo/SeoV2.tsx`, ...): `.deco/index.ts` registers each under
  those names only (a second key for the same function is listed twice in Studio). The one-time
  content migration rewrote what has no v8 block (`deco-v7-to-v8-migration`): the v7 app block `site`
  is `site-settings`, and `website/functions/requestToParam.ts` became the page's route `param`. So
  the release is published from this repository's `.deco/blocks`, never from v7 content.
- **Studio**: `DecoPreview` in `src/components/RootLayout.tsx` is the only bridge (v8; no v7 editor
  script). Every section renders in `<section data-manifest-key>` (`src/views.tsx`), header included.
  `createDecoWorker` owns drafts, CMS redirects, Studio's CSP (`frame-ancestors`, `script-src`) and
  the security headers: don't hand-roll any of them.
- `DECO_SITE` is deliberately not in `wrangler.jsonc`/`.env`: `deco check` then checks the committed
  `.deco/blocks`. Jobs that talk to Studio set it in their own env (`deco-schema-push.yml`).
- Same-site links and redirect targets are relative paths.

## Commands

```bash
bun run dev          # vite dev (reads the published release)
bun run deco:check   # deco schema --check && deco check: 0 errors
bun run typecheck && bun run test && bun run build
bun run parity:build # a build that reads parity/delivery.mjs (the committed content) instead of the CDN
```

Parity: `parity/README.md`. Record the baseline from the main build, compare the parity build
served with `parity/delivery.mjs` beside it.
