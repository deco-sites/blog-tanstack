import type { Client, Match } from "@decocms/blocks";
import type { StoredPage } from "./model";

/**
 * Pages whose path template matches URLs that may name nothing: the blog post
 * page, "/:slug", matches every one-segment path. A URL whose slug names no
 * post renders that page (it shows "post not found") with a 404 status.
 */
export async function namesNothing(match: Match<StoredPage>, c: Client): Promise<boolean> {
  if (match.kind !== "match" || match.entry.path !== "/:slug") return false;
  const slug = match.params.slug;
  const [posts, error] = await c.list<{ post?: { slug?: string } }>("blog/loaders/Blogpost.ts", {
    where: (entry) => entry.post?.slug === slug,
    limit: 1,
  });
  if (error) throw error;
  return posts.length === 0;
}
