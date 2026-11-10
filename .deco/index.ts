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
  // The built-in page, with its sections typed as descriptors (/next/built-in-blocks#change-a-built-in).
  page: (input: BlogPage) => input,

  "site-settings": siteSettings,
  "blog-settings": blogSettings,
  "site/apps/deco/blog.ts": blogSettings,

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
  "blog/sections/Seo/SeoBlogPost.tsx": seoBlogPost,
  "seo-blog-post-listing": seoBlogPostListing,
  "blog/sections/Seo/SeoBlogPostListing.tsx": seoBlogPostListing,
  "seo-blog-author": seoBlogAuthor,
  "site/sections/Seo/SeoBlogAuthor.tsx": seoBlogAuthor,

  // Blog data (loaders vendored from @decocms/apps)
  "blog-post-list": blogpostList,
  "blog/loaders/BlogpostList.ts": blogpostList,
  "site/loaders/BlogpostList.ts": blogpostList,
  "blog-post-listing": blogBlogpostListing,
  "blog/loaders/BlogpostListing.ts": blogBlogpostListing,
  "blog-post-page": blogBlogPostPage,
  "blog/loaders/BlogPostPage.ts": blogBlogPostPage,
  "blog-post": blogBlogpost,
  "blog/loaders/Blogpost.ts": blogBlogpost,
  "blog-author": blogAuthor,
  "blog/loaders/Author.ts": blogAuthor,
  "blog-category": blogCategory,
  "blog/loaders/Category.ts": blogCategory,

  // Post body blocks: this template's (v7: site/sections/Blog/Post/*)
  "post-heading": postHeading,
  "site/sections/Blog/Post/Heading.tsx": postHeading,
  "post-paragraph": postParagraph,
  "site/sections/Blog/Post/Paragraph.tsx": postParagraph,
  "post-quote": postQuote,
  "site/sections/Blog/Post/Quote.tsx": postQuote,
  "post-code": postCode,
  "site/sections/Blog/Post/Code.tsx": postCode,
  "post-list": postList,
  "site/sections/Blog/Post/List.tsx": postList,
  "post-checklist": postChecklist,
  "site/sections/Blog/Post/Checklist.tsx": postChecklist,
  "post-steps": postSteps,
  "site/sections/Blog/Post/Steps.tsx": postSteps,
  "post-callout": postCallout,
  "site/sections/Blog/Post/Callout.tsx": postCallout,
  "post-image": postImage,
  "site/sections/Blog/Post/BlockImage.tsx": postImage,
  "post-video": postVideo,
  "site/sections/Blog/Post/Video.tsx": postVideo,
  "post-divider": postDivider,
  "site/sections/Blog/Post/Divider.tsx": postDivider,
  "post-call-to-action": postCallToAction,
  "site/sections/Blog/Post/CallToAction.tsx": postCallToAction,
  "post-faq": postFaq,
  "site/sections/Blog/Post/Faq.tsx": postFaq,
  "post-custom-block": postCustomBlock,
  "site/sections/Blog/Post/CustomBlock.tsx": postCustomBlock,

  // Post body blocks: the blog app's defaults (v7: blog/sections/blocks/*)
  "post-default-image": postDefaultImage,
  "blog/sections/blocks/BlockImage.tsx": postDefaultImage,
  "post-default-callout": postDefaultCallout,
  "blog/sections/blocks/Callout.tsx": postDefaultCallout,
  "post-default-card-group": postDefaultCardGroup,
  "blog/sections/blocks/CardGroup.tsx": postDefaultCardGroup,
  "post-default-checklist": postDefaultChecklist,
  "blog/sections/blocks/Checklist.tsx": postDefaultChecklist,
  "post-default-code": postDefaultCode,
  "blog/sections/blocks/Code.tsx": postDefaultCode,
  "post-default-comparison": postDefaultComparison,
  "blog/sections/blocks/Comparison.tsx": postDefaultComparison,
  "post-default-cta": postDefaultCta,
  "blog/sections/blocks/Cta.tsx": postDefaultCta,
  "post-default-divider": postDefaultDivider,
  "blog/sections/blocks/Divider.tsx": postDefaultDivider,
  "post-default-heading": postDefaultHeading,
  "blog/sections/blocks/Heading.tsx": postDefaultHeading,
  "post-default-list": postDefaultList,
  "blog/sections/blocks/List.tsx": postDefaultList,
  "post-default-paragraph": postDefaultParagraph,
  "blog/sections/blocks/Paragraph.tsx": postDefaultParagraph,
  "post-default-quote": postDefaultQuote,
  "blog/sections/blocks/Quote.tsx": postDefaultQuote,
  "post-default-stat": postDefaultStat,
  "blog/sections/blocks/Stat.tsx": postDefaultStat,
  "post-default-stat-group": postDefaultStatGroup,
  "blog/sections/blocks/StatGroup.tsx": postDefaultStatGroup,
  "post-default-steps": postDefaultSteps,
  "blog/sections/blocks/Steps.tsx": postDefaultSteps,
  "post-default-table": postDefaultTable,
  "blog/sections/blocks/Table.tsx": postDefaultTable,
  "post-default-video": postDefaultVideo,
  "blog/sections/blocks/Video.tsx": postDefaultVideo,
} satisfies Blocks;
