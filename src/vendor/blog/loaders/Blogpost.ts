// Vendored from @decocms/apps (blog/loaders/Blogpost.ts) by @decocms/blocks-migrate. It's your code now.
import type { BlogPost } from "../types";

/**
 * @title Blogpost
 * @description Defines a blog post.
 */
export interface Props {
	post: BlogPost;
	/**
	 * @title Name
	 * @description The entry's name, as v7 saved it; the entry's id is taken from it.
	 */
	name?: string;
}

const loader = ({ post }: Props): BlogPost => post;

export default loader;
