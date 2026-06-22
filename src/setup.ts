import "./cache-config";

import {
  applySectionConventions,
  setBlocks,
  registerCommerceLoaders,
} from "@decocms/start/cms";
import { createBlogLoaders } from "@decocms/apps/blog";
import BlogpostList from "./loaders/BlogpostList";
import { autoconfigApps } from "@decocms/start/apps/autoconfig";
import { createSiteSetup } from "@decocms/start/setup";
import { setInvokeLoaders } from "@decocms/start/admin";
import { APP_REGISTRY } from "@decocms/apps/registry";
import { blocks as generatedBlocks } from "./server/cms/blocks.gen";
import { siteGlobalsBlocks } from "./server/cms/site-globals.gen";
import { sectionMeta, syncComponents, loadingFallbacks } from "./server/cms/sections.gen";
import { siteLoaders } from "./server/cms/loaders.gen";
import { PreviewProviders } from "@decocms/start/hooks";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

createSiteSetup({
  sections: import.meta.glob("./sections/**/*.tsx") as Record<string, () => Promise<any>>,
  blocks: generatedBlocks,
  meta: () => import("./server/admin/meta.gen.json").then((m) => m.default),
  css: appCss,
  fonts: [],
  productionOrigins: [
    "https://blog-tanstack.deco.site",
  ],
  previewWrapper: PreviewProviders,
  onResolveError: (error, resolveType, context) => {
    console.error(`[CMS] ${context} "${resolveType}" failed:`, error);
  },
  onDanglingReference: (resolveType) => {
    console.warn(`[CMS] Dangling reference: ${resolveType}`);
    return null;
  },
});

autoconfigApps(generatedBlocks, APP_REGISTRY);

if (typeof window !== "undefined") {
  setBlocks(siteGlobalsBlocks);
}

applySectionConventions({
  meta: sectionMeta,
  syncComponents,
  loadingFallbacks,
  sectionGlob: import.meta.glob("./sections/**/*.tsx") as Record<string, () => Promise<any>>,
});

// Extracts the last non-empty path segment from the request URL.
// Used by "website/functions/requestToParam.ts" blocks in blocks.gen.json
// (e.g. /topics/:slug → slug, /authors/:email → email).
const requestToParam = async (props: { param?: string }, req?: Request): Promise<string | null> => {
  if (!req) return null;
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
};

const BLOG_LOADERS = {
  ...createBlogLoaders(),
  ...siteLoaders,
  // Override: returns BlogPost[] (not BlogPostListingPage) and supports filterBy: "author"
  "blog/loaders/BlogpostList.ts": BlogpostList,
  "blog/loaders/BlogpostList": BlogpostList,
  // website/functions/requestToParam.ts — not in @decocms/apps, implemented here
  "website/functions/requestToParam.ts": requestToParam,
  "website/functions/requestToParam": requestToParam,
};
registerCommerceLoaders(BLOG_LOADERS);
setInvokeLoaders(() => BLOG_LOADERS);
