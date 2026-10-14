/**
 * The blocks a page's `seo` field holds. Each returns the page's SEO; the
 * catch-all route turns it into head tags (./head.ts).
 */
import { requestState } from "../request-state.server";
import type { BlogSettings } from "../utils/site-config";
import { getRecordsByPath } from "../vendor/blog/core/records";
import type { Author, BlogPostListingPage, BlogPostPage } from "../vendor/blog/types";
import { toBlogPosting, toBreadcrumbList, toOrganization, withCanonicalBase } from "../vendor/blog/utils/jsonLD";
import { type PageSeo, pickSeo } from "./types";

// The fields, titles and formats are v7's `website/sections/Seo/SeoV2.tsx` form
// (@decocms/blocks 7.77.3, src/cms/schema.ts), so editors keep the form they know.
// The head applies title, description, canonical, image, noIndexing and type.
/** @title SEO */
export interface SeoProps {
  /** @title Title */
  title?: string;
  /** @title Description */
  description?: string;
  /** @title Canonical URL */
  canonical?: string;
  /**
   * @title Favicon
   * @format image-uri
   */
  favicon?: string;
  /** @title No Indexing */
  noIndexing?: boolean;
  /** @title Title Template */
  titleTemplate?: string;
  /** @title Description Template */
  descriptionTemplate?: string;
  /** @title Page Type */
  type?: string;
  /**
   * @title OG Image
   * @format image-uri
   */
  image?: string;
  /**
   * @title Theme Color
   * @format color
   */
  themeColor?: string;
  /** @title JSON-LD Structured Data */
  jsonLDs?: Record<string, unknown>[];
}

/** A page's SEO as typed in the form ("website/sections/Seo/SeoV2.tsx" in v7 content). */
export function seo(props: SeoProps): PageSeo {
  return pickSeo(props as Record<string, unknown>);
}

/** @title Blog post SEO */
export interface SeoBlogPostProps {
  /** @title Data Source */
  jsonLD?: BlogPostPage | null;
  /** @title Title Override */
  title?: string;
  /** @title Description Override */
  description?: string;
}

/**
 * The post's SEO, as @decocms/apps-blog's SeoBlogPost gives it: the blog's
 * title and description templates applied, the canonical on the blog's
 * canonical origin, and BlogPosting + BreadcrumbList structured data.
 */
export async function seoBlogPost({ jsonLD, title: titleProp, description: descriptionProp }: SeoBlogPostProps): Promise<PageSeo> {
  const blog = await blogSettings();
  const { title, description } = applyBlogTemplates(blog, titleProp || jsonLD?.seo?.title, descriptionProp || jsonLD?.seo?.description);
  const image = jsonLD?.post?.seo?.image || jsonLD?.seo?.image || jsonLD?.post?.image;
  const { canonicalBaseUrl, publisher } = blog;
  const requestUrl = requestState().url.href;
  // Configured canonicals may be relative; resolve against the request URL.
  const canonical = jsonLD?.seo?.canonical
    ? withCanonicalBase(new URL(jsonLD.seo.canonical, requestUrl).href, canonicalBaseUrl)
    : undefined;

  const pageUrl = canonical ?? withCanonicalBase(requestUrl, canonicalBaseUrl);
  const jsonLDs = jsonLD?.post
    ? [
        toBlogPosting(jsonLD.post, pageUrl, publisher),
        toBreadcrumbList(pageUrl, {
          currentName: jsonLD.post.title,
          categories: jsonLD.categories ?? jsonLD.post.categories,
        }),
      ]
    : [];

  return {
    ...pickSeo({ title, description, image, canonical }),
    noIndexing: !jsonLD || !!jsonLD.seo?.noIndexing,
    jsonLDs: withContext(jsonLDs),
  };
}

