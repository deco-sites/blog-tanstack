import "./cache-config";

import {
  applySectionConventions,
  registerCommerceLoaders,
  registerSectionLoaders,
  registerSections,
} from "@decocms/blocks/cms";
import { createSiteSetup } from "@decocms/blocks/setup";
import { setInvokeLoaders } from "@decocms/blocks-admin";
import { createAdminSetup } from "@decocms/blocks-admin/setup";
import { autoconfigApps } from "@decocms/blocks-admin/apps/autoconfig";
import { PreviewProviders, setupTanstackFastDeploy } from "@decocms/tanstack";
import { loader as blogPostSeoLoader } from "@decocms/apps-blog/sections/Seo/SeoBlogPost";
import { loader as blogPostListingSeoLoader } from "@decocms/apps-blog/sections/Seo/SeoBlogPostListing";
import { blocks as generatedBlocks } from "../.deco/blocks.gen";
import {
  loadingFallbacks,
  sectionMeta,
  syncComponents,
} from "../.deco/sections.gen";
import { siteLoaders } from "../.deco/loaders.gen";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

const sectionGlob = import.meta.glob("./sections/**/*.tsx") as Record<
  string,
  () => Promise<any>
>;

// `productionOrigins` is intentionally omitted: it rewrites every absolute URL
// on the production host to a relative path, including `seo.canonical` and the
// JSON-LD URLs built from `canonicalBaseUrl`.
createSiteSetup({
  sections: sectionGlob,
  blocks: generatedBlocks,
  onResolveError: (error, resolveType, context) => {
    console.error(`[CMS] ${context} "${resolveType}" failed:`, error);
  },
  onDanglingReference: (resolveType) => {
    console.warn(`[CMS] Dangling reference: ${resolveType}`);
    return null;
  },
});

createAdminSetup({
  meta: () => import("../.deco/meta.gen.json").then((m) => m.default),
  css: appCss,
  fonts: [],
  previewWrapper: PreviewProviders,
});

applySectionConventions({
  meta: sectionMeta,
  syncComponents,
  loadingFallbacks,
  sectionGlob,
});

// Registers each app's loaders, actions and sections. Must run before the
// site loaders below: setupApps resets the invoke handlers it owns.
await autoconfigApps(generatedBlocks, [
  {
    blockKey: "site",
    module: () => import("@decocms/apps-website/mod"),
    displayName: "Website",
    category: "site",
  },
  {
    blockKey: "deco-blog",
    module: () => import("@decocms/apps-blog/mod"),
    displayName: "Blog",
    category: "content",
  },
]);

// Page-level SEO sections (`page.seo`). setupApps registers app sections
// lazily and without the `.tsx` key the decofile uses, and doesn't register
// their loaders — which is what turns `{ jsonLD }` into title/canonical/JSON-LD.
registerSections({
  "website/sections/Seo/SeoV2.tsx": () =>
    import("@decocms/apps-website/sections/Seo/SeoV2"),
  "blog/sections/Seo/SeoBlogPost.tsx": () =>
    import("@decocms/apps-blog/sections/Seo/SeoBlogPost"),
  "blog/sections/Seo/SeoBlogPostListing.tsx": () =>
    import("@decocms/apps-blog/sections/Seo/SeoBlogPostListing"),
});
// The framework calls section loaders as `loader(props, req, ctx)`, but the
// blog SEO loaders read their 3rd argument as the site SEO defaults — `ctx`
// would shadow the blog app's `seo` config (titleTemplate…). Drop it so they
// fall back to `getBlogConfig().seo`.
registerSectionLoaders({
  "blog/sections/Seo/SeoBlogPost.tsx": (props, req) =>
    blogPostSeoLoader(props as any, req),
  "blog/sections/Seo/SeoBlogPostListing.tsx": (props, req) =>
    blogPostListingSeoLoader(props as any, req),
});

// Site loaders (`site/loaders/*`) — e.g. site/loaders/BlogpostList.ts, which
// returns BlogPost[] and supports filtering by category or author.
registerCommerceLoaders(siteLoaders);
setInvokeLoaders(() => siteLoaders);

// Each section's exported `loader` enriches CMS-resolved props server-side
// (siteConfig, origin, pathname, query…).
registerSectionLoaders(
  Object.fromEntries(
    Object.entries(syncComponents)
      .filter(([, mod]) => typeof (mod as any).loader === "function")
      .map(([key, mod]) => [key, (mod as any).loader]),
  ) as Record<string, (props: any, req: Request) => any>,
);

setupTanstackFastDeploy();
