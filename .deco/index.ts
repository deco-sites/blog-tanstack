// The block map (/next/blocks#the-block-map). Started by @decocms/blocks-migrate from the v7 site,
// then finished by hand. Each block has a short name plus an alias under every v7 name saved
// content stores (/next/renames-and-migrations#rename-a-type-with-an-alias).
import type { Blocks } from "@decocms/blocks";
import BlogpostList, { type Props as BlogpostListProps } from "../src/blog/BlogpostList";
import {
  type BlogAuthorsProps,
  type BlogHeaderProps,
  type BlogHomeProps,
  type BlogPostSectionProps,
  type BlogSearchProps,
  type BlogTopicsProps,
  blogAuthorsProps,
  blogHeaderProps,
  blogHomeProps,
  blogPostSectionProps,
  blogSearchProps,
  blogTopicsProps,
} from "../src/blocks.server";
import type { BlockDescriptor, BlogPage } from "../src/model";
import { seo, seoBlogAuthor, seoBlogCategory, seoBlogPost } from "../src/seo/blocks.server";
import type { Props as BlockImageProps } from "../src/sections/Blog/blocks/BlockImage";
import type { Props as CallToActionProps } from "../src/sections/Blog/blocks/CallToAction";
import type { Props as CalloutProps } from "../src/sections/Blog/blocks/Callout";
import type { Props as ChecklistProps } from "../src/sections/Blog/blocks/Checklist";
import type { Props as CodeProps } from "../src/sections/Blog/blocks/Code";
import type { Props as DividerProps } from "../src/sections/Blog/blocks/Divider";
import type { Props as FaqProps } from "../src/sections/Blog/blocks/Faq";
import type { Props as HeadingProps } from "../src/sections/Blog/blocks/Heading";
import type { Props as ListProps } from "../src/sections/Blog/blocks/List";
import type { Props as ParagraphProps } from "../src/sections/Blog/blocks/Paragraph";
import type { Props as QuoteProps } from "../src/sections/Blog/blocks/Quote";
import type { Props as StepsProps } from "../src/sections/Blog/blocks/Steps";
import type { Props as VideoProps } from "../src/sections/Blog/blocks/Video";
import type { SiteSettings } from "../src/utils/site-config";
import blogAuthor from "../src/vendor/blog/loaders/Author";
import blogBlogPostPage from "../src/vendor/blog/loaders/BlogPostPage";
import blogBlogpost from "../src/vendor/blog/loaders/Blogpost";
import blogCategory from "../src/vendor/blog/loaders/Category";

// Page sections: each computes its props on the server and returns a descriptor.
const blogHeader = async (props: BlogHeaderProps): Promise<BlockDescriptor> => ({
  component: "blog-header",
  props: await blogHeaderProps(props),
});
const blogHome = async (props: BlogHomeProps): Promise<BlockDescriptor> => ({
  component: "blog-home",
  props: await blogHomeProps(props),
});
const blogAuthors = async (props: BlogAuthorsProps): Promise<BlockDescriptor> => ({
  component: "blog-authors",
  props: await blogAuthorsProps(props),
});
const blogTopics = async (props: BlogTopicsProps): Promise<BlockDescriptor> => ({
  component: "blog-topics",
  props: await blogTopicsProps(props),
});
const blogSearch = async (props: BlogSearchProps): Promise<BlockDescriptor> => ({
  component: "blog-search",
  props: await blogSearchProps(props),
});
const blogPostSection = async (props: BlogPostSectionProps): Promise<BlockDescriptor> => ({
  component: "blog-post-section",
  props: await blogPostSectionProps(props),
});

/**
 * A block of a post's body. Posts are listed as saved, so their bodies reach
 * BlogPostSection as stored and it renders each by its v7 type name; these
 * entries give the types a schema and keep a resolved body in the same shape.
 */
const postBlock =
  <P extends object>(type: string) =>
  (props: P): P & { __resolveType: string } => ({ ...props, __resolveType: type });

