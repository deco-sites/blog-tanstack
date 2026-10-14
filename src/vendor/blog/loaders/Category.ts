// Vendored from @decocms/apps (blog/loaders/Category.ts) by @decocms/blocks-migrate. It's your code now.
import type { Category } from "../types";

/**
 * @title Category
 * @description Defines a blog post category.
 */
export interface Props {
	category: Category;
	/**
	 * @title Name
	 * @description The entry's name, as v7 saved it; the entry's id is taken from it.
	 */
	name?: string;
}

const loader = ({ category }: Props): Category => category;

export default loader;
