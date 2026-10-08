/**
 * schema.org JSON-LD builders for the blog pages (SEO + GEO/AEO).
 *
 * Built on top of @decocms/apps-blog's `toBlogPosting` / `toOrganization`,
 * extended with the fields this template emits (speakable, isPartOf, author
 * pages…). Publisher data comes from `SiteConfig` — resolved by the section
 * loader from the blog app config — so server and client render the same.
 */
import { toBlogPosting, toOrganization } from "@decocms/apps-blog/utils/jsonLD";
import type { Author, BlogPost, Publisher } from "@decocms/apps-blog/types";
import type { SiteConfig } from "./siteConfig";
import { toIsoDate } from "./format";

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

/** BlogPosting + BreadcrumbList (Blog › Topic › Post) for a post page. */
export function postJsonLd(
  post: BlogPost & { sections?: unknown[] },
  canonicalUrl: string,
  siteConfig: SiteConfig,
): object[] {
  const origin = URL.canParse(canonicalUrl) ? new URL(canonicalUrl).origin : "";
  const publisher = toPublisher(siteConfig, origin);
  const authors = (post.authors as Author[] | undefined) ?? [];
  const categories = post.categories?.map((c) => c.name).join(", ") || undefined;
  const firstCategory = post.categories?.[0];

  const blogPosting = {
    "@context": CONTEXT,
    ...toBlogPosting(post, canonicalUrl, publisher),
    "@id": canonicalUrl,
    image: post.image
      ? { "@type": "ImageObject", url: post.image, description: post.alt ?? post.title }
      : undefined,
    datePublished: post.date ? toIsoDate(post.date) : undefined,
    dateModified: post.dateModified
      ? toIsoDate(post.dateModified)
      : post.date
      ? toIsoDate(post.date)
      : undefined,
    abstract: post.excerpt || undefined,
    inLanguage: LANGUAGE,
    articleSection: categories,
    keywords: categories,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [
        ".post-excerpt",
        "[data-post-content] h2",
        "[data-post-content] p:first-of-type",
      ],
    },
    author: authors.map((a) => ({
      "@type": "Person",
      name: a.name,
      jobTitle: a.jobTitle ?? undefined,
      image: a.avatar ?? undefined,
      url: a.email ? `${origin}/authors/${a.email}` : undefined,
    })),
    publisher: {
      ...toOrganization(publisher),
      "@id": origin ? `${origin}/#organization` : undefined,
    },
    isPartOf: {
      "@type": "Blog",
      "@id": origin ? `${origin}/#blog` : undefined,
      url: origin ? `${origin}/` : "/",
      name: siteConfig.name,
    },
  };

  const breadcrumb = {
    "@context": CONTEXT,
    ...breadcrumbList([
      homeCrumb(siteConfig, origin),
      ...(firstCategory
        ? [{ name: firstCategory.name, url: `${origin}/topics/${firstCategory.slug}` }]
        : []),
      { name: post.title, url: canonicalUrl },
    ]),
  };

  return [blogPosting, breadcrumb];
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
