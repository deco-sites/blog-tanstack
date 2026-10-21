import type { Block, Route } from "@decocms/blocks";
import type {
  BlogAuthorsProps,
  BlogHeaderProps,
  BlogHomeProps,
  BlogPostSectionProps,
  BlogSearchProps,
  BlogTopicsProps,
} from "./blocks.server";
import type { SiteContext } from "./utils/site-config";
import type { PostBodyBlock } from "./vendor/blog/types";

type WithSite<P> = P & SiteContext;

/**
 * What a page section returns: the view to render and its props, computed on
 * the server (descriptors, /next/rendering).
 */
export type BlockDescriptor =
  | { component: "blog-header"; props: BlogHeaderProps }
  | {
      component: "blog-home";
      props: WithSite<BlogHomeProps & { currentPage: number; query: string }>;
    }
  | { component: "blog-authors"; props: WithSite<BlogAuthorsProps> }
  | { component: "blog-topics"; props: WithSite<BlogTopicsProps> }
  | { component: "blog-search"; props: WithSite<BlogSearchProps & { query: string }> }
  | { component: "blog-post-section"; props: BlogPostSectionProps }
  // A post's body blocks are sections too, as on v7 (rendered alone if placed on a page).
  | PostBodyBlock;

/** A saved page, as client.list returns it (nothing run): seo and sections are still blocks. */
export interface StoredPage extends Route {
  seo?: Block;
  sections: Block[] | Block;
}
