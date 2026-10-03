// Vendored from @decocms/apps (blog/loaders/BlogPostPage.ts) by @decocms/blocks-migrate. It's your code now.
import { getRecordsByPath } from "../core/records";
import { requestState } from "../../../request-state.server";
import type { BlogPost, BlogPostPage } from "../types";

const COLLECTION_PATH = "collections/blog/posts";
const ACCESSOR = "post";

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
	const { params } = requestState();
	const slug = props.slug ?? params[props.param ?? "slug"];
	const posts = await getRecordsByPath<BlogPost>("blog/loaders/Blogpost.ts", COLLECTION_PATH, ACCESSOR);

	const url = requestState().url;
	const post = posts.find((p) => p?.slug === slug);

	if (!post) return null;

	return {
		"@type": "BlogPostPage",
		post,
		seo: {
			title: post?.seo?.title || post?.title,
			description: post?.seo?.description || post?.excerpt,
			canonical: post?.seo?.canonical || url.href,
			image: post?.seo?.image || post?.image,
			noIndexing: post?.seo?.noIndexing || false,
		},
	};
}
