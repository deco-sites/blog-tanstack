import { createFileRoute } from "@tanstack/react-router";
import { generateSitemapXml, getCMSSitemapEntries } from "@decocms/start/sdk/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const entries = getCMSSitemapEntries(origin);
        const xml = generateSitemapXml(entries);

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
