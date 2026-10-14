/**
 * Post content blocks: maps each block in `post.sections` to the component
 * that renders it.
 *
 * Two families coexist, as on the v7 site:
 *
 *   default  `blog/sections/blocks/<Name>.tsx` in saved content, `post-default-*` in the block map.
 *            The blog app's own components (vendored from @decocms/apps-blog
 *            into src/vendor/blog/sections/blocks), never a local copy.
 *
 *   custom   `site/sections/Blog/Post/<Name>.tsx` in saved content, `post-*` in the block map.
 *            This template's blocks (src/sections/Blog/Post/*), styled with
 *            the blog's design system. Add a file there, register it below and
 *            in .deco/index.ts.
 *
 * Each `post-*` block of the block map returns a descriptor
 * (`{ component: "post-heading", props }`), so the site editor offers them in
 * a post's section list. Posts are listed as saved, though, so a body usually
 * reaches BlogPostSection as stored: `{ __resolveType, ...props }`, under the
 * short name or a v7 one. toContentBlock reads both shapes.
 */
import type { ComponentType, ReactNode } from "react";

import DefaultBlockImage from "../../vendor/blog/sections/blocks/BlockImage";
import DefaultCallout from "../../vendor/blog/sections/blocks/Callout";
import DefaultCardGroup from "../../vendor/blog/sections/blocks/CardGroup";
import DefaultChecklist from "../../vendor/blog/sections/blocks/Checklist";
import DefaultCode from "../../vendor/blog/sections/blocks/Code";
import DefaultComparison from "../../vendor/blog/sections/blocks/Comparison";
import DefaultCta from "../../vendor/blog/sections/blocks/Cta";
import DefaultDivider from "../../vendor/blog/sections/blocks/Divider";
import DefaultHeading from "../../vendor/blog/sections/blocks/Heading";
import DefaultList from "../../vendor/blog/sections/blocks/List";
import DefaultParagraph from "../../vendor/blog/sections/blocks/Paragraph";
import DefaultQuote from "../../vendor/blog/sections/blocks/Quote";
import DefaultStat from "../../vendor/blog/sections/blocks/Stat";
import DefaultStatGroup from "../../vendor/blog/sections/blocks/StatGroup";
import DefaultSteps from "../../vendor/blog/sections/blocks/Steps";
import DefaultTable from "../../vendor/blog/sections/blocks/Table";
import DefaultVideo from "../../vendor/blog/sections/blocks/Video";

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

// biome-ignore lint/suspicious/noExplicitAny: each block takes its own props
type BlockComponent = ComponentType<any>;

export const DEFAULT_BLOCK_PREFIX = "blog/sections/blocks/";
export const CUSTOM_BLOCK_PREFIX = "site/sections/Blog/Post/";
/** Where the custom blocks lived before they moved to Post/ (older v7 content). */
const LEGACY_CUSTOM_PREFIX = "sections/Blog/blocks/";

/** The blog app's default blocks, keyed by name. */
export const DEFAULT_BLOCKS = {
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
} satisfies Record<string, BlockComponent>;

/** This template's blocks (src/sections/Blog/Post), keyed by name. */
export const CUSTOM_BLOCKS = {
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
} satisfies Record<string, BlockComponent>;

/** The block map's short name of each custom block. */
export const CUSTOM_TYPES = {
  "post-heading": "Heading",
  "post-paragraph": "Paragraph",
  "post-quote": "Quote",
  "post-code": "Code",
  "post-list": "List",
  "post-checklist": "Checklist",
  "post-steps": "Steps",
  "post-callout": "Callout",
  "post-image": "BlockImage",
  "post-video": "Video",
  "post-divider": "Divider",
  "post-call-to-action": "CallToAction",
  "post-faq": "Faq",
  "post-custom-block": "CustomBlock",
} as const satisfies Record<string, keyof typeof CUSTOM_BLOCKS>;

