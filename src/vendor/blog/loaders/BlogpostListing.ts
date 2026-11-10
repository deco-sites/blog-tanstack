// Vendored from @decocms/apps-blog 7.77.3 (loaders/BlogpostListing.ts): what the v7 site's topic
// page SEO (blog/sections/Seo/SeoBlogPostListing.tsx) reads. It's your code now.
import { ancestorsOf, descendantSlugs, indexCategories, withCategoryPath } from "../core/categoryTree";
import handlePosts, { slicePosts } from "../core/handlePosts";
import { getRecordsByPath } from "../core/records";
import { requestState } from "../../../request-state.server";
import type { BlogPost, BlogPostListingPage, Category, PageInfo, SortBy } from "../types";

const COLLECTION_PATH = "collections/blog/posts";
const ACCESSOR = "post";
const CATEGORIES_PATH = "collections/blog/categories";
const CATEGORY_ACCESSOR = "category";

export interface Props {
	/**
	 * @title Category Slug
	 * @description Filter by a category slug. May be a full path ("parent/child"); posts of every subcategory below the last segment are included. Without it, the page's route parameter named by "param".
	 */
	slug?: string;
	/**
	 * @title Route parameter
	 * @description Used when "slug" is empty: the route parameter that holds the category slug, e.g. "slug" in /topics/:slug
	 */
	param?: string;
	/**
	 * @title Items per page
	 * @description Number of posts per page to display.
	 */
	count?: number;
	/**
	 * @title Page query parameter
	 * @description The current page number. Defaults to 1.
	 */
	page?: number;
	/**
	 * @title Page sorting parameter
	 * @description The sorting option. Default is "date_desc"
	 */
	sortBy?: SortBy;
	/**
	 * @description Overrides the query term at url
	 */
	query?: string;
}

/** Categories with a usable name and slug, alphabetically. */
const loadCategories = async (): Promise<Category[]> =>
	(await getRecordsByPath<Category>("blog/loaders/Category.ts", CATEGORIES_PATH, CATEGORY_ACCESSOR))
		.filter(
			(c) => typeof c?.name === "string" && c.name.length > 0 && typeof c?.slug === "string" && c.slug.length > 0,
		)
		.sort((a, b) => a.name.localeCompare(b.name));

/**
 * @title BlogPostListing
 * @description Retrieves a paginated listing page of blog posts.
 */
export default async function BlogPostListing(props: Props): Promise<BlogPostListingPage | null> {
	const { url, params: routeParams } = requestState();
	const { page, count, sortBy, query } = props;
	const slug = props.slug ?? (props.param ? routeParams[props.param] : undefined);
	const params = url.searchParams;
	const postsPerPage = Number(count ?? params.get("count") ?? 12);
	const pageNumber = Number(page ?? params.get("page") ?? 1);
	const pageSort = sortBy ?? (params.get("sortBy") as SortBy) ?? "date_desc";
	const term = query ?? params.get("q") ?? undefined;

	try {
		const posts = await getRecordsByPath<BlogPost>("blog/loaders/Blogpost.ts", COLLECTION_PATH, ACCESSOR);

		let categories: Category[] | null = null;
		try {
			categories = await loadCategories();
		} catch (error) {
			console.error("[blog/BlogpostListing] categories", error);
		}

		// The slug carries the whole category path ("pai/filho") when the site
		// routes the listing as a catch-all; only the leaf names the category.
		const requestedSegments = (slug ?? "").split("/").filter(Boolean);
		const leafSlug = requestedSegments[requestedSegments.length - 1];

		const index = indexCategories(categories);
		const chain = leafSlug ? ancestorsOf(leafSlug, index) : null;

		// A parent lists its own posts plus every descendant's.
		const categorySlugs = leafSlug ? descendantSlugs(leafSlug, categories) : undefined;

		const handledPosts = handlePosts(posts, pageSort, categorySlugs, undefined, term);

		if (!handledPosts) return null;

		const slicedPosts = slicePosts(handledPosts, pageNumber, postsPerPage);
		if (slicedPosts.length === 0) return null;

		let category: Category | null = null;
		if (leafSlug) {
			// Prefer the category record; fall back to the copy embedded in a post.
			category = index.get(leafSlug) ?? slicedPosts[0]?.categories?.find((c) => c?.slug === leafSlug) ?? null;
		}

		// Reached through a stale or wrong path, the page still renders and
		// points at the one canonical URL.
		const canonical = chain ? withCategoryPath(url, chain, { requested: requestedSegments }) : null;

		return {
			posts: slicedPosts,
			category,
			categories,
			categoryPath: chain ?? (category ? [category] : null),
			pageInfo: toPageInfo(handledPosts, postsPerPage, pageNumber, params),
			seo: {
				title: category?.name ?? "",
				description: category?.description,
				canonical: canonical ?? new URL(url.pathname, url.origin).href,
			},
		};
	} catch (error) {
		console.error("[blog/BlogpostListing]", error);
		return null;
	}
}

function toPageInfo(posts: BlogPost[], postsPerPage: number, pageNumber: number, params: URLSearchParams): PageInfo {
	const totalPosts = posts.length;
	const totalPages = Math.ceil(totalPosts / postsPerPage);
	const hasNextPage = totalPages > pageNumber;
	const hasPrevPage = pageNumber > 1;
	const nextPage = new URLSearchParams(params);
	const previousPage = new URLSearchParams(params);

	if (hasNextPage) nextPage.set("page", (pageNumber + 1).toString());
	if (hasPrevPage) previousPage.set("page", (pageNumber - 1).toString());

	return {
		nextPage: hasNextPage ? `?${nextPage}` : undefined,
		previousPage: hasPrevPage ? `?${previousPage}` : undefined,
		currentPage: pageNumber,
		records: totalPosts,
		recordPerPage: postsPerPage,
	};
}
