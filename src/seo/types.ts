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
  /** schema.org nodes, each rendered as a <script type="application/ld+json"> in the head. */
  jsonLDs?: object[];
  /** The page form's own templates (`%s` is the title or description); they win over the site's. */
  titleTemplate?: string;
  descriptionTemplate?: string;
}

/** The site-wide SEO saved in the `site` block, as far as a page's SEO falls back to it. */
export interface SiteSeoDefaults {
  title?: string;
  description?: string;
  image?: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
}

/** A template that changes something: not empty, not just "%s". */
function effectiveTemplate(template: string | undefined) {
  if (!template || template.trim() === "" || template.trim() === "%s") return undefined;
  return template;
}

/**
 * The page's SEO with the site's defaults, the way v7 assembled it
 * (@decocms/tanstack 7.77.3, cmsRoute.ts buildPageSeo): a title, description
 * or image the page's SEO block leaves empty comes from the site's SEO, then
 * the page's title and description templates apply, else the site's.
 */
export function withSiteSeo(seo: PageSeo | undefined, site: SiteSeoDefaults | undefined): PageSeo {
  const { titleTemplate: pageTitleTemplate, descriptionTemplate: pageDescriptionTemplate, ...merged } = seo ?? {};
  if (!merged.title && site?.title) merged.title = site.title;
  if (!merged.description && site?.description) merged.description = site.description;
  if (!merged.image && site?.image) merged.image = site.image;
  const titleTemplate = effectiveTemplate(pageTitleTemplate) ?? effectiveTemplate(site?.titleTemplate);
  const descriptionTemplate = effectiveTemplate(pageDescriptionTemplate) ?? effectiveTemplate(site?.descriptionTemplate);
  if (titleTemplate && merged.title) merged.title = titleTemplate.replace("%s", merged.title);
  if (descriptionTemplate && merged.description) merged.description = descriptionTemplate.replace("%s", merged.description);
  return merged;
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
