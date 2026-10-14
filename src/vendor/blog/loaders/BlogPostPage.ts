// Vendored from @decocms/apps (blog/loaders/BlogPostPage.ts) by @decocms/blocks-migrate, then
// brought up to @decocms/apps-blog 7.77.3: the post's category path and a canonical under it, and
// a post that isn't live is never indexed. It's your code now.
import { ancestorsOf, indexCategories, withCategoryPath } from "../core/categoryTree";
import { getRecordsByPath } from "../core/records";
import { requestState } from "../../../request-state.server";
import { type BlogPost, type BlogPostPage, type Category, isLivePost } from "../types";

const COLLECTION_PATH = "collections/blog/posts";
const ACCESSOR = "post";
const CATEGORIES_PATH = "collections/blog/categories";
const CATEGORY_ACCESSOR = "category";

export interface Props {
	/** @description The post's slug. Without it, the page's route parameter named by "param". */
	slug?: string;
	/**
	 * @title Route parameter
	 * @description Used when "slug" is empty: the route parameter that holds the slug, e.g. "slug" in /:slug
	 * @default slug
	 */
	param?: string;
}

/**
 * @title BlogPostPage
 * @description Fetches a specific blog post page by its slug.
 */
export default async function BlogPostPageLoader(props: Props): Promise<BlogPostPage | null> {
	const { params, url } = requestState();
	const slug = props.slug ?? params[props.param ?? "slug"];
	const posts = await getRecordsByPath<BlogPost>("blog/loaders/Blogpost.ts", COLLECTION_PATH, ACCESSOR);

	const post = posts.find((p) => p?.slug === slug);

	if (!post) return null;

	// The breadcrumb and the canonical need the primary category's ancestor
	// chain. A broken categories collection must not take the post page down.
	let categories: Category[] = [];
	try {
		categories = await getRecordsByPath<Category>("blog/loaders/Category.ts", CATEGORIES_PATH, CATEGORY_ACCESSOR);
	} catch (error) {
		console.error("[blog/BlogPostPage] categories", error);
	}

	const primarySlug = post.categories?.[0]?.slug;
	const chain =
		typeof primarySlug === "string" && primarySlug ? ancestorsOf(primarySlug, indexCategories(categories)) : null;

	// Only a chain from the records names a canonical; a /:slug route has no
	// category segment, so withCategoryPath leaves it to the post's own URL.
	const canonical = chain
		? withCategoryPath(url, chain, {
				knownSlugs: new Set(categories.map((c) => c?.slug)),
				trailing: post.slug,
			})
		: null;

	return {
		"@type": "BlogPostPage",
		post,
		categories: chain ?? (post.categories?.[0] ? [post.categories[0]] : null),
		seo: {
			title: post?.seo?.title || post?.title,
			description: post?.seo?.description || post?.excerpt,
			canonical: post?.seo?.canonical || canonical || url.href,
			image: post?.seo?.image || post?.image,
			// A post that isn't live yet still renders (that page is its
			// preview), but is never indexed.
			noIndexing: post?.seo?.noIndexing || !isLivePost(post),
		},
	};
}
