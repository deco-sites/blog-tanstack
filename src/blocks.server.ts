/**
 * Server-side props for the page sections: what each v7 section `loader` added
 * to its saved props (request URL parts, site settings, the header's search
 * index), now done inside the block function before it returns a descriptor.
 */
import BlogpostList from "./blog/BlogpostList";
import { requestState } from "./request-state.server";
import type { Props as BlogAuthorsProps } from "./sections/Blog/BlogAuthors";
import type { Props as BlogHeaderProps } from "./sections/Blog/BlogHeader";
import type { Props as BlogHomeProps } from "./sections/Blog/BlogHome";
import type { Props as BlogPostSectionProps } from "./sections/Blog/BlogPostSection";
import type { Props as BlogSearchProps } from "./sections/Blog/BlogSearch";
import type { Props as BlogTopicsProps } from "./sections/Blog/BlogTopics";
import {
  type BlogSettings,
  getSiteConfig,
  type SiteConfig,
  type SiteContext,
  type SiteSettings,
} from "./utils/site-config";

export type {
  BlogAuthorsProps,
  BlogHeaderProps,
  BlogHomeProps,
  BlogPostSectionProps,
  BlogSearchProps,
  BlogTopicsProps,
};

/** The saved `site` and `deco-blog` blocks' settings, read through the request's client. */
export async function siteConfig(): Promise<SiteConfig> {
  const { client } = requestState();
  const [[settings, error], [blog, blogError]] = await Promise.all([
    client.resolve<SiteSettings>("site"),
    client.resolve<BlogSettings>("deco-blog"),
  ]);
  if (error) throw error;
  if (blogError) throw blogError;
  return getSiteConfig(settings, blog);
}

/** What every listing section gets: the origin for absolute URLs (the canonical base when set), the path, the site. */
async function siteContext(): Promise<SiteContext> {
  const url = requestState().url;
  const config = await siteConfig();
  return { origin: config.canonicalBaseUrl ?? url.origin, pathname: url.pathname, siteConfig: config };
}

/** The header gets its search index (the latest 100 posts) when the page doesn't give it one. */
export async function blogHeaderProps(props: BlogHeaderProps): Promise<BlogHeaderProps> {
  if (props.posts != null) return props;
  const posts = await BlogpostList({ count: 100, sortBy: "date_desc" });
  return { ...props, posts: posts ?? [] };
}

/** Pagination and search come from the URL; the base URL is the current path. */
export async function blogHomeProps(props: BlogHomeProps) {
  const url = requestState().url;
  const context = await siteContext();
  return {
    ...props,
    ...context,
    baseUrl: context.pathname,
    currentPage: Math.max(1, parseInt(url.searchParams.get("page") ?? "1") || 1),
    query: url.searchParams.get("q") ?? "",
  };
}

export async function blogAuthorsProps(props: BlogAuthorsProps) {
  return { ...props, ...(await siteContext()) };
}

export async function blogTopicsProps(props: BlogTopicsProps) {
  return { ...props, ...(await siteContext()) };
}

export async function blogSearchProps(props: BlogSearchProps) {
  const url = requestState().url;
  return { ...props, ...(await siteContext()), query: url.searchParams.get("q") ?? "" };
}

/** The post section reads everything from its props (its structured data is the page SEO's). */
export async function blogPostSectionProps(props: BlogPostSectionProps) {
  return props;
}
