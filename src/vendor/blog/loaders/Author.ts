// Vendored from @decocms/apps (blog/loaders/Author.ts) by @decocms/blocks-migrate. It's your code now.
import type { Author } from "../types";

/**
 * @title Author
 * @description Defines a blog post author.
 */
const loader = ({ author }: { author: Author }): Author => author;

export default loader;
