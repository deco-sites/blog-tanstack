// Vendored from @decocms/apps (blog/loaders/Blogpost.ts) by @decocms/blocks-migrate. It's your code now.
import type { BlogPost } from "../types";

/**
 * @title Blogpost
 * @description Defines a blog post.
 */
const loader = ({ post }: { post: BlogPost }): BlogPost => post;

export default loader;
