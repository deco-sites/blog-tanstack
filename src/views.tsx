import { Component, type ReactNode } from "react";
import type { BlockDescriptor } from "./model";
import BlogAuthors from "./sections/Blog/BlogAuthors";
import BlogHeader from "./sections/Blog/BlogHeader";
import BlogHome from "./sections/Blog/BlogHome";
import BlogPostSection from "./sections/Blog/BlogPostSection";
import BlogSearch from "./sections/Blog/BlogSearch";
import BlogTopics from "./sections/Blog/BlogTopics";
import { BODY_TYPES, PostBodyView } from "./sections/Blog/blocks/body";

/**
 * Each section renders inside a <section> named after its v7 file, the markup
 * the v7 renderer produced: id (anchor links) and data-manifest-key stay stable.
 */
const SECTION_FILES: Record<BlockDescriptor["component"], string> = {
  "blog-header": "site/sections/Blog/BlogHeader.tsx",
  "blog-home": "site/sections/Blog/BlogHome.tsx",
  "blog-authors": "site/sections/Blog/BlogAuthors.tsx",
  "blog-topics": "site/sections/Blog/BlogTopics.tsx",
  "blog-search": "site/sections/Blog/BlogSearch.tsx",
  "blog-post-section": "site/sections/Blog/BlogPostSection.tsx",
  ...(Object.fromEntries(
    Object.entries(BODY_TYPES).map(([type, kind]) => [type, `site/sections/Blog/blocks/${kind}.tsx`]),
  ) as Record<keyof typeof BODY_TYPES, string>),
};

function sectionId(file: string): string {
  return file.replace(/\//g, "-").replace(/\.tsx$/, "").replace(/^site-sections-/, "");
}

// Maps each descriptor to its component. Add a case per block type.
function SectionView({ block }: { block: BlockDescriptor }) {
  switch (block.component) {
    case "blog-header":
      return <BlogHeader {...block.props} />;
    case "blog-home":
      return <BlogHome {...block.props} />;
    case "blog-authors":
      return <BlogAuthors {...block.props} />;
    case "blog-topics":
      return <BlogTopics {...block.props} />;
    case "blog-search":
      return <BlogSearch {...block.props} />;
    case "blog-post-section":
      return <BlogPostSection {...block.props} />;
    default:
      return <PostBodyView block={block} />;
  }
}

/** Renders nothing for a section that throws while rendering, so the rest of the page stays up. */
class SectionBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(`[section] ${this.props.name} failed to render`, error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function View({ block }: { block: BlockDescriptor | BlockDescriptor[] }): ReactNode {
  if (Array.isArray(block)) return block.map((item, index) => <View key={index} block={item} />); // the chosen variant of the whole list
  const file = SECTION_FILES[block.component];
  if (!file) return null;
  return (
    <section id={sectionId(file)} data-manifest-key={file}>
      <SectionBoundary name={file}>
        <SectionView block={block} />
      </SectionBoundary>
    </section>
  );
}
