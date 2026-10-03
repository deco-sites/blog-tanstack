/**
 * A page's SEO, as the page's `seo` block returns it. Every field is optional:
 * the head falls back to the page name and the site defaults (see ./head.ts).
 */
export interface PageSeo {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noIndexing?: boolean;
  /** Open Graph type, e.g. "website" or "article". */
  type?: string;
}

/** Keeps only the SEO fields a block's output sets, the way v7 read them. */
export function pickSeo(props: Record<string, unknown>): PageSeo {
  const seo: PageSeo = {};
  if (props.title) seo.title = props.title as string;
  if (props.description) seo.description = props.description as string;
  if (props.canonical) seo.canonical = props.canonical as string;
  if (props.image) seo.image = props.image as string;
  if (props.noIndexing !== undefined) seo.noIndexing = props.noIndexing as boolean;
  if (props.type) seo.type = props.type as string;
  return seo;
}
