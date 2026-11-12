import { DEGRADED_HEADER } from "@decocms/tanstack/server";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { BlockDescriptor } from "./model";
import { openPage } from "./open-page.server";

export const loadPage = createServerFn({ method: "GET" })
  // A path on this site: `//host/x` and `/\host` are protocol-relative URLs that would move the page to another origin.
  .inputValidator(
    z.object({
      href: z
        .string()
        .startsWith("/")
        .refine((href) => !href.startsWith("//") && !href.startsWith("/\\"), "not a local path"),
    }),
  )
  .handler(async ({ data }) => {
    const page = await openPage<BlockDescriptor>(data.href, getRequest());
    // A client-side navigation's page data goes through the page cache too: never store it degraded
    // (a document gets the header from the route's `headers`, `pageHeaders`).
    if (page.degraded) setResponseHeader(DEGRADED_HEADER, "true");
    return page;
  });
