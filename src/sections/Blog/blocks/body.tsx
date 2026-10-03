/**
 * A post's body blocks (headings, paragraphs, ...). Each is a `post-*` section
 * of the block map, which returns a descriptor (`{ component: "post-heading",
 * props }`), so the site editor offers them in a post's section list as on v7.
 * Posts are listed as saved, though, so a body usually reaches BlogPostSection
 * as stored: `{ __resolveType, ...props }`, under the short name or a v7 one.
 * readBody reads both shapes.
 */
import type { ReactNode } from "react";
import BlockImage from "./BlockImage";
import Callout from "./Callout";
import CallToAction from "./CallToAction";
import Checklist from "./Checklist";
import Code from "./Code";
import Divider from "./Divider";
import Faq from "./Faq";
import Heading from "./Heading";
import List from "./List";
import Paragraph from "./Paragraph";
import Quote from "./Quote";
import Steps from "./Steps";
import Video from "./Video";

// biome-ignore lint/suspicious/noExplicitAny: each kind takes its own props
type AnyComponent = (props: any) => ReactNode;

export type BodyKind =
  | "Heading" | "Paragraph" | "Quote" | "Code" | "List" | "Checklist" | "Steps"
  | "Callout" | "BlockImage" | "Video" | "Divider" | "CallToAction" | "Faq";

export const BODY_COMPONENTS: Record<BodyKind, AnyComponent> = {
  Heading, Paragraph, Quote, Code, List, Checklist, Steps,
  Callout, BlockImage, Video, Divider, CallToAction, Faq,
};

/** The block map's short name of each kind. */
export const BODY_TYPES = {
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
} as const satisfies Record<string, BodyKind>;

/**
 * A body block's kind by its type name: the short name (`post-heading`), the
 * v7 name saved content uses (`blog/sections/blocks/Heading.tsx`) or the v7
 * local path (`sections/Blog/blocks/Heading.tsx`).
 */
const BODY_KINDS: Record<string, BodyKind> = Object.fromEntries(
  Object.entries(BODY_TYPES).flatMap(([name, kind]) => [
    [name, kind],
    [`blog/sections/blocks/${kind}.tsx`, kind],
    [`sections/Blog/blocks/${kind}.tsx`, kind],
  ]),
);

// biome-ignore lint/suspicious/noExplicitAny: saved props of any body kind
export type BodyProps = Record<string, any>;

/** A body block's kind and props, from a stored block or a descriptor; undefined for any other type. */
export function readBody(block: unknown): { kind: BodyKind; props: BodyProps } | undefined {
  if (!block || typeof block !== "object") return undefined;
  const b = block as BodyProps;
  if (typeof b.__resolveType === "string") {
    const { __resolveType, ...props } = b;
    const kind = BODY_KINDS[__resolveType];
    return kind ? { kind, props } : undefined;
  }
  const kind = typeof b.component === "string" ? BODY_KINDS[b.component] : undefined;
  return kind ? { kind, props: b.props ?? {} } : undefined;
}

/** A body block placed on a page by itself, as v7 rendered a body section there. */
export function PostBodyView({ block }: { block: unknown }): ReactNode {
  const body = readBody(block);
  if (!body) return null;
  const Component = BODY_COMPONENTS[body.kind];
  return <Component {...body.props} />;
}
