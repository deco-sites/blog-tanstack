import type { ContentBlock } from "./blocks";

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/** Slugifies heading text into a stable, accent-free DOM id. */
export function toAnchorId(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function headingDepth(level: unknown): 2 | 3 | null {
  if (level === "2" || level === "h2") return 2;
  if (level === "3" || level === "h3") return 3;
  return null;
}

/** Same rule for both block families: h2/h3 headings and titled Steps/Checklist. */
function tocEntry(block: ContentBlock): TocItem | null {
  const { name, props } = block;
  if (name === "Heading") {
    const depth = headingDepth(props.level);
    if (!depth || !props.text) return null;
    return { id: toAnchorId(props.text), text: stripHtml(props.text), depth };
  }
  if ((name === "Steps" || name === "Checklist") && props.title) {
    return { id: toAnchorId(props.title), text: stripHtml(props.title), depth: 3 };
  }
  return null;
}

/** DOM id a block must carry so the TOC can link to it, if any. */
export function tocAnchorFor(block: ContentBlock): string | undefined {
  return tocEntry(block)?.id;
}

export function extractToc(blocks: ContentBlock[]): TocItem[] {
  return blocks.map(tocEntry).filter((item): item is TocItem => item !== null);
}
