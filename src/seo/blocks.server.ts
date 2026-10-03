/**
 * The blocks a page's `seo` field holds. Each returns the page's SEO; the
 * catch-all route turns it into head tags (./head.ts).
 */
import { requestState } from "../request-state.server";
import { getRecordsByPath } from "../vendor/blog/core/records";
import type { Author, BlogPostPage, Category } from "../vendor/blog/types";
import { type PageSeo, pickSeo } from "./types";

/** @title SEO */
export interface SeoProps {
  title?: string;
  /**
   * @title Title template
   * @description Kept from v7. Not applied: the v7 site never applied it.
   */
  titleTemplate?: string;
  description?: string;
  /**
   * @title Description template
   * @description Kept from v7. Not applied: the v7 site never applied it.
   */
  descriptionTemplate?: string;
  /** @title Open Graph type */
  type?: "website" | "article";
  /** @description Recommended: 1200 x 630 px */
  image?: string;
  /** @title Canonical URL */
  canonical?: string;
  /** @title Disable indexing */
  noIndexing?: boolean;
  /**
   * @title No index (legacy field)
   * @description Kept from v7, where it had no effect; use "Disable indexing".
   */
  noIndex?: boolean;
}

/** A page's SEO as typed in the form ("website/sections/Seo/SeoV2.tsx" in v7 content). */
export function seo(props: SeoProps): PageSeo {
  return pickSeo(props as Record<string, unknown>);
}

/** @title Blog post SEO */
export interface SeoBlogPostProps {
  /** @description The post page, from the BlogPostPage loader */
  jsonLD?: BlogPostPage | null;
}

/** The post's own SEO fields, with the page URL as canonical when the post sets none. */
export function seoBlogPost({ jsonLD }: SeoBlogPostProps): PageSeo {
  const seo = jsonLD?.seo;
  return pickSeo({
    title: seo?.title,
    description: seo?.description,
    canonical: seo?.canonical,
    image: seo?.image,
    noIndexing: seo?.noIndexing,
  });
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

/** @title Topic page SEO */
export interface SeoBlogCategoryProps {
  /** @description Not used: the title comes from the topic in the URL */
  title?: string;
  /** @description Not used: the description comes from the topic in the URL */
  description?: string;
}

/** "<topic> — Blog", for the topic whose slug ends the URL. */
export async function seoBlogCategory(_props: SeoBlogCategoryProps): Promise<PageSeo> {
  const slug = lastSegment();
  const categories = await getRecordsByPath<Category>(
    "blog/loaders/Category.ts",
    "collections/blog/categories",
    "category",
  );
  const category = categories.find((c) => c.slug === slug);
  const name = category?.name ?? slug;
  return {
    title: `${name} — Blog`,
    description: `Artigos sobre ${name} no Blog.`,
  };
}

function lastSegment(): string {
  return requestState().url.pathname.split("/").filter(Boolean).pop() ?? "";
}
