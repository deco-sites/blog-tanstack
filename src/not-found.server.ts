import type { Match, Route } from "@decocms/blocks";
import { markDegraded } from "./request-state.server";
import { getRecordsByPath } from "./vendor/blog/core/records";

/**
 * Pages whose path template matches URLs that may name nothing: the blog post
 * page, "/:slug", matches every one-segment path. A URL whose slug names no
 * post renders that page (it shows "post not found") with a 404 status.
 *
 * Reads the posts collection the post page reads anyway (once per revision,
 * src/vendor/blog/core/records.ts), inside the page's request state. When it
 * can't be read, the answer is unknown: the page renders (its post section
 * fails on its own) and is marked degraded, so it is never cached.
 */
export async function namesNothing(match: Match<Route>): Promise<boolean> {
  if (match.kind !== "match" || match.entry.path !== "/:slug") return false;
  const slug = match.params.slug;
  try {
    const posts = await getRecordsByPath<{ slug?: string }>("blog/loaders/Blogpost.ts", "collections/blog/posts", "post");
    return !posts.some((post) => post.slug === slug);
  } catch (error) {
    console.error("[not-found] posts", error);
    markDegraded();
    return false;
  }
}
