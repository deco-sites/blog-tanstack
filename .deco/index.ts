// The block map (/next/blocks#the-block-map). Started by @decocms/blocks-migrate from the v7 site,
// then finished by hand. Each block is registered under the v7 names saved content stores, and only
// those: two keys bound to one function are two types in Studio's pickers (`deco schema` folds only
// the SDK's own legacy aliases), so a short name next to the v7 one listed every block twice. The
// short names (`blog-header`, `post-heading`, ...) stay the descriptors' component names.
// `site-settings` and `blog-settings` are the types the one-time content migration gave the v7 app
// blocks `site` and `deco-blog` (apps are code now); `deco-blog` keeps its v7 name as an alias.
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
import type { BlockDescriptor } from "../src/model";
import { seo, seoBlogAuthor, seoBlogPost, seoBlogPostListing } from "../src/seo/blocks.server";
import type { BlogSettings, SiteSettings } from "../src/utils/site-config";
import type { PostBodyBlock } from "../src/vendor/blog/types";
import blogAuthor from "../src/vendor/blog/loaders/Author";
import blogBlogPostPage from "../src/vendor/blog/loaders/BlogPostPage";
import blogBlogpost from "../src/vendor/blog/loaders/Blogpost";
import blogBlogpostListing from "../src/vendor/blog/loaders/BlogpostListing";
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
 * The blocks of a post's body: sections, as on v7, so a post's section list
 * (BlogPost.sections) offers them. Each returns its descriptor. `post-*` are
 * this template's blocks, `post-default-*` the blog app's (src/sdk/blog/blocks.tsx).
 */
type PostBody<C extends PostBodyBlock["component"]> = Extract<PostBodyBlock, { component: C }>;
const postBlock =
  <C extends PostBodyBlock["component"]>(component: C) =>
  (props: PostBody<C>["props"]) =>
    ({ component, props }) as PostBody<C>;

const postHeading = postBlock("post-heading");
const postParagraph = postBlock("post-paragraph");
const postQuote = postBlock("post-quote");
const postCode = postBlock("post-code");
const postList = postBlock("post-list");
const postChecklist = postBlock("post-checklist");
const postSteps = postBlock("post-steps");
const postCallout = postBlock("post-callout");
const postImage = postBlock("post-image");
const postVideo = postBlock("post-video");
const postDivider = postBlock("post-divider");
const postCallToAction = postBlock("post-call-to-action");
const postFaq = postBlock("post-faq");
const postCustomBlock = postBlock("post-custom-block");

const postDefaultImage = postBlock("post-default-image");
const postDefaultCallout = postBlock("post-default-callout");
const postDefaultCardGroup = postBlock("post-default-card-group");
const postDefaultChecklist = postBlock("post-default-checklist");
const postDefaultCode = postBlock("post-default-code");
const postDefaultComparison = postBlock("post-default-comparison");
const postDefaultCta = postBlock("post-default-cta");
const postDefaultDivider = postBlock("post-default-divider");
const postDefaultHeading = postBlock("post-default-heading");
const postDefaultList = postBlock("post-default-list");
const postDefaultParagraph = postBlock("post-default-paragraph");
const postDefaultQuote = postBlock("post-default-quote");
const postDefaultStat = postBlock("post-default-stat");
const postDefaultStatGroup = postBlock("post-default-stat-group");
const postDefaultSteps = postBlock("post-default-steps");
const postDefaultTable = postBlock("post-default-table");
const postDefaultVideo = postBlock("post-default-video");

/** Site-wide settings (the saved `site` block). */
const siteSettings = (props: SiteSettings) => props;

/** The blog's routes, canonical origin, publisher and SEO templates (the saved `deco-blog` block). */
const blogSettings = (props: BlogSettings) => props;

const blogpostList = (props: BlogpostListProps) => BlogpostList(props);

