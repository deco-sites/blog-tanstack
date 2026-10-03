// Vendored from @decocms/apps (blog/types.ts) by @decocms/blocks-migrate. It's your code now.
import type { Props as BlockImageProps } from "../../sections/Blog/blocks/BlockImage";
import type { Props as CallToActionProps } from "../../sections/Blog/blocks/CallToAction";
import type { Props as CalloutProps } from "../../sections/Blog/blocks/Callout";
import type { Props as ChecklistProps } from "../../sections/Blog/blocks/Checklist";
import type { Props as CodeProps } from "../../sections/Blog/blocks/Code";
import type { Props as DividerProps } from "../../sections/Blog/blocks/Divider";
import type { Props as FaqProps } from "../../sections/Blog/blocks/Faq";
import type { Props as HeadingProps } from "../../sections/Blog/blocks/Heading";
import type { Props as ListProps } from "../../sections/Blog/blocks/List";
import type { Props as ParagraphProps } from "../../sections/Blog/blocks/Paragraph";
import type { Props as QuoteProps } from "../../sections/Blog/blocks/Quote";
import type { Props as StepsProps } from "../../sections/Blog/blocks/Steps";
import type { Props as VideoProps } from "../../sections/Blog/blocks/Video";
import type { ImageWidget } from "../website/types";

/**
 * @titleBy name
 * @widget author
 */
export interface Author {
	name: string;
	email: string;
	avatar?: ImageWidget;
	jobTitle?: string;
	company?: string;
}

export interface Category {
	name: string;
	slug: string;
	description?: string;
}

export interface BlogPost {
	title: string;
	excerpt: string;
	/**
	 * @title Main image
	 */
	image?: ImageWidget;
	/**
	 * @title Alt text for the image
	 */
	alt?: string;
	/**
	 * @widget blog
	 * @collection authors
	 */
	authors?: Author[];
	/**
	 * @widget blog
	 * @collection categories
	 */
	categories?: Category[];
	/**
	 * @format date
	 */
	date: string;
	slug: string;
	/**
	 * @title Post Content
	 * @format rich-text
	 */
	content?: string;
	/**
	 * @title Sections
	 * @label hidden
	 * @changeable true
	 */
	sections?: PostBodyBlock[];
	/**
	 * @title SEO
	 */
	seo?: Seo;
	/**
	 * @title ReadTime in minutes
	 */
	readTime?: number;
	/**
	 * @title Extra Props
	 */
	extraProps?: ExtraProps[];
	id?: string;
}

/**
 * A block of a post's body, as the `post-*` sections of .deco/index.ts return
 * it: a descriptor (/next/rendering). Typing `sections` with it makes the site
 * editor offer the sections in a post, as v7 did. Posts are listed as saved,
 * so a body usually arrives as stored instead (`{ __resolveType, ...props }`);
 * sections/Blog/blocks/body.tsx reads both shapes.
 */
export type PostBodyBlock =
	| { component: "post-heading"; props: HeadingProps }
	| { component: "post-paragraph"; props: ParagraphProps }
	| { component: "post-quote"; props: QuoteProps }
	| { component: "post-code"; props: CodeProps }
	| { component: "post-list"; props: ListProps }
	| { component: "post-checklist"; props: ChecklistProps }
	| { component: "post-steps"; props: StepsProps }
	| { component: "post-callout"; props: CalloutProps }
	| { component: "post-image"; props: BlockImageProps }
	| { component: "post-video"; props: VideoProps }
	| { component: "post-divider"; props: DividerProps }
	| { component: "post-call-to-action"; props: CallToActionProps }
	| { component: "post-faq"; props: FaqProps };

export interface ExtraProps {
	key: string;
	value: string;
}

export interface Seo {
	title?: string;
	description?: string;
	image?: ImageWidget;
	canonical?: string;
	noIndexing?: boolean;
}

export interface BlogPostPage {
	"@type": "BlogPostPage";
	post: BlogPost;
	seo?: Seo | null;
}

export type SortBy = "date_desc" | "date_asc" | "title_asc" | "title_desc";

export interface PageInfo {
	nextPage?: string;
	previousPage?: string;
	currentPage: number;
	records?: number;
	recordPerPage?: number;
}

export interface BlogPostListingPage {
	posts: BlogPost[];
	pageInfo: PageInfo;
	seo: Seo;
}
