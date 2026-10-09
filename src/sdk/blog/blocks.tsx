/**
 * Post content blocks — maps each `__resolveType` in `post.sections` to the
 * component that renders it.
 *
 * Two families coexist, with distinct resolveTypes:
 *
 *   default  `blog/sections/blocks/<Name>.tsx`
 *            Shipped by @decocms/apps-blog. Rendered with the app's own
 *            component, never a local copy.
 *
 *   custom   `site/sections/Blog/Post/<Name>.tsx`
 *            This template's blocks (src/sections/Blog/Post/*), styled with
 *            the blog's design system. Add a file there and register it below.
 *
 * Blocks are imported statically (instead of going through the section
 * registry) so they render synchronously during SSR, and so we can inject the
 * TOC anchor id.
 */
import type { ComponentType, ReactNode } from "react";

import DefaultBlockImage from "@decocms/apps-blog/sections/blocks/BlockImage";
import DefaultCallout from "@decocms/apps-blog/sections/blocks/Callout";
import DefaultCardGroup from "@decocms/apps-blog/sections/blocks/CardGroup";
import DefaultChecklist from "@decocms/apps-blog/sections/blocks/Checklist";
import DefaultCode from "@decocms/apps-blog/sections/blocks/Code";
import DefaultComparison from "@decocms/apps-blog/sections/blocks/Comparison";
import DefaultCta from "@decocms/apps-blog/sections/blocks/Cta";
import DefaultDivider from "@decocms/apps-blog/sections/blocks/Divider";
import DefaultHeading from "@decocms/apps-blog/sections/blocks/Heading";
import DefaultList from "@decocms/apps-blog/sections/blocks/List";
import DefaultParagraph from "@decocms/apps-blog/sections/blocks/Paragraph";
import DefaultQuote from "@decocms/apps-blog/sections/blocks/Quote";
import DefaultStat from "@decocms/apps-blog/sections/blocks/Stat";
import DefaultStatGroup from "@decocms/apps-blog/sections/blocks/StatGroup";
import DefaultSteps from "@decocms/apps-blog/sections/blocks/Steps";
import DefaultTable from "@decocms/apps-blog/sections/blocks/Table";
import DefaultVideo from "@decocms/apps-blog/sections/blocks/Video";

import BlockImage from "../../sections/Blog/Post/BlockImage";
import CallToAction from "../../sections/Blog/Post/CallToAction";
import Callout from "../../sections/Blog/Post/Callout";
import Checklist from "../../sections/Blog/Post/Checklist";
import Code from "../../sections/Blog/Post/Code";
import CustomBlock from "../../sections/Blog/Post/CustomBlock";
import Divider from "../../sections/Blog/Post/Divider";
import Faq from "../../sections/Blog/Post/Faq";
import Heading from "../../sections/Blog/Post/Heading";
import List from "../../sections/Blog/Post/List";
import Paragraph from "../../sections/Blog/Post/Paragraph";
import Quote from "../../sections/Blog/Post/Quote";
import Steps from "../../sections/Blog/Post/Steps";
import Video from "../../sections/Blog/Post/Video";

import { tocAnchorFor } from "./toc";

type BlockComponent = ComponentType<any>;

export const DEFAULT_BLOCK_PREFIX = "blog/sections/blocks/";
export const CUSTOM_BLOCK_PREFIX = "site/sections/Blog/Post/";

/** Blocks shipped by @decocms/apps-blog, keyed by name. */
export const DEFAULT_BLOCKS: Record<string, BlockComponent> = {
  BlockImage: DefaultBlockImage,
  Callout: DefaultCallout,
  CardGroup: DefaultCardGroup,
  Checklist: DefaultChecklist,
  Code: DefaultCode,
  Comparison: DefaultComparison,
  Cta: DefaultCta,
  Divider: DefaultDivider,
  Heading: DefaultHeading,
  List: DefaultList,
  Paragraph: DefaultParagraph,
  Quote: DefaultQuote,
  Stat: DefaultStat,
  StatGroup: DefaultStatGroup,
  Steps: DefaultSteps,
  Table: DefaultTable,
  Video: DefaultVideo,
};

/** This template's blocks (src/sections/Blog/Post), keyed by name. */
export const CUSTOM_BLOCKS: Record<string, BlockComponent> = {
  BlockImage,
  CallToAction,
  Callout,
  Checklist,
  Code,
  CustomBlock,
  Divider,
  Faq,
  Heading,
  List,
  Paragraph,
  Quote,
  Steps,
  Video,
};

export type BlockKind = "default" | "custom";

/** A content block, independent of the shape the CMS resolver produced. */
export interface ContentBlock {
  /** Block name, e.g. "Heading". */
  name: string;
  kind: BlockKind;
  props: Record<string, any>;
}

/**
 * Reads a raw `post.sections` entry. The resolver delivers blocks either as
 * `{ __resolveType, ...props }` (types not in the section registry) or, for
 * registered sections, as `{ Component: "<resolveType>", props }`.
 */
export function toContentBlock(raw: unknown): ContentBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as Record<string, unknown>;

  let resolveType: string | undefined;
  let props: Record<string, unknown>;
  if (typeof node.Component === "string") {
    resolveType = node.Component;
    props = (node.props as Record<string, unknown>) ?? {};
  } else {
    const { __resolveType, ...rest } = node;
    resolveType = __resolveType as string | undefined;
    props = rest;
  }
  if (!resolveType) return null;

  const key = resolveType.replace(/\.tsx?$/, "");
  if (key.startsWith(CUSTOM_BLOCK_PREFIX)) {
    return { name: key.slice(CUSTOM_BLOCK_PREFIX.length), kind: "custom", props };
  }
  if (key.startsWith(DEFAULT_BLOCK_PREFIX)) {
    return { name: key.slice(DEFAULT_BLOCK_PREFIX.length), kind: "default", props };
  }
  return null;
}

export function getBlockComponent(block: ContentBlock): BlockComponent | null {
  const registry = block.kind === "custom" ? CUSTOM_BLOCKS : DEFAULT_BLOCKS;
  return registry[block.name] ?? null;
}

/**
 * Renders a content block, attaching the TOC anchor when the block is a TOC
 * entry. Custom blocks receive it as their `id` prop; default blocks don't
 * accept one, so they get an anchored wrapper.
 */
export function renderBlock(block: ContentBlock, key: number): ReactNode {
  const Component = getBlockComponent(block);
  if (!Component) return null;

  const anchor = tocAnchorFor(block);
  if (!anchor) return <Component key={key} {...block.props} />;
  if (block.kind === "custom") {
    return <Component key={key} {...block.props} id={anchor} />;
  }
  return (
    <div key={key} id={anchor} className="scroll-mt-24">
      <Component {...block.props} />
    </div>
  );
}

/** Normalizes `post.sections` into renderable content blocks. */
export function getContentBlocks(sections: unknown[] | undefined): ContentBlock[] {
  return (sections ?? [])
    .map(toContentBlock)
    .filter((b): b is ContentBlock => b !== null);
}
