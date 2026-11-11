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

export function pageHref(path: string, search: Record<string, string> | undefined): string {
  return path + (search ? `?${new URLSearchParams(search).toString()}` : "");
}

/** The page's status: the worker (`createDecoWorker`) turns `x-page-status` into the response status. */
export function pageHeaders({ loaderData }: { loaderData?: PageData }): Record<string, string> {
  return loaderData && loaderData.status !== 200 ? { [PAGE_STATUS_HEADER]: String(loaderData.status) } : {};
}