/** The block map's short name of each default block. */
export const DEFAULT_TYPES = {
  "post-default-image": "BlockImage",
  "post-default-callout": "Callout",
  "post-default-card-group": "CardGroup",
  "post-default-checklist": "Checklist",
  "post-default-code": "Code",
  "post-default-comparison": "Comparison",
  "post-default-cta": "Cta",
  "post-default-divider": "Divider",
  "post-default-heading": "Heading",
  "post-default-list": "List",
  "post-default-paragraph": "Paragraph",
  "post-default-quote": "Quote",
  "post-default-stat": "Stat",
  "post-default-stat-group": "StatGroup",
  "post-default-steps": "Steps",
  "post-default-table": "Table",
  "post-default-video": "Video",
} as const satisfies Record<string, keyof typeof DEFAULT_BLOCKS>;

export type BlockKind = "default" | "custom";

/** A content block, independent of the shape it was saved or resolved in. */
export interface ContentBlock {
  /** Block name, e.g. "Heading". */
  name: string;
  kind: BlockKind;
  // biome-ignore lint/suspicious/noExplicitAny: saved props of any block
  props: Record<string, any>;
}

/** A block's family and name by its type: a short name or a v7 one. */
function blockType(type: string): Pick<ContentBlock, "name" | "kind"> | undefined {
  if (type in CUSTOM_TYPES) return { name: CUSTOM_TYPES[type as keyof typeof CUSTOM_TYPES], kind: "custom" };
  if (type in DEFAULT_TYPES) return { name: DEFAULT_TYPES[type as keyof typeof DEFAULT_TYPES], kind: "default" };
  const key = type.replace(/\.tsx?$/, "");
  for (const [prefix, kind] of [
    [CUSTOM_BLOCK_PREFIX, "custom"],
    [LEGACY_CUSTOM_PREFIX, "custom"],
    [DEFAULT_BLOCK_PREFIX, "default"],
  ] as const) {
    if (key.startsWith(prefix)) {
      const name = key.slice(prefix.length);
      const registry: Record<string, BlockComponent> = kind === "custom" ? CUSTOM_BLOCKS : DEFAULT_BLOCKS;
      return name in registry ? { name, kind } : undefined;
    }
  }
  return undefined;
}

/**
 * Reads a `post.sections` entry: as stored (`{ __resolveType, ...props }`) or
 * as the descriptor a resolved `post-*` block returns (`{ component, props }`).
 * Undefined for any other type.
 */
export function toContentBlock(raw: unknown): ContentBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as Record<string, unknown>;

  let type: unknown;
  let props: Record<string, unknown>;
  if (typeof node.__resolveType === "string") {
    const { __resolveType, ...rest } = node;
    type = __resolveType;
    props = rest;
  } else {
    type = node.component;
    props = (node.props as Record<string, unknown>) ?? {};
  }
  if (typeof type !== "string") return null;

  const found = blockType(type);
  return found ? { ...found, props } : null;
}

export function getBlockComponent(block: ContentBlock): BlockComponent | null {
  const registry: Record<string, BlockComponent> = block.kind === "custom" ? CUSTOM_BLOCKS : DEFAULT_BLOCKS;
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
  return (sections ?? []).map(toContentBlock).filter((b): b is ContentBlock => b !== null);
}

/** The v7 file a body block placed on a page renders under (its section id and manifest key). */
export function blockFile(block: ContentBlock): string {
  return `${block.kind === "custom" ? CUSTOM_BLOCK_PREFIX : DEFAULT_BLOCK_PREFIX}${block.name}.tsx`;
}

/** A body block placed on a page by itself, as v7 rendered a body section there. */
export function PostBodyView({ block }: { block: unknown }): ReactNode {
  const content = toContentBlock(block);
  if (!content) return null;
  const Component = getBlockComponent(content);
  return Component ? <Component {...content.props} /> : null;
}
