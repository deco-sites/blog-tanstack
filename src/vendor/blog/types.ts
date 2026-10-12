// Vendored from @decocms/apps (blog/types.ts) by @decocms/blocks-migrate, then brought up to
// @decocms/apps-blog 7.77.3 (what the v7 site moved to): author type/url, category parents, post
// status and scheduling, dateModified, the publisher. It's your code now.
import type { Props as BlockImageProps } from "../../sections/Blog/Post/BlockImage";
import type { Props as CallToActionProps } from "../../sections/Blog/Post/CallToAction";
import type { Props as CalloutProps } from "../../sections/Blog/Post/Callout";
import type { Props as ChecklistProps } from "../../sections/Blog/Post/Checklist";
import type { Props as CodeProps } from "../../sections/Blog/Post/Code";
import type { Props as DividerProps } from "../../sections/Blog/Post/Divider";
import type { Props as FaqProps } from "../../sections/Blog/Post/Faq";
import type { Props as HeadingProps } from "../../sections/Blog/Post/Heading";
import type { Props as ListProps } from "../../sections/Blog/Post/List";
import type { Props as ParagraphProps } from "../../sections/Blog/Post/Paragraph";
import type { Props as QuoteProps } from "../../sections/Blog/Post/Quote";
import type { Props as StepsProps } from "../../sections/Blog/Post/Steps";
import type { Props as VideoProps } from "../../sections/Blog/Post/Video";
import type { Props as CustomBlockProps } from "../../sections/Blog/Post/CustomBlock";
import type { Props as DefaultBlockImageProps } from "./sections/blocks/BlockImage";
import type { Props as DefaultCalloutProps } from "./sections/blocks/Callout";
import type { Props as DefaultCardGroupProps } from "./sections/blocks/CardGroup";
import type { Props as DefaultChecklistProps } from "./sections/blocks/Checklist";
import type { Props as DefaultCodeProps } from "./sections/blocks/Code";
import type { Props as DefaultComparisonProps } from "./sections/blocks/Comparison";
import type { Props as DefaultCtaProps } from "./sections/blocks/Cta";
import type { Props as DefaultHeadingProps } from "./sections/blocks/Heading";
import type { Props as DefaultListProps } from "./sections/blocks/List";
import type { Props as DefaultParagraphProps } from "./sections/blocks/Paragraph";
import type { Props as DefaultQuoteProps } from "./sections/blocks/Quote";
import type { Props as DefaultStatProps } from "./sections/blocks/Stat";
import type { Props as DefaultStatGroupProps } from "./sections/blocks/StatGroup";
import type { Props as DefaultStepsProps } from "./sections/blocks/Steps";
import type { Props as DefaultTableProps } from "./sections/blocks/Table";
import type { Props as DefaultVideoProps } from "./sections/blocks/Video";
import type { ImageWidget } from "../website/types";
import { scheduledTime } from "./utils/date";

/**
 * @titleBy name
 * @widget author
 */
export interface Author {
	name: string;
	email: string;
	/**
	 * @title Type
	 * @description Whether the author is a person or an organization. Emitted as the author type ("@type") in the JSON-LD. Defaults to Person.
	 * @default Person
	 */
	type?: "Person" | "Organization";
	avatar?: ImageWidget;
	jobTitle?: string;
	company?: string;
	url?: string;
}

export interface Category {
	name: string;
	slug: string;
	description?: string;
	/**
	 * @title Parent category
	 * @description Slug of the parent category. Leave empty for a root category.
	 */
	parentSlug?: string;
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
	/**
	 * @title Modified date
	 * @format date
	 * @description Date of the last relevant content update. Emitted as dateModified in the JSON-LD.
	 */
	dateModified?: string;
	slug: string;
	/**
	 * @title Status
	 * @description Publication status. Anything other than `published` is kept out of listings and never indexed. Posts with no status are treated as published.
	 */
	status?: PostStatus;
	/**
	 * @title Scheduled publication date
	 * @format datetime
	 * @description Instant this post goes live, honoured only while status is `scheduled`. Deliberately separate from the editorial date shown and sorted on: the two may diverge.
	 */
	scheduledDatetime?: string;
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
 * sdk/blog/blocks.tsx reads both shapes. `post-*` are this template's blocks,
 * `post-default-*` the blog app's (sdk/blog/blocks.tsx).
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
	| { component: "post-faq"; props: FaqProps }
	| { component: "post-custom-block"; props: CustomBlockProps }
	| { component: "post-default-image"; props: DefaultBlockImageProps }
	| { component: "post-default-callout"; props: DefaultCalloutProps }
	| { component: "post-default-card-group"; props: DefaultCardGroupProps }
	| { component: "post-default-checklist"; props: DefaultChecklistProps }
	| { component: "post-default-code"; props: DefaultCodeProps }
	| { component: "post-default-comparison"; props: DefaultComparisonProps }
	| { component: "post-default-cta"; props: DefaultCtaProps }
	| { component: "post-default-divider"; props: Record<string, never> }
	| { component: "post-default-heading"; props: DefaultHeadingProps }
	| { component: "post-default-list"; props: DefaultListProps }
	| { component: "post-default-paragraph"; props: DefaultParagraphProps }
	| { component: "post-default-quote"; props: DefaultQuoteProps }
	| { component: "post-default-stat"; props: DefaultStatProps }
	| { component: "post-default-stat-group"; props: DefaultStatGroupProps }
	| { component: "post-default-steps"; props: DefaultStepsProps }
	| { component: "post-default-table"; props: DefaultTableProps }
	| { component: "post-default-video"; props: DefaultVideoProps };

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

/** @titleBy name */
export interface Publisher {
	name: string;
	/** @title Logo */
	logo?: ImageWidget;
	url?: string;
}

export interface BlogPostPage {
	"@type": "BlogPostPage";
	post: BlogPost;
	/**
	 * @title Category path
	 * @description Ancestor chain of the post's primary category, root first.
	 */
	categories?: Category[] | null;
	seo?: Seo | null;
}

/**
 * Publication status of a post. `published` (or an absent value, for legacy
 * posts) renders on the live site; `scheduled` renders once its
 * `scheduledDatetime` has passed; every other value keeps the post out of
 * listings and out of the index.
 */
export type PostStatus = "draft" | "published" | "scheduled" | "archived" | "generating" | "awaiting_review";

/** A post is live when it has no status at all or is explicitly `published`. */
export const isPublishedStatus = (status?: string): boolean => !status || status === "published";

/**
 * Whether a post is live right now: no status, `published`, or `scheduled`
 * with its instant passed. An allowlist, so an unknown status fails closed.
 */
export const isLivePost = (
	post: { status?: string; scheduledDatetime?: string },
	now: number = Date.now(),
): boolean => {
	if (isPublishedStatus(post.status)) return true;
	if (post.status !== "scheduled") return false;
	const goLive = post.scheduledDatetime ? scheduledTime(post.scheduledDatetime) : null;
	return goLive !== null && goLive <= now;
};

export type SortBy = "date_desc" | "date_asc" | "title_asc" | "title_desc" | "view_asc" | "view_desc";

export interface PageInfo {
	nextPage?: string;
	previousPage?: string;
	currentPage: number;
	records?: number;
	recordPerPage?: number;
}

export interface BlogPostListingPage {
	posts: BlogPost[];
	/** @title Active category */
	category?: Category | null;
	/** @title Categories */
	categories?: Category[] | null;
	/**
	 * @title Category path
	 * @description Ancestor chain of the active category, root first.
	 */
	categoryPath?: Category[] | null;
	pageInfo: PageInfo;
	seo: Seo;
}
