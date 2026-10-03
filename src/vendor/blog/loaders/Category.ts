// Vendored from @decocms/apps (blog/loaders/Category.ts) by @decocms/blocks-migrate. It's your code now.
import type { Category } from "../types";

/**
 * @title Category
 * @description Defines a blog post category.
 */
const loader = ({ category }: { category: Category }): Category => category;

export default loader;
