// Vendored from @decocms/apps (blog/core/handlePosts.ts), then brought up to @decocms/apps-blog
// 7.77.3: posts that aren't live (status/scheduling) or have no slug are dropped, dates sort in
// UTC, and a list of category slugs matches any of them. View sorting is left out (no views
// backend here): `view_*` sorts by date. It's your code now.
import { isLivePost, type BlogPost, type SortBy } from "../types";
import { dateToTime } from "../utils/date";

const VALID_SORT_ORDERS = ["asc", "desc"];

/** Sorts posts by the given criteria (`view_*` falls back to the date). */
export const sortPosts = (blogPosts: BlogPost[], sortBy: SortBy): BlogPost[] => {
	const parts = sortBy.split("_");
	const sortMethod = (parts[0] in blogPosts[0] ? parts[0] : "date") as keyof BlogPost;
	const sortOrder = VALID_SORT_ORDERS.includes(parts[1]) ? parts[1] : "desc";

	return [...blogPosts].sort((a, b) => {
		if (!a[sortMethod] && !b[sortMethod]) return 0;
		if (!a[sortMethod]) return 1;
		if (!b[sortMethod]) return -1;

		// Non-date keys read inverted (`title_asc` yields Z-A): upstream's behaviour, kept.
		const comparison =
			sortMethod === "date"
				? dateToTime(b.date) - dateToTime(a.date)
				: (a[sortMethod]?.toString().localeCompare(b[sortMethod]?.toString() ?? "") ?? 0);

		return sortOrder === "desc" ? comparison : -comparison;
	});
};

/**
 * Filters posts by a category slug, or a list of slugs a post may belong to
 * any of. An omitted slug keeps every post; an empty list matches none.
 */
export const filterPostsByCategory = (posts: BlogPost[], slug?: string | string[]): BlogPost[] => {
	if (slug === undefined || slug === "") return posts;
	const slugs = new Set(Array.isArray(slug) ? slug : [slug]);
	return posts.filter(({ categories }) => categories?.some((c) => slugs.has(c?.slug)));
};

/** Filter posts whose slug is in the given list. */
export const filterPostsBySlugs = (posts: BlogPost[], postSlugs: string[]): BlogPost[] =>
	posts.filter(({ slug }) => postSlugs.includes(slug));

/** Filter posts matching a search term (title, excerpt, content). */
export const filterPostsByTerm = (posts: BlogPost[], term: string): BlogPost[] =>
	posts.filter(({ content, excerpt, title }) =>
		[content, excerpt, title].some((field) => field?.toLowerCase().includes(term.toLowerCase())),
	);

/** Filter posts whose categories overlap with the given slug array. */
export const filterRelatedPosts = (posts: BlogPost[], slugs: string[]): BlogPost[] =>
	filterPostsByCategory(posts, slugs);

/** Slice posts for pagination. */
export const slicePosts = (
	posts: BlogPost[],
	pageNumber: number,
	postsPerPage: number,
): BlogPost[] => {
	const startIndex = (pageNumber - 1) * postsPerPage;
	return posts.slice(startIndex, startIndex + postsPerPage);
};

/** Posts a listing can link to: a slug, and live (published, or scheduled and due). */
export const filterRoutablePosts = (posts: BlogPost[]): BlogPost[] =>
	posts.filter((post) => typeof post.slug === "string" && post.slug.trim() && isLivePost(post));

/**
 * Combined filter & sort pipeline (no slice).
 */
export default function handlePosts(
	posts: BlogPost[],
	sortBy: SortBy,
	slug?: string | string[],
	postSlugs?: string[],
	term?: string,
	excludePostSlug?: string,
): BlogPost[] | null {
	const routable = filterRoutablePosts(posts);
	const byCategory =
		postSlugs && postSlugs.length > 0
			? filterPostsBySlugs(routable, postSlugs)
			: filterPostsByCategory(routable, slug);
	const filtered = (term ? filterPostsByTerm(byCategory, term) : byCategory).filter(
		({ slug: s }) => s !== excludePostSlug,
	);

	if (filtered.length === 0) return null;

	return sortPosts(filtered, sortBy);
}
