import handlePosts from "@decocms/apps/blog/core/handlePosts";
import { getRecordsByPath } from "@decocms/apps/blog";
import type { BlogPost, SortBy } from "@decocms/apps/blog/types";

export interface Props {
  /**
   * @title Posts por página (ou total)
   * @default 50
   */
  count?: number;
  /**
   * @title Ordenação
   * @default "date_desc"
   */
  sortBy?: SortBy;
  /**
   * @title Filtrar por
   * @description "category" filtra pelo slug da categoria; "author" filtra pelo email do autor
   */
  filterBy?: "category" | "author";
  /**
   * @title Slug / Email para filtro
   * @description Slug da categoria ou email do autor, dependendo de filterBy
   */
  slug?: string;
}

/**
 * @title BlogpostList
 * @description Retorna uma lista de posts do blog como array. Suporta filtro por categoria ou autor.
 */
export default async function BlogpostList(
  props: Props,
  _req?: Request,
): Promise<BlogPost[] | null> {
  const { count = 50, sortBy = "date_desc", filterBy, slug } = props;

  const allPosts = getRecordsByPath<BlogPost>("collections/blog/posts", "post");

  let filtered = allPosts;

  if (slug && filterBy === "author") {
    filtered = allPosts.filter((p) =>
      (p.authors as Array<{ email: string }> | undefined)?.some(
        (a) => a.email === slug,
      )
    );
  } else if (slug && filterBy === "category") {
    filtered = allPosts.filter((p) =>
      p.categories?.some((c) => c.slug === slug)
    );
  }

  const handled = handlePosts(filtered, sortBy);
  if (!handled || handled.length === 0) return null;

  return handled.slice(0, count);
}
