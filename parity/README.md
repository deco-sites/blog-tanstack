# Parity harness

A deterministic visual and snapshot baseline of this site as it is today, so a migrated build can be diffed against it at threshold 0.

`parity/baseline/` is not committed (it is ~50MB of HAR fixtures and PNGs) and is gitignored, as are `parity/results/` and `parity/runs/`. Keep the recorded baseline on disk, or re-record it with `bun run parity:record` from this branch (the pre-migration build).

## Run it

```sh
bun install
bun run parity:build            # production build (restores the regenerated meta.gen.json)
bun run parity:record           # records parity/baseline/ (HAR fixtures, PNGs, snapshots); starts the server itself
bun run parity:compare          # compares a fresh build of this repo against parity/baseline/
# migrated site: point at its URL and tell the harness how to (re)start it
bun run parity:compare -- --target http://localhost:4319 --serve-cmd "<command that serves the v8 build on 4319>" --out /tmp/parity-run
```

Flags (both modes): `--target URL` (default `baseUrl` in `pages.json`, or `PARITY_TARGET`), `--serve-cmd CMD` / `--no-serve`, `--only <id substring>`, `--viewport mobile|desktop`. `PARITY_CHROMIUM_PATH` overrides the Chromium binary, which must be the same build Playwright pins. Compare also takes `--out DIR` (default `parity/results/<timestamp>/`, gitignored).

`parity:compare` exits 1 on any pixel difference, size change, snapshot difference or capture error. It writes `summary.md`, `summary.json`, the actual PNGs/snapshots and, for each failing PNG, a diff image under `diff/`.

Run `parity:record` only as a full run. With `--only` or `--viewport` it keeps the other baseline files but rewrites the HAR for the viewports it touches, so the HAR then covers only that subset.

`parity:serve` (`parity/serve.sh`) is only for browsing the build by hand. It builds and then runs `vite preview` on port 4319. Port 4173 is often taken by a sibling site. The script restarts preview when it exits, and `PARITY_SKIP_BUILD=1` serves the existing `dist/`. `record` and `compare` do not use this script: they manage their own server, as described below. After building, the script restores `src/server/admin/meta.gen.json`, because the build regenerates that file with a different key order.

On robustness: navigation retries while the server is down. Each page or flow has a 180 s watchdog and is retried once from a fresh page if it hangs. This is needed because headless Chromium occasionally stops delivering animation frames.

## What is captured (`pages.json`)

- `pages`: route x viewport. Each one gives a full-page PNG (`baseline/screens/<id>.<viewport>.png`) and a JSON snapshot (`baseline/snapshots/<id>.<viewport>.json`). The snapshot holds the HTTP status, selected headers, the final URL, and the SEO `<head>` (title, meta, links, `html[lang]`, JSON-LD), taken once from the SSR HTML and once from the hydrated DOM. It also holds the inventory of every `<a href>` on the page.
- `flows`: scripted interactions (search palette, Ctrl+K, mobile drawer, pagination, scroll state on a post, SPA navigation). They produce viewport or full-page PNGs plus URL/scroll and head snapshots under `baseline/flows/<flow>/`.
- `text`: raw responses (sitemap, robots, llms.txt, favicon, an RSS probe) stored as text with status and headers under `baseline/text/`.
- `externalFailures` in each page snapshot, and `flows/<flow>/external-failures.<viewport>.json` for each flow: external requests that failed. Today this lists two Unsplash images that return 404 upstream. In compare, a HAR miss shows up here as a new entry.

Viewports: mobile 390x844 (touch, iPhone UA) and desktop 1440x900, both at DPR 1.

## How it stays deterministic

