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
import { getSiteConfig, type SiteConfig, type SiteSettings } from "./utils/site-config";

export type {
  BlogAuthorsProps,
  BlogHeaderProps,
  BlogHomeProps,
  BlogPostSectionProps,
  BlogSearchProps,
  BlogTopicsProps,
};

/** The saved `site` block's settings, read through the request's client. */
export async function siteConfig(): Promise<SiteConfig> {
  const [settings, error] = await requestState().client.resolve<SiteSettings>("site");
  if (error) throw error;
  return getSiteConfig(settings);
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
  const currentPage = Math.max(1, parseInt(url.searchParams.get("page") ?? "1") || 1);
  return {
    ...props,
    baseUrl: url.pathname,
    currentPage,
    query: url.searchParams.get("q") ?? "",
    origin: url.origin,
    siteConfig: await siteConfig(),
  };
}

export async function blogAuthorsProps(props: BlogAuthorsProps) {
  const url = requestState().url;
  return { ...props, origin: url.origin, pathname: url.pathname, siteConfig: await siteConfig() };
}

export async function blogTopicsProps(props: BlogTopicsProps) {
  const url = requestState().url;
  return { ...props, origin: url.origin, pathname: url.pathname, siteConfig: await siteConfig() };
}

export async function blogSearchProps(props: BlogSearchProps) {
  const url = requestState().url;
  return {
    ...props,
    query: url.searchParams.get("q") ?? "",
    origin: url.origin,
    siteConfig: await siteConfig(),
  };
}

export async function blogPostSectionProps(props: BlogPostSectionProps) {
  return { ...props, siteConfig: await siteConfig() };
}
