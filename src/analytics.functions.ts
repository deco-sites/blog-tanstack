import { createServerFn } from "@tanstack/react-start";
import type { Analytics } from "@decocms/blocks";
import { cms } from "./cms";

/**
 * The analytics section of the CMS settings (the saved block `CMS`): collector and enabled, with the
 * defaults filled in. Read from the release in memory, never from a draft.
 */
export const loadAnalytics = createServerFn({ method: "GET" }).handler(
  async (): Promise<Analytics> => (await cms.settings()).analytics,
);
