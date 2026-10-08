/**
 * Site identity used by the blog sections (names, logos, canonical origin),
 * read from the CMS:
 *
 *   .deco/blocks/site.json       → `seo` (title, description, favicon…)
 *   .deco/blocks/deco-blog.json  → blog app props (publisher, canonicalBaseUrl)
 *
 * Server-only: both sources are empty on the client. Call it from section
 * loaders and pass the result down as a prop.
 */
import { getSiteSeo } from "@decocms/blocks/cms";
import { getBlogConfig } from "@decocms/apps-blog/client";

export interface SiteConfig {
  /** Site title, e.g. "Blog — Engenharia, Performance, Design e Produto". */
  title: string;
  /** Short display name — blog publisher name, or the title before its dash. */
  name: string;
  description: string;
  /** Absolute URL of the favicon. */
  favicon: string;
  /** Publisher logo for JSON-LD — falls back to the favicon. */
  logo: string;
  /** Canonical origin (no trailing slash), e.g. "https://blog.example.com". */
  canonicalBaseUrl?: string;
  noIndexing: boolean;
}

export function getSiteConfig(): SiteConfig {
  const seo = getSiteSeo();
  const { publisher, canonicalBaseUrl } = getBlogConfig();

  const title = seo.title ?? "Blog";
  const favicon = seo.favicon ?? "";

  return {
    title,
    name: publisher?.name || title.replace(/\s*[—–-].*/, "").trim() || "Blog",
    description: seo.description ?? "",
    favicon,
    logo: publisher?.logo || favicon,
    canonicalBaseUrl: canonicalBaseUrl?.replace(/\/+$/, "") || undefined,
    noIndexing: seo.noIndexing ?? false,
  };
}

