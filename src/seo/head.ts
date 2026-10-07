import type { PageSeo } from "./types";

interface PageHeadData {
  name?: string;
  seo?: PageSeo;
}

/**
 * The route's head tags for a page: title, description, robots, Open Graph,
 * Twitter card and canonical. Without a title, the page's name with
 * the site name, else the default title.
 */
export function pageHead(page: PageHeadData | undefined, siteName: string, defaultTitle: string) {
  const seo = page?.seo;
  const title = seo?.title ? seo.title : page?.name ? `${page.name} | ${siteName}` : defaultTitle;
  const description = seo?.description;
  const image = seo?.image;
  const canonical = seo?.canonical;

  const meta: Record<string, string>[] = [{ title }];
  if (description) meta.push({ name: "description", content: description });
  // Always an explicit robots directive.
  meta.push({
    name: "robots",
    content: seo?.noIndexing
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  });

  meta.push({ property: "og:title", content: title });
  if (description) meta.push({ property: "og:description", content: description });
  if (image) meta.push({ property: "og:image", content: image });
  meta.push({ property: "og:type", content: seo?.type || "website" });
  if (canonical) meta.push({ property: "og:url", content: canonical });

  meta.push({ name: "twitter:card", content: image ? "summary_large_image" : "summary" });
  meta.push({ name: "twitter:title", content: title });
  if (description) meta.push({ name: "twitter:description", content: description });
  if (image) meta.push({ name: "twitter:image", content: image });

  const links: Record<string, string>[] = canonical ? [{ rel: "canonical", href: canonical }] : [];

  return { meta, links };
}
