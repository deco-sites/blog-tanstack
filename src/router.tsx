import { createDecoRouter } from "@decocms/tanstack/router";
import { routeTree } from "./routeTree.gen";

/**
 * Deco's router: TanStack's with scroll restoration, preload on intent and plain URLSearchParams
 * search params (`?q=react&page=2`, empty values kept, so `?utm_source=` never answers a 307).
 */
export function getRouter() {
  return createDecoRouter({ routeTree });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
