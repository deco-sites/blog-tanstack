import { createFileRoute } from "@tanstack/react-router";
import { client } from "../cms";
import type { StoredPage } from "../model";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Every page with a fixed path (no :param or *), deepest paths first, the home page last. */
async function sitemapXml(request: Request): Promise<string> {
  const origin = new URL(request.url).origin;
  const [pages, error] = await client(request).list<StoredPage>("page");
  if (error) throw error;
  const today = new Date().toISOString().split("T")[0];
  const depth = (path: string) => path.split("/").filter(Boolean).length;

  const urls = pages
    .filter((page) => typeof page.path === "string" && !page.path.includes(":") && !page.path.includes("*"))
    .sort((a, b) => depth(b.path) - depth(a.path))
    .map((page) => {
      const isHome = page.path === "/";
      const loc = `${origin}${isHome ? "" : page.path}`;
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${isHome ? "daily" : "weekly"}</changefreq>`,
        `    <priority>${(isHome ? 1 : 0.7).toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(await sitemapXml(request), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
    },
  },
});
