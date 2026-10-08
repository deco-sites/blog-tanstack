import SeoComponent from "@decocms/apps-website/components/Seo";
import { getRecordsByPath } from "@decocms/apps-blog/core/records";
import type { Category } from "@decocms/apps-blog/types";
import { lastPathSegment } from "../../sdk/blog/loader";

export interface Props {
  title?: string;
  description?: string;
}

export async function loader(_props: Props, req: Request): Promise<Props> {
  const slug = lastPathSegment(req);
  const categories = getRecordsByPath<Category>("collections/blog/categories", "category");
  const category = categories.find((c) => c.slug === slug);
  const name = category?.name ?? slug;
  return {
    title: `${name} — Blog`,
    description: `Artigos sobre ${name} no Blog.`,
  };
}

export default function SeoBlogCategory({ title, description }: Props) {
  if (!title) return null;
  return <SeoComponent title={title} description={description} />;
}

export const seo = true;
export const sync = true;