- Clock: `page.clock.setFixedTime(pages.json.clock)`. Timers still run, but `Date` is frozen.
- `Math.random` is replaced through an init script with a seeded mulberry32 (`randomSeed`).
- Motion: an injected stylesheet sets animation and transition durations and delays to 0 (finite animations jump to their end state) and turns off smooth scroll. Screenshots also use `animations: "disabled"` and `caret: "hide"`.
- Locale and timezone are fixed: `pt-BR` and `America/Sao_Paulo`.
- Chromium runs with `--font-render-hinting=none --disable-lcd-text --force-color-profile=srgb --hide-scrollbars`. Playwright is pinned (see `meta.json` for the Chromium build).
- Before each capture the harness waits for network idle, every stylesheet (including the Google Fonts `media=print` swap), `document.fonts.ready`, and every `<img>` loaded and `decode()`d.
- It then scrolls through the whole page and back to the top, so IntersectionObserver reveals and lazy images fire the way they do for a reader, and waits for assets again.
- Network: every request to an origin other than the target is served from `baseline/har/<viewport>/<viewport>.har` (plain JSON, bodies attached as sibling files), recorded once during `record` (images, Google Fonts). A request missing from the HAR is aborted, never fetched live. Analytics collector beacons (`block` in `pages.json`) are always aborted. The analytics SDK script (`analyticsStub.script`) is fulfilled with a recorder exposing the same `window.stonks.{view,event}` API, so every pageview (load and SPA navigation) and forwarded `DECO.events` event is written to the page snapshot's `analytics` array and to `flows/<id>/analytics.<viewport>.json`. Requests to the site under test always go live.
- CMS content comes from the committed `.deco/blocks`, so there is no server-side upstream to fixture.
- `record` makes two passes. Pass 1 loads every page and flow against live upstreams only to write the HAR, and its captures are thrown away. Pass 2 replays the HAR and writes `baseline/` through exactly the same code path `compare` uses, so record-only timing cannot leak into the baseline.
- Failed upstream requests are not kept in the HAR. These are entries Playwright stores with status -1, such as the Unsplash images that 404 and that Chromium's ORB blocks. Replaying them would leave the request pending forever. Instead they are aborted (`net::ERR_FAILED`) in both modes, and the page shows the broken image with its alt text.
- The animation/transition freeze is injected as a constructable stylesheet (`document.adoptedStyleSheets`), never as a `<style>` element. An extra node in `<html>`/`<head>` would make React's hydration of the document mismatch.
- Fresh server per entry: the harness starts `server.command` from `pages.json` itself and restarts it before every page, flow and text entry. Against one long-lived server, the post page's reading-progress bar appeared in some runs and not in others. The likely cause, not fully proven, is server state that depends on request order. `BlogHeader` is a `layout` section, and `@decocms/start` 6.12.1 caches resolved layout sections in memory for 5 minutes, keyed by section type (`resolve.ts`, `RESOLVE_CACHE_TTL`). With a fresh server per entry, runs are identical. Run `bun run parity:build` first. Use `--serve-cmd "<cmd>"` to start a different build (for example the v8 one), or `--no-serve` to use a server that is already running. That last option is not deterministic for this site.

## Normalization (applied before writing any snapshot)

- The target origin becomes `{ORIGIN}`, its URL-encoded form becomes `{ORIGIN_ENC}`, and `//host:port` becomes `//{HOST}`. This lets the baseline and a migrated build run on different ports.
- Dates equal to the server's today (±1 day) become `{SERVER_TODAY}`. Today only the sitemap's `<lastmod>`, which is `new Date()`, matches. Content dates are untouched.
- Hashed build assets are left out of head snapshots: `link[rel=modulepreload]` and `/assets/*` hrefs.
- HTML bodies of `text` entries are not stored. Those routes are HTML pages already covered by page snapshots.

## Tailwind and the harness

Tailwind v4 detects class names in every non-ignored file of the repo. Without an exclusion, text in `parity/` (for example the `drawer-open` step name) added DaisyUI `.drawer-open` rules to the site CSS and changed the mobile drawer by 509 px. `tailwind.css` therefore has `@source not "./parity";`, which restores the exact pre-harness CSS (`app-0QTtOj3N.css`). The migrated site needs the same exclusion.

## Edge cache state

The harness deletes `.wrangler/state` before every server start. The worker stores rendered HTML in the Cloudflare Cache API, which `vite preview` persists there with `s-maxage=600`. Without the wipe, a run started within 10 minutes of another one served the earlier run's HTML; after a rebuild that HTML pointed at JS/CSS assets that no longer exist and every page rendered unstyled.

Analytics snapshot shape: `{ views, events }`. `views` lists pageviews in order. `events` is the sorted, de-duplicated set of `{name, path, props}`: view-triggered events (e.g. `view_item_list`) fire from IntersectionObservers, so their count and order vary with scroll timing, while which events fire with which payloads is stable.
