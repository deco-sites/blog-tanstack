import { AsyncLocalStorage } from "node:async_hooks";
import type { Client } from "@decocms/blocks";

/**
 * What a block function may read about the request it renders for. Deco CMS
 * hands block functions only their inputs, so the page handler shares the
 * rest the way the docs suggest for route params: through AsyncLocalStorage
 * (/next/routing#route-a-request, /next/blocks#reading-the-request).
 */
export interface RequestState {
  /** The page URL (for a client navigation, the page's, not the server function's). */
  url: URL;
  /** Route params from matchRoute, e.g. { slug } for "/:slug". */
  params: Record<string, string>;
  /** The request's client, so a block lists content from the same revision as the page. */
  client: Client;
  /** Set by `markDegraded`: some content the page needs failed to load. */
  degraded?: boolean;
}

const storage = new AsyncLocalStorage<RequestState>();

export function runWithRequestState<T>(state: RequestState, fn: () => T): T {
  return storage.run(state, fn);
}

/**
 * Says the page renders without some content it needs (a read that failed and was caught, so the
 * page still renders): the page cache never stores it (`DEGRADED_HEADER`, src/edge/page-cache.ts).
 */
export function markDegraded(): void {
  const state = storage.getStore();
  if (state) state.degraded = true;
}

export function requestState(): RequestState {
  const state = storage.getStore();
  if (!state) throw new Error("requestState() called outside a page request");
  return state;
}
