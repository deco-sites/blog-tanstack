// Vendored from @decocms/apps (blog/loaders/Author.ts) by @decocms/blocks-migrate. It's your code now.
import type { Author } from "../types";

/**
 * @title Author
 * @description Defines a blog post author.
 */
export interface Props {
	author: Author;
	/**
	 * @title Name
	 * @description The entry's name, as v7 saved it; the entry's id is taken from it.
	 */
	name?: string;
}

const loader = ({ author }: Props): Author => author;

export default loader;
