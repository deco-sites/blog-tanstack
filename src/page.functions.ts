import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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
  .handler(({ data }) => openPage<BlockDescriptor>(data.href, getRequest()));
