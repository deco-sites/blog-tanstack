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
  `test/fetch-budget*.test.ts` and `test/sitemap.test.ts` pin the CDN requests through the whole
  worker (cold `/` 19, cold post 24, `/sitemap.xml` 2, warm 0); keep them green. The collections
  cost one body per document on a cold isolate (15 posts today): past ~100 documents, read a
  derived summary block instead.
- **Never rename a saved type.** Content stores v7 names (`site/sections/Blog/*.tsx`,
  `blog/loaders/*.ts`, `website/sections/Seo/SeoV2.tsx`, ...): `.deco/index.ts` registers each under
  the one name content uses, and one function under one key only (a second key is listed twice in
  Studio; `test/settings.test.ts` fails on it). The v7 app blocks `site` (`site/apps/site.ts`) and
  `deco-blog` (`site/apps/deco/blog.ts`) keep their types as plain settings blocks: a deviation from
  `deco-v7-to-v8-migration`, which deletes app blocks, because they hold the SEO settings editors
  change. The one-time content migration rewrote only what has no v8 block: `site` lost v7's app
  runtime fields (`routes`, `global`, `caching`, `firstByteThresholdMS`), and
  `website/functions/requestToParam.ts` became the page's route `param` (as the skill says). So the
  release is published from this repository's `.deco/blocks`, never from v7 content (`deco push`
  doesn't run `deco check`: v7 content fails it).
- **Studio**: `DecoPreview` in `src/components/RootLayout.tsx` is the only bridge (v8; no v7 editor
  script). Every section renders in `<section data-manifest-key>` (`src/views.tsx`), header included.
  `createDecoWorker` owns drafts, CMS redirects, Studio's CSP (`frame-ancestors`, `script-src`) and
  the security headers: don't hand-roll any of them. `src/edge/worker.ts` adds only the page cache
  (a page with `x-deco-degraded` is never stored), HEAD as GET, and drops the `deco_segment` visitor
  cookie while the release saves no test.
- `DECO_SITE` is deliberately not in `wrangler.jsonc`/`.env`: `deco check` then checks the committed
  `.deco/blocks`. Jobs that talk to Studio set it in their own env (`deco-schema-push.yml`).
- **Publish before the first merge.** Until the site has a release (`latest.json` 404s), the worker
  answers 500 on every page, and every main commit deploys. README.md (Deployment) has the order;
  `scripts/require-release.mjs` (prebuild) fails Workers Builds (`WORKERS_CI`) and CI's build
  (`REQUIRE_RELEASE=1`) without a release. Keep it in `prebuild`.
- Same-site links and redirect targets are relative paths.

## Commands

```bash
bun run dev          # vite dev (reads the published release)
bun run deco:check   # deco schema --check && deco check: 0 errors
bun run typecheck && bun run knip && bun run test && bun run build
# lint gate: knip (unused files and dependencies, as osklen) and tsc. `format:check` (prettier) is
# not a gate: it fails on main too, and the code is not formatted with it.
bun run parity:build # a build that reads parity/delivery.mjs (the committed content) instead of the CDN
```

Parity: `parity/README.md`. Record the baseline from the main build, compare the parity build
served with `parity/delivery.mjs` beside it.
