// The production worker (src/edge/worker.ts: createDecoWorker, the page cache, HEAD and the
// visitor cookie) in front of a stand-in for TanStack Start that does what the app's routes do: the
// sitemap route's handler, or the page (`openPage`, every block settled) with the route's headers
// (`pageHeaders`). With the fake delivery CDN and the in-memory Cache API: import this first.
import "./fake-delivery";
import { executionContext } from "./fake-cache";
import { isRedirect } from "@tanstack/react-router";
import { pageHeaders } from "../src/components/PageBlocks";
import { blogWorker } from "../src/edge/worker";
import type { BlockDescriptor } from "../src/model";
import { openPage } from "../src/open-page.server";
import { Route as Sitemap } from "../src/routes/sitemap[.]xml";

export const ORIGIN = "http://blog.test";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const sitemap = (Sitemap.options as unknown as { server: { handlers: { GET: Handler } } }).server.handlers.GET;

async function app(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/sitemap.xml") return sitemap({ request });
  try {
    const page = await openPage<BlockDescriptor>(url.pathname + url.search, request);
    const blocks = await Promise.all(page.blocks.map((block) => block.value));
    const failed = blocks.filter((block) => block.failed).length;
    return new Response(`<!doctype html><title>${page.name}</title><!-- ${failed} failed -->`, {
      headers: { "content-type": "text/html; charset=utf-8", ...pageHeaders({ loaderData: page }) },
    });
  } catch (error) {
    if (isRedirect(error)) return new Response(null, { status: 307, headers: { location: error.options.href ?? "/" } });
    console.error(error);
    return new Response("error", { status: 500 });
  }
}

export const worker = blogWorker({ serverEntry: { fetch: app }, buildHash: "test" });

/** `worker.fetch`, body read and every `waitUntil` settled (a cache write included). */
export async function request(href: string, init?: RequestInit) {
  const ctx = executionContext();
  const res = await worker.fetch(new Request(ORIGIN + href, init), {}, ctx);
  const body = await res.text();
  await ctx.settled();
  return { res, body };
}