/** @title Topic page SEO */
export interface SeoBlogPostListingProps {
  /** @title Data Source */
  jsonLD?: BlogPostListingPage | null;
  /** @title Title Override */
  title?: string;
  /** @title Description Override */
  description?: string;
}

/**
 * A topic page's SEO, as @decocms/apps-blog's SeoBlogPostListing gives it:
 * the topic's name through the blog's templates, its canonical, and Blog +
 * BreadcrumbList structured data.
 */
export async function seoBlogPostListing({
  jsonLD,
  title: titleProp,
  description: descriptionProp,
}: SeoBlogPostListingProps): Promise<PageSeo> {
  const blog = await blogSettings();
  const { title, description } = applyBlogTemplates(blog, titleProp || jsonLD?.seo?.title, descriptionProp || jsonLD?.seo?.description);
  const { canonicalBaseUrl, publisher } = blog;
  const requestUrl = requestState().url.href;
  const canonical = jsonLD?.seo?.canonical
    ? withCanonicalBase(new URL(jsonLD.seo.canonical, requestUrl).href, canonicalBaseUrl)
    : undefined;

  const url = canonical ?? withCanonicalBase(requestUrl, canonicalBaseUrl);
  const jsonLDs = jsonLD
    ? [
        {
          "@type": "Blog" as const,
          ...(title ? { name: title } : {}),
          ...(description ? { description } : {}),
          url,
          mainEntityOfPage: { "@type": "WebPage" as const, "@id": url },
          ...(publisher?.name ? { publisher: toOrganization(publisher) } : {}),
          blogPost: jsonLD.posts?.map((post) => toBlogPosting(post)) ?? [],
        },
        toBreadcrumbList(url, {
          currentName: jsonLD.category?.name || title || undefined,
          categories: jsonLD.categories ?? undefined,
        }),
      ]
    : [];

  return {
    ...pickSeo({ title, description, canonical }),
    noIndexing: !jsonLD || !!jsonLD.seo?.noIndexing,
    jsonLDs: withContext(jsonLDs),
  };
}

/** The saved `deco-blog` block's settings. */
async function blogSettings(): Promise<BlogSettings> {
  const [settings, error] = await requestState().client.resolve<BlogSettings>("deco-blog");
  if (error) throw error;
  return settings ?? {};
}

/** `%s` in the blog's templates replaced by the title and description (v7's renderTemplateString). */
function applyBlogTemplates(blog: BlogSettings, title = "", description = "") {
  const render = (template: string | undefined, value: string) =>
    (typeof template === "string" ? template : "%s").replace("%s", value);
  return {
    title: render(blog.seo?.titleTemplate, title),
    description: render(blog.seo?.descriptionTemplate, description),
  };
}

/**
 * Stamps "@context" on each node. The app's builders leave it to the Seo
 * component that renders them, but the head serializes the nodes as they are;
 * without it no validator recognizes the types (the v7 site did the same).
 */
function withContext(nodes: object[]): object[] {
  return nodes.map((node) => ({ "@context": "https://schema.org", ...node }));
}

/** @title Author page SEO */
export interface SeoBlogAuthorProps {
  /** @description Not used: the title comes from the author in the URL */
  title?: string;
  /** @description Not used: the description comes from the author in the URL */
  description?: string;
}

/** "Posts de <author> — Blog", for the author whose email ends the URL. */
export async function seoBlogAuthor(_props: SeoBlogAuthorProps): Promise<PageSeo> {
  const email = lastSegment();
  const authors = await getRecordsByPath<Author>("blog/loaders/Author.ts", "collections/blog/authors", "author");
  const author = authors.find((a) => a.email === email);
  const name = author?.name ?? email;
  return {
    title: `Posts de ${name} — Blog`,
    description: `Artigos escritos por ${name} no Blog.`,
  };
}

/** The URL's last segment, decoded (/authors/a%40b.com is a@b.com). */
function lastSegment(): string {
  const segment = requestState().url.pathname.split("/").filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : "";
}
