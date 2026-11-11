import { Suspense } from "react";
import { Await } from "@tanstack/react-router";
import type { loadPage } from "../page.functions";
import { PAGE_STATUS_HEADER } from "@decocms/tanstack/router";
import { View } from "../views";

export type PageData = Awaited<ReturnType<typeof loadPage>>;

/** The page's blocks, each in its own Suspense boundary, rendered as its promise resolves. */
export function PageBlocks({ blocks }: { blocks: PageData["blocks"] }) {
  return blocks.map((block) => (
    <Suspense key={block.key} fallback={null}>
      <Await promise={block.value}>
        {({ value, failed }) => {
          if (failed) {
            const notice = <p role="status">Este conteúdo está temporariamente indisponível.</p>;
            // Still a section Studio can pick out, so an editor can fix the block where it failed.
            return block.component ? <section data-manifest-key={block.component}>{notice}</section> : notice;
          }
          return value ? <View block={value} /> : null; // undefined when an editor hid the block
        }}
      </Await>
    </Suspense>
  ));
}

/** Search params a page reload depends on (?q=, ?page=): all of them. */
export function pageLoaderDeps({ search }: { search: Record<string, string> }) {
  return { search: search && Object.keys(search).length ? search : undefined };
}

/**
 * The page path of the catch-all's splat (`/$`, decoded). A splat starting with "/" or "\" (from
 * `/%2F…`, `/%5C…`) would make `//host` or `/\host`, a URL on another origin: that first character
 * stays encoded, so the path names no page and gets the 404 page, as any unknown URL.
 */
export function splatPath(splat: string | undefined): string {
  return `/${(splat ?? "").replace(/^[/\\]/, (c) => encodeURIComponent(c))}`;
}

export function pageHref(path: string, search: Record<string, string> | undefined): string {
  return path + (search ? `?${new URLSearchParams(search).toString()}` : "");
}

/**
 * `DEGRADED_HEADER` of @decocms/tanstack/worker (and /server, which a client module can't import):
 * a response with it set to "true" is never stored by the page cache (src/edge/page-cache.ts).
 */
export const DEGRADED_HEADER = "x-deco-degraded";

/**
 * The page's response headers: its status (the worker, `createDecoWorker`, turns `x-page-status`
 * into the response status) and, when some of its content failed to load, `DEGRADED_HEADER`.
 */
export function pageHeaders({ loaderData }: { loaderData?: PageData }): Record<string, string> {
  const headers: Record<string, string> = {};
  if (loaderData && loaderData.status !== 200) headers[PAGE_STATUS_HEADER] = String(loaderData.status);
  if (loaderData?.degraded) headers[DEGRADED_HEADER] = "true";
  return headers;
}
