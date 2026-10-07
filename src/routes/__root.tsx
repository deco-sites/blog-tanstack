import { createRootRoute } from "@tanstack/react-router";
import { AnalyticsScript } from "@decocms/blocks/analytics";
import { RootLayout } from "~/components/RootLayout";
import { loadAnalytics } from "../analytics.functions";
// @ts-ignore Vite ?url import
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  // Analytics settings are site-wide: load them once per visit.
  loader: () => loadAnalytics(),
  staleTime: Number.POSITIVE_INFINITY,
  head: () => {
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { title: "Blog" },
        { property: "og:site_name", content: "Blog" },
        { property: "og:locale", content: "pt_BR" },
        // GEO: Tell AI crawlers this is an indexable, authoritative blog
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        // AEO: Declare content language
        { httpEquiv: "content-language", content: "pt-BR" },
      ],
      links: [
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        // Performance: preconnect for font CDN and image CDN
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" as const },
        { rel: "preconnect", href: "https://ozksgdmyrqcxcwhnbepg.supabase.co" },
        // Ubuntu font — non-blocking via media="print" swap (~900ms FCP savings on mobile)
        {
          id: "blog-fonts-css",
          rel: "stylesheet",
          href:
            "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap",
          media: "print",
        },
        { rel: "stylesheet", href: appCss },
      ],
      scripts: [
        // Swap font stylesheet to media="all" after load — non-blocking pattern
        {
          id: "blog-fonts-swap",
          children:
            "(function(){var l=document.getElementById('blog-fonts-css');if(!l)return;function s(){l.media='all';}if(l.sheet){s();return;}l.addEventListener('load',s,{once:true});window.addEventListener('load',s,{once:true});})();",
        },
      ],
    };
  },
  component: Root,
});

function Root() {
  const analytics = Route.useLoaderData();
  const collector = analytics.enabled !== false ? analytics.collector : undefined;
  return (
    <RootLayout lang="pt-BR">
      {/* Warm up the page-view collector; React hoists these into the head. */}
      {collector && <link rel="dns-prefetch" href={collector} />}
      {collector && <link rel="preconnect" href={collector} crossOrigin="anonymous" />}
      <AnalyticsScript {...analytics} />
    </RootLayout>
  );
}
