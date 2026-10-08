import type { Author, BlogPostPage } from "@decocms/apps-blog/types";
import SeoComponent from "@decocms/apps-website/components/Seo";
import { toIsoDate } from "../../sdk/blog/format";
import {
  getSiteConfig,
  type SiteConfig,
  toCanonicalUrl,
} from "../../sdk/blog/siteConfig";

export interface Props {
  /** @description Blog post page data from blog/loaders/BlogPostPage.ts */
  jsonLD?: BlogPostPage | null;
}

export async function loader(
  props: Props,
  _req: Request,
): Promise<
  Props & {
    siteConfig: SiteConfig;
    title?: string;
    description?: string;
    canonical?: string;
    image?: string;
    noIndexing?: boolean;
  }
> {
  const siteConfig = getSiteConfig();
  const { jsonLD } = props;
  // BlogPostPage builds the canonical from the request host — rebase it on the
  // blog app's canonicalBaseUrl (same rule as the app's own SEO section).
  const seo = jsonLD?.seo && {
    ...jsonLD.seo,
    canonical: jsonLD.seo.canonical &&
      toCanonicalUrl(jsonLD.seo.canonical, siteConfig),
  };
  return {
    ...props,
    jsonLD: jsonLD && seo ? { ...jsonLD, seo } : jsonLD,
    siteConfig,
    title: seo?.title,
    description: seo?.description,
    canonical: seo?.canonical,
    image: seo?.image,
    noIndexing: seo?.noIndexing,
  };
}

export default function SeoBlogPost(
  { jsonLD, siteConfig }: Props & { siteConfig: SiteConfig },
) {
  if (!jsonLD?.seo) return null;

  const { title, description, canonical, image, noIndexing } = jsonLD.seo;
  const post = jsonLD.post;
  const authors = (post?.authors as Author[] | undefined) ?? [];

  return (
    <>
      <SeoComponent
        title={title}
        description={description}
        canonical={canonical}
        image={image}
        noIndexing={noIndexing}
        type="article"
      />
      {/* Site name for Open Graph */}
      <meta property="og:site_name" content={siteConfig.name} />
      {/* og:image dimensions — boosts WhatsApp/Slack/LinkedIn unfurling */}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      {image && <meta property="og:image:alt" content={title ?? ""} />}
      {/* Article-specific Open Graph tags */}
      {post?.date && (
        <meta
          property="article:published_time"
          content={toIsoDate(post.date)}
        />
      )}
      {post?.date && (
        <meta
          property="article:modified_time"
          content={toIsoDate(post.date)}
        />
      )}
      {post?.categories?.[0] && (
        <meta property="article:section" content={post.categories[0].name} />
      )}
      {authors.map((a) => (
        <meta key={a.email} property="article:author" content={a.name} />
      ))}
      {/* Robots — GEO-grade: allow full snippet + large image preview */}
      {!noIndexing && (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}
    </>
  );
}

export const seo = true;
export const sync = true;
