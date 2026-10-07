/**
 * Site configuration: the `seo` settings saved in .deco/blocks/site.json (a
 * `site-settings` block), reduced to what the blog's JSON-LD, SEO and GEO
 * markup needs. Block functions resolve the saved block on the server and pass
 * the result to sections as their `siteConfig` prop.
 */

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

export interface SiteConfig {
  /** Site title (e.g. "Blog — Engenharia, Performance, Design e Produto") */
  title: string;
  /** Short tagline / description */
  description: string;
  /** Absolute URL of the favicon / logo image */
  favicon: string;
  /** Short display name derived from title (before the first em-dash) */
  name: string;
  noIndexing: boolean;
}

/** The SiteConfig for saved settings; without any, the defaults. */
export function getSiteConfig(settings?: SiteSettings | null): SiteConfig {
  const raw = settings?.seo ?? {};

  const title = raw.title ?? "Blog";
  const name = title.replace(/\s*[—–-].*/, "").trim() || "Blog";

  return {
    title,
    name,
    description: raw.description ?? "",
    favicon: raw.favicon ?? "",
    noIndexing: raw.noIndexing ?? false,
  };
}
