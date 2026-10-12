/**
 * Site configuration, reduced to what the blog's JSON-LD, SEO and GEO markup
 * needs, from two saved blocks:
 *
 *   .deco/blocks/site.json       a `site-settings` block: `seo` (title, description, favicon…)
 *   .deco/blocks/deco-blog.json  a `blog-settings` block: publisher, canonicalBaseUrl, SEO templates
 *
 * Block functions resolve the saved blocks on the server and pass the result
 * to sections as their `siteConfig` prop.
 */
import type { Publisher } from "../vendor/blog/types";

/** The site-wide SEO settings editors fill in. */
export interface SiteSeoSettings {
  /** @title Site title */
  title?: string;
  /** @title Site description */
  description?: string;
  /** @title Favicon / logo URL */
  favicon?: string;
  /** @title Disable indexing */
  noIndexing?: boolean;
  /**
   * @title Title template
   * @description Kept from v7. Not applied to page titles: v7 never applied it either.
   */
  titleTemplate?: string;
  /**
   * @title Description template
   * @description Kept from v7. Not applied to page descriptions: v7 never applied it either.
   */
  descriptionTemplate?: string;
  /** @title Open Graph type */
  type?: string;
}

/**
 * @title Site settings
 * @description Site-wide settings, saved once as the `site` block.
 */
export interface SiteSettings {
  seo?: SiteSeoSettings;
}

/** SEO defaults the blog's post and topic SEO fold into their output. */
export interface BlogSeoDefaults {
  /**
   * @title Title template
   * @description Applied to post and topic titles, e.g. "%s — Blog".
   */
  titleTemplate?: string;
  /**
   * @title Description template
   * @description Applied to post and topic descriptions.
   */
  descriptionTemplate?: string;
}

/**
 * @title Blog settings
 * @description The blog's routes, canonical origin, publisher and SEO templates, saved once as the `deco-blog` block.
 */
export interface BlogSettings {
  /**
   * @title Category Slug
   * @description The route of a category page. Use :category.
   * @example /topics/:category
   */
  categorySlug?: string;
  /**
   * @title Page Slug
   * @description The route of a post page. Use :slug.
   * @example /:slug
   */
  pageSlug?: string;
  /**
   * @title Canonical Base URL
   * @description The origin of canonicals and of the URLs in the JSON-LD, which otherwise use the request host.
   * @example https://www.mysite.com
   */
  canonicalBaseUrl?: string;
  /**
   * @title Publisher
   * @description Emitted as the publisher of the blog posts in the JSON-LD.
   */
  publisher?: Publisher;
  /**
   * @title SEO defaults
   * @description Title/description templates for the post and topic pages.
   */
  seo?: BlogSeoDefaults;
}

export interface SiteConfig {
  /** Site title (e.g. "Blog — Engenharia, Performance, Design e Produto") */
  title: string;
  /** Short display name: the blog publisher's name, or the title before its dash */
  name: string;
  /** Short tagline / description */
  description: string;
  /** Absolute URL of the favicon / logo image */
  favicon: string;
  /** Publisher logo for JSON-LD; falls back to the favicon */
  logo: string;
  /** Canonical origin (no trailing slash), e.g. "https://blog.example.com" */
  canonicalBaseUrl?: string;
  noIndexing: boolean;
}

/** The SiteConfig for saved settings; without any, the defaults. */
export function getSiteConfig(settings?: SiteSettings | null, blog?: BlogSettings | null): SiteConfig {
  const raw = settings?.seo ?? {};
  const { publisher, canonicalBaseUrl } = blog ?? {};

  const title = raw.title ?? "Blog";
  const favicon = raw.favicon ?? "";

  return {
    title,
    name: publisher?.name || title.replace(/\s*[—–-].*/, "").trim() || "Blog",
    description: raw.description ?? "",
    favicon,
    logo: publisher?.logo || favicon,
    canonicalBaseUrl: canonicalBaseUrl?.replace(/\/+$/, "") || undefined,
    noIndexing: raw.noIndexing ?? false,
  };
}

/**
 * Request-derived context the listing sections receive, computed on the server
 * (src/blocks.server.ts). Serializable: it travels to the client as props.
 */
export interface SiteContext {
  /** Origin used for absolute URLs: the canonical base when configured. */
  origin: string;
  pathname: string;
  siteConfig: SiteConfig;
}
