import type { Block, Route } from "@decocms/blocks";
import type {
  BlogAuthorsProps,
  BlogHeaderProps,
  BlogHomeProps,
  BlogPostSectionProps,
  BlogSearchProps,
  BlogTopicsProps,
} from "./blocks.server";
import type { PageSeo } from "./seo/types";
import type { SiteConfig } from "./utils/site-config";
import type { PostBodyBlock } from "./vendor/blog/types";

type WithSite<P> = P & { siteConfig: SiteConfig };

/**
 * What a page section returns: the view to render and its props, computed on
 * the server (descriptors, /next/rendering).
 */
export type BlockDescriptor =
  | { component: "blog-header"; props: BlogHeaderProps }
  | {
      component: "blog-home";
      props: WithSite<BlogHomeProps & { currentPage: number; query: string; origin: string }>;
    }
  | { component: "blog-authors"; props: WithSite<BlogAuthorsProps & { origin: string; pathname: string }> }
  | { component: "blog-topics"; props: WithSite<BlogTopicsProps & { origin: string; pathname: string }> }
  | { component: "blog-search"; props: WithSite<BlogSearchProps & { query: string; origin: string }> }
  | { component: "blog-post-section"; props: WithSite<BlogPostSectionProps> }
  // A post's body blocks are sections too, as on v7 (rendered alone if placed on a page).
  | PostBodyBlock;

/** A saved page, as client.list returns it (nothing run): seo and sections are still blocks. */
export interface StoredPage extends Route {
  seo?: Block;
  sections: Block[] | Block;
}

/**
 * @title Page
 * @description A page at a URL: its SEO and its sections, in order.
 */
export interface BlogPage extends Route {
  /** @title SEO */
  seo?: PageSeo;
  /** @title Sections */
  sections: BlockDescriptor[];
}
