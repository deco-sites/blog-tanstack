import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Analytics } from "@decocms/blocks";
import { client } from "./cms";

/** The saved Analytics block's settings (collector, enabled), with the defaults filled in. */
export const loadAnalytics = createServerFn({ method: "GET" }).handler(async (): Promise<Analytics> => {
  const [analytics, error] = await client(getRequest()).resolve<Analytics>("Analytics");
  if (error) {
    console.error(error);
    return { enabled: false };
  }
  return analytics;
});
