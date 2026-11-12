/**
 * The Worker's entry: TanStack Start behind the blog's `createDecoWorker` (src/edge/worker.ts),
 * which owns drafts, the CMS redirects, Studio framing, the security headers and the page cache.
 */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { blogWorker } from "./edge/worker";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

export default blogWorker({
  serverEntry: createServerEntry({ fetch: handler.fetch }),
  buildHash: __BUILD_HASH__,
  dev: import.meta.env.DEV,
  styles: [appCss],
});