const postHeading = postBlock<HeadingProps>("blog/sections/blocks/Heading.tsx");
const postParagraph = postBlock<ParagraphProps>("blog/sections/blocks/Paragraph.tsx");
const postQuote = postBlock<QuoteProps>("blog/sections/blocks/Quote.tsx");
const postCode = postBlock<CodeProps>("blog/sections/blocks/Code.tsx");
const postList = postBlock<ListProps>("blog/sections/blocks/List.tsx");
const postChecklist = postBlock<ChecklistProps>("blog/sections/blocks/Checklist.tsx");
const postSteps = postBlock<StepsProps>("blog/sections/blocks/Steps.tsx");
const postCallout = postBlock<CalloutProps>("blog/sections/blocks/Callout.tsx");
const postImage = postBlock<BlockImageProps>("blog/sections/blocks/BlockImage.tsx");
const postVideo = postBlock<VideoProps>("blog/sections/blocks/Video.tsx");
const postDivider = postBlock<DividerProps>("blog/sections/blocks/Divider.tsx");
const postCallToAction = postBlock<CallToActionProps>("blog/sections/blocks/CallToAction.tsx");
const postFaq = postBlock<FaqProps>("blog/sections/blocks/Faq.tsx");

/** Site-wide settings (the saved `site` block). */
const siteSettings = (props: SiteSettings) => props;

const blogpostList = (props: BlogpostListProps) => BlogpostList(props);

export default {
  // The built-in page, with its sections typed as descriptors (/next/built-in-blocks#change-a-built-in).
  page: (input: BlogPage) => input,

  "site-settings": siteSettings,

  // Page sections
  "blog-header": blogHeader,
  "site/sections/Blog/BlogHeader.tsx": blogHeader,
  "blog-home": blogHome,
  "site/sections/Blog/BlogHome.tsx": blogHome,
  "blog-authors": blogAuthors,
  "site/sections/Blog/BlogAuthors.tsx": blogAuthors,
  "blog-topics": blogTopics,
  "site/sections/Blog/BlogTopics.tsx": blogTopics,
  "blog-search": blogSearch,
  "site/sections/Blog/BlogSearch.tsx": blogSearch,
  "blog-post-section": blogPostSection,
  "site/sections/Blog/BlogPostSection.tsx": blogPostSection,

  // SEO, the page's `seo` field
  seo,
  "website/sections/Seo/SeoV2.tsx": seo,
  "seo-blog-post": seoBlogPost,
  "site/sections/Seo/SeoBlogPost.tsx": seoBlogPost,
  "seo-blog-author": seoBlogAuthor,
  "site/sections/Seo/SeoBlogAuthor.tsx": seoBlogAuthor,
  "seo-blog-category": seoBlogCategory,
  "site/sections/Seo/SeoBlogCategory.tsx": seoBlogCategory,

  // Blog data (loaders vendored from @decocms/apps)
  "blog-post-list": blogpostList,
  "blog/loaders/BlogpostList.ts": blogpostList,
  "blog-post-page": blogBlogPostPage,
  "blog/loaders/BlogPostPage.ts": blogBlogPostPage,
  "blog-post": blogBlogpost,
  "blog/loaders/Blogpost.ts": blogBlogpost,
  "blog-author": blogAuthor,
  "blog/loaders/Author.ts": blogAuthor,
  "blog-category": blogCategory,
  "blog/loaders/Category.ts": blogCategory,

  // Post body blocks
  "post-heading": postHeading,
  "blog/sections/blocks/Heading.tsx": postHeading,
  "post-paragraph": postParagraph,
  "blog/sections/blocks/Paragraph.tsx": postParagraph,
  "post-quote": postQuote,
  "blog/sections/blocks/Quote.tsx": postQuote,
  "post-code": postCode,
  "blog/sections/blocks/Code.tsx": postCode,
  "post-list": postList,
  "blog/sections/blocks/List.tsx": postList,
  "post-checklist": postChecklist,
  "blog/sections/blocks/Checklist.tsx": postChecklist,
  "post-steps": postSteps,
  "blog/sections/blocks/Steps.tsx": postSteps,
  "post-callout": postCallout,
  "blog/sections/blocks/Callout.tsx": postCallout,
  "post-image": postImage,
  "blog/sections/blocks/BlockImage.tsx": postImage,
  "post-video": postVideo,
  "blog/sections/blocks/Video.tsx": postVideo,
  "post-divider": postDivider,
  "blog/sections/blocks/Divider.tsx": postDivider,
  "post-call-to-action": postCallToAction,
  "blog/sections/blocks/CallToAction.tsx": postCallToAction,
  "post-faq": postFaq,
  "blog/sections/blocks/Faq.tsx": postFaq,
} satisfies Blocks;
