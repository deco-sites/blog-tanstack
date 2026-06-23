import type { Author, BlogPostPage } from "@decocms/apps/blog/types";
import SeoComponent from "@decocms/apps/website/components/Seo";
import { getSiteConfig, type SiteConfig } from "../../utils/site-config";

export interface Props {
  /** @description Blog post page data from blog/loaders/BlogPostPage.ts */
  jsonLD?: BlogPostPage | null;
}

export async function loader(
  props: Props,
  req: Request,
): Promise<Props & { siteConfig: SiteConfig }> {
  return { ...props, siteConfig: getSiteConfig() };
}

export default function SeoBlogPost(
  { jsonLD, siteConfig = getSiteConfig() }: Props & {
    // @ts-ignore injected by loader
    siteConfig?: SiteConfig;
  },
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
          content={`${post.date}T00:00:00+00:00`}
        />
      )}
      {post?.date && (
        <meta
          property="article:modified_time"
          content={`${post.date}T00:00:00+00:00`}
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
