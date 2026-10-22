import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { parseSearch, stringifySearch } from "./search-params";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    parseSearch,
    stringifySearch,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