export default {
  "site-settings": siteSettings,
  "blog-settings": blogSettings,
  "site/apps/deco/blog.ts": blogSettings,

  // Page sections
  "site/sections/Blog/BlogHeader.tsx": blogHeader,
  "site/sections/Blog/BlogHome.tsx": blogHome,
  "site/sections/Blog/BlogAuthors.tsx": blogAuthors,
  "site/sections/Blog/BlogTopics.tsx": blogTopics,
  "site/sections/Blog/BlogSearch.tsx": blogSearch,
  "site/sections/Blog/BlogPostSection.tsx": blogPostSection,

  // SEO, the page's `seo` field
  "website/sections/Seo/SeoV2.tsx": seo,
  "site/sections/Seo/SeoBlogPost.tsx": seoBlogPost,
  "blog/sections/Seo/SeoBlogPost.tsx": seoBlogPost,
  "blog/sections/Seo/SeoBlogPostListing.tsx": seoBlogPostListing,
  "site/sections/Seo/SeoBlogAuthor.tsx": seoBlogAuthor,

  // Blog data (loaders vendored from @decocms/apps)
  "blog/loaders/BlogpostList.ts": blogpostList,
  "site/loaders/BlogpostList.ts": blogpostList,
  "blog/loaders/BlogpostListing.ts": blogBlogpostListing,
  "blog/loaders/BlogPostPage.ts": blogBlogPostPage,
  "blog/loaders/Blogpost.ts": blogBlogpost,
  "blog/loaders/Author.ts": blogAuthor,
  "blog/loaders/Category.ts": blogCategory,

  // Post body blocks: this template's (v7: site/sections/Blog/Post/*)
  "site/sections/Blog/Post/Heading.tsx": postHeading,
  "site/sections/Blog/Post/Paragraph.tsx": postParagraph,
  "site/sections/Blog/Post/Quote.tsx": postQuote,
  "site/sections/Blog/Post/Code.tsx": postCode,
  "site/sections/Blog/Post/List.tsx": postList,
  "site/sections/Blog/Post/Checklist.tsx": postChecklist,
  "site/sections/Blog/Post/Steps.tsx": postSteps,
  "site/sections/Blog/Post/Callout.tsx": postCallout,
  "site/sections/Blog/Post/BlockImage.tsx": postImage,
  "site/sections/Blog/Post/Video.tsx": postVideo,
  "site/sections/Blog/Post/Divider.tsx": postDivider,
  "site/sections/Blog/Post/CallToAction.tsx": postCallToAction,
  "site/sections/Blog/Post/Faq.tsx": postFaq,
  "site/sections/Blog/Post/CustomBlock.tsx": postCustomBlock,

  // Post body blocks: the blog app's defaults (v7: blog/sections/blocks/*)
  "blog/sections/blocks/BlockImage.tsx": postDefaultImage,
  "blog/sections/blocks/Callout.tsx": postDefaultCallout,
  "blog/sections/blocks/CardGroup.tsx": postDefaultCardGroup,
  "blog/sections/blocks/Checklist.tsx": postDefaultChecklist,
  "blog/sections/blocks/Code.tsx": postDefaultCode,
  "blog/sections/blocks/Comparison.tsx": postDefaultComparison,
  "blog/sections/blocks/Cta.tsx": postDefaultCta,
  "blog/sections/blocks/Divider.tsx": postDefaultDivider,
  "blog/sections/blocks/Heading.tsx": postDefaultHeading,
  "blog/sections/blocks/List.tsx": postDefaultList,
  "blog/sections/blocks/Paragraph.tsx": postDefaultParagraph,
  "blog/sections/blocks/Quote.tsx": postDefaultQuote,
  "blog/sections/blocks/Stat.tsx": postDefaultStat,
  "blog/sections/blocks/StatGroup.tsx": postDefaultStatGroup,
  "blog/sections/blocks/Steps.tsx": postDefaultSteps,
  "blog/sections/blocks/Table.tsx": postDefaultTable,
  "blog/sections/blocks/Video.tsx": postDefaultVideo,
} satisfies Blocks;
