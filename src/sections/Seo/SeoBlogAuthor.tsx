import SeoComponent from "@decocms/apps/website/components/Seo";
import { getRecordsByPath } from "@decocms/apps/blog";
import type { Author } from "@decocms/apps/blog/types";

export interface Props {
  title?: string;
  description?: string;
}

export async function loader(_props: Props, req: Request): Promise<Props> {
  const email = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
  const authors = getRecordsByPath<Author>("collections/blog/authors", "author");
  const author = authors.find((a) => a.email === email);
  const name = author?.name ?? email;
  return {
    title: `Posts de ${name} — Blog`,
    description: `Artigos escritos por ${name} no Blog.`,
  };
}

export default function SeoBlogAuthor({ title, description }: Props) {
  if (!title) return null;
  return <SeoComponent title={title} description={description} />;
}

export const seo = true;
export const sync = true;
