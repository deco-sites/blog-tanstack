/**
 * schema.org JSON-LD for the listing pages that have no structured data from
 * their SEO block (home, topics index, authors, search).
 *
 * Post and topic pages get theirs from the @decocms/apps-blog SEO sections
 * (blog/sections/Seo/*) — don't emit JSON-LD for them here.
 *
 * Publisher data comes from `SiteConfig` — resolved by the section loader from
 * the blog app config — so server and client render the same.
 */
import { toOrganization } from "@decocms/apps-blog/utils/jsonLD";
import type { Author, BlogPost, Publisher } from "@decocms/apps-blog/types";
import type { SiteConfig } from "./siteConfig";

const LANGUAGE = "pt-BR";
const CONTEXT = "https://schema.org";

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

/** Serializes one or more JSON-LD nodes for a `<script type="application/ld+json">`. */
export function serializeJsonLd(data: object | object[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function toPublisher(siteConfig: SiteConfig, origin: string): Publisher {
  return {
    name: siteConfig.name,
    url: origin ? `${origin}/` : undefined,
    logo: siteConfig.logo || (origin ? `${origin}/favicon.svg` : undefined),
  };
}

export function breadcrumbList(entries: BreadcrumbEntry[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.url,
    })),
  };
}

/** Root breadcrumb entry (the blog home). */
export function homeCrumb(siteConfig: SiteConfig, origin: string): BreadcrumbEntry {
  return { name: siteConfig.name, url: origin ? `${origin}/` : "/" };
}

/** CollectionPage for listing pages (topics, authors, search…). */
export function collectionPageJsonLd({
  type = "CollectionPage",
  url,
  name,
  description,
  origin,
  breadcrumb,
  ...extra
}: {
  type?: "CollectionPage" | "SearchResultsPage";
  url: string;
  name: string;
  description?: string;
  origin: string;
  breadcrumb?: BreadcrumbEntry[];
  [key: string]: unknown;
}) {
  return {
    "@context": CONTEXT,
    "@type": type,
    "@id": url,
    url,
    name,
    description,
    inLanguage: LANGUAGE,
    isPartOf: { "@id": origin ? `${origin}/#website` : "/" },
    ...(breadcrumb ? { breadcrumb: breadcrumbList(breadcrumb) } : {}),
    ...extra,
  };
}

/** WebSite (with SearchAction), Organization and Blog — blog home only. */
export function homeJsonLd(
  posts: BlogPost[],
  origin: string,
  siteConfig: SiteConfig,
): object[] {
  const publisher = toPublisher(siteConfig, origin);
  return [
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: LANGUAGE,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${origin}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": CONTEXT,
      ...toOrganization(publisher),
      "@id": `${origin}/#organization`,
    },
    {
      "@context": CONTEXT,
      "@type": "Blog",
      "@id": `${origin}/#blog`,
      url: `${origin}/`,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: LANGUAGE,
      publisher: { "@id": `${origin}/#organization` },
      blogPost: posts.slice(0, 10).map((p, i) => ({
        "@type": "BlogPosting",
        "@id": `${origin}/${p.slug}`,
        position: i + 1,
        url: `${origin}/${p.slug}`,
        headline: p.title,
        description: p.excerpt ?? "",
        datePublished: p.date ?? undefined,
        image: p.image ?? undefined,
        inLanguage: LANGUAGE,
        author: ((p.authors as Author[] | undefined) ?? []).map((a) => ({
          "@type": "Person",
          name: a.name,
        })),
      })),
    },
  ];
}

/** Person node for an author listing. */
export function personJsonLd(author: Author, origin: string) {
  return {
    "@context": CONTEXT,
    "@type": "Person",
    name: author.name,
    url: `${origin}/authors/${author.email}`,
    image: author.avatar ?? undefined,
    jobTitle: author.jobTitle ?? undefined,
    worksFor: author.company
      ? { "@type": "Organization", name: author.company }
      : undefined,
  };
}
