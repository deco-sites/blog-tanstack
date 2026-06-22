import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "~/components/RootLayout";
import OneDollarStats from "@decocms/apps/website/components/OneDollarStats";
// @ts-ignore Vite ?url import
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Blog" },
      { property: "og:site_name", content: "Blog" },
      { property: "og:locale", content: "pt_BR" },
      // GEO: Tell AI crawlers this is an indexable, authoritative blog
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    ],
    links: [
      // Performance: preconnect for font CDN and image CDN
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "preconnect", href: "https://ozksgdmyrqcxcwhnbepg.supabase.co" },
      // Ubuntu font — non-blocking via media="print" swap (~900ms FCP savings on mobile)
      {
        id: "blog-fonts-css",
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap",
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
  }),
  component: Root,
});

function Root() {
  return (
    <RootLayout lang="pt-BR" siteName="blog-tanstack">
      <OneDollarStats />
    </RootLayout>
  );
}
