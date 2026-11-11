/**
 * The CMS, created once at module scope (/next/content#create-the-cms), and the client every request
 * reads content with (/next/tanstack-start-descriptors#2-create-the-cms).
 *
 * Content is never bundled: it is the release published in Studio for the site `CMS_SITE`, read from
 * the delivery CDN at runtime, and a publish goes live without a deploy (/next/hosted#cloudflare-workers).
 * A request reads the index (`latest.json`, held per isolate and re-checked every `interval`), the
 * page `client.routes()` matched, the blocks that page references and the config blocks named in
 * code (`site`, `deco-blog`; `CMS` is inline in the index). Never `client.list()` (removed: it fetched
 * every block of a type). The blog's collections (posts, categories, authors) are read through the
 * index with `client.entries(type)` and one `resolve(name)` per document (src/vendor/blog/core/records.ts).
 * Block bodies are content-addressed and kept per isolate by hash, so a warm request fetches nothing.
 *
 * Drafts: `createDecoWorker` (src/worker-entry.ts) decides the version once per request and hands it
 * to the app; `contentClient` builds the client from what it decided (/next/hosted-drafts).
 */
import { createCMS } from "@decocms/blocks";
import { contentClient } from "@decocms/tanstack/server";
import blocks from "../.deco";

/**
 * The Studio site whose release this worker serves. A constant in code, not `DECO_SITE` in
 * wrangler.jsonc: the `deco` CLI reads `DECO_SITE` from there, and `deco check` must check the
 * content this repository carries (`.deco/blocks`) until it is published to the CDN. CI jobs that
 * talk to Studio (`deco schema push`) set `DECO_SITE` themselves.
 */
export const CMS_SITE = "blog-tanstack";

/**
 * The Worker's vars. With `nodejs_compat` and a compatibility date after 2025-04-01, Workers fill
 * `process.env` with them, so this module also loads under Node (tests) without `cloudflare:workers`.
 */
const vars: Record<string, unknown> = (globalThis as { process?: { env?: Record<string, unknown> } }).process?.env ?? {};

/** The site token (a Worker secret, optional): it only authenticates telemetry. */
const token = typeof vars.DECO_SITE_TOKEN === "string" && vars.DECO_SITE_TOKEN ? vars.DECO_SITE_TOKEN : undefined;

/**
 * The telemetry identity (/next/telemetry): `service.name` from DECO_SITE_NAME, the environment from
 * DECO_ENV_NAME (wrangler.jsonc vars). The SDK's defaults fill what is unset.
 */
const resource = Object.fromEntries(
  Object.entries({
    "service.name": vars.DECO_SITE_NAME,
    "deployment.environment.name": vars.DECO_ENV_NAME,
  }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""),
);

export const cms = createCMS({
  blocks,
  site: CMS_SITE,
  token,
  // `vite dev` sends nothing; without a token nothing is sent either.
  telemetry: import.meta.env?.DEV ? false : { resource, defaults: { errorSampleRate: 1 } },
});

/**
 * The client for this request: the version (a Studio draft or the release), the visitor and every
 * test and campaign as the worker decided them, so the page renders exactly what the page cache
 * keyed on and decides nothing again.
 */
export const client = async (request: Request) => contentClient(cms, request);
