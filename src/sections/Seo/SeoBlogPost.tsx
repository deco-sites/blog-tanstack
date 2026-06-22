import type { BlogPostPage } from "@decocms/apps/blog/types";
import SeoComponent from "@decocms/apps/website/components/Seo";

export interface Props {
  /** @description Blog post page data from blog/loaders/BlogPostPage.ts */
  jsonLD?: BlogPostPage | null;
}

export default function SeoBlogPost({ jsonLD }: Props) {
  if (!jsonLD?.seo) return null;

  const { title, description, canonical, image, noIndexing } = jsonLD.seo;

  return (
    <SeoComponent
      title={title}
      description={description}
      canonical={canonical}
      image={image}
      noIndexing={noIndexing}
      type="article"
    />
  );
}

export const seo = true;
export const sync = true;
