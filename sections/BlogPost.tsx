import { JSX } from "preact";
import { type Author, type BlogPost, BlogPostPage } from "apps/blog/types.ts";
import { type Section } from "@deco/deco/blocks";
import Image from "apps/website/components/Image.tsx";
import Icon from "site/components/ui/Icon.tsx";
import BlockImage from "apps/blog/sections/blocks/BlockImage.tsx";
import Callout from "apps/blog/sections/blocks/Callout.tsx";
import CardGroup from "apps/blog/sections/blocks/CardGroup.tsx";
import Checklist from "apps/blog/sections/blocks/Checklist.tsx";
import Code from "apps/blog/sections/blocks/Code.tsx";
import Comparison from "apps/blog/sections/blocks/Comparison.tsx";
import Cta from "apps/blog/sections/blocks/Cta.tsx";
import Divider from "apps/blog/sections/blocks/Divider.tsx";
import Heading from "apps/blog/sections/blocks/Heading.tsx";
import List from "apps/blog/sections/blocks/List.tsx";
import Paragraph from "apps/blog/sections/blocks/Paragraph.tsx";
import Quote from "apps/blog/sections/blocks/Quote.tsx";
import Stat from "apps/blog/sections/blocks/Stat.tsx";
import StatGroup from "apps/blog/sections/blocks/StatGroup.tsx";
import Steps from "apps/blog/sections/blocks/Steps.tsx";
import Video from "apps/blog/sections/blocks/Video.tsx";

interface Props {
  /**
   * @description The description of name.
   */
  page?: BlogPostPage | null;
}

const PARAGRAPH_STYLES = "[&_p]:leading-[150%] [&_*]:mb-4";
const HEADING_STYLES =
  "[&>h1]:text-4xl [&>h1]:my-6 [&>h1]:font-bold [&>h2]:text-3xl [&>h2]:my-6 [&>h2]:font-bold [&>h3]:text-2xl [&>h3]:my-6 [&>h3]:font-bold [&>h4]:text-xl [&>h4]:my-6 [&>h4]:font-bold [&>h5]:text-lg [&>h5]:my-6 [&>h5]:font-bold [&>h6]:text-base [&>h6]:my-6 [&>h6]:font-bold";
const CODE_BLOCK_STYLES =
  "[&>pre]:bg-gray-100 [&>pre]:text-gray-800 [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:border [&>pre]:rounded-md [&>pre]:overflow-x-auto [&>code]:block [&>code]:w-full";
const IMAGE_STYLES = "[&_img]:rounded-2xl [&_img]:w-full [&_img]:my-12";
const BLOCKQUOTE_STYLES =
  "[&>blockquote]:my-6 [&>blockquote]:border-l-2 [&>blockquote]:border-black [&>blockquote]:text-xl [&>blockquote]:italic [&>blockquote]:pl-6";

const CONTENT_STYLES =
  `max-w-3xl mx-auto ${PARAGRAPH_STYLES} ${HEADING_STYLES} ${CODE_BLOCK_STYLES} ${IMAGE_STYLES} ${BLOCKQUOTE_STYLES}`;

// deno-lint-ignore no-explicit-any
type AnyComponent = (props: any) => JSX.Element | null;

const BLOCK_COMPONENTS: Record<string, AnyComponent> = {
  "blog/sections/blocks/BlockImage.tsx": BlockImage,
  "blog/sections/blocks/Callout.tsx": Callout,
  "blog/sections/blocks/CardGroup.tsx": CardGroup,
  "blog/sections/blocks/Checklist.tsx": Checklist,
  "blog/sections/blocks/Code.tsx": Code,
  "blog/sections/blocks/Comparison.tsx": Comparison,
  "blog/sections/blocks/Cta.tsx": Cta,
  "blog/sections/blocks/Divider.tsx": Divider,
  "blog/sections/blocks/Heading.tsx": Heading,
  "blog/sections/blocks/List.tsx": List,
  "blog/sections/blocks/Paragraph.tsx": Paragraph,
  "blog/sections/blocks/Quote.tsx": Quote,
  "blog/sections/blocks/Stat.tsx": Stat,
  "blog/sections/blocks/StatGroup.tsx": StatGroup,
  "blog/sections/blocks/Steps.tsx": Steps,
  "blog/sections/blocks/Video.tsx": Video,
};

function renderBlockSection(
  // deno-lint-ignore no-explicit-any
  section: any,
  idx: number,
) {
  const resolveType = section?.__resolveType as string | undefined;
  if (resolveType) {
    const Component = BLOCK_COMPONENTS[resolveType];
    if (!Component) return null;
    const { __resolveType: _rt, ...props } = section;
    return <Component key={idx} {...props} />;
  }
  // Already a resolved Deco section
  const { Component, props } = section;
  return Component ? <Component key={idx} {...props} /> : null;
}

const DEFAULT_AVATAR =
  "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1527/7286de42-e9c5-4fcb-ae8b-b992eea4b78e";

const DEFAULT_PROPS: BlogPost = {
  title: "Blog title heading will go here",
  excerpt: "Excerpt goes here",
  authors: [
    {
      name: "Full name",
      email: "author@deco.cx",
      avatar: DEFAULT_AVATAR,
    },
  ],
  categories: [],
  date: "2022-01-01",
  image:
    "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/4763/682eb374-def2-4e85-a45d-b3a7ff8a31a9",
  slug: "blog-post",
  sections: [
    {
      "__resolveType": "blog/sections/blocks/Paragraph.tsx",
      "content":
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
    },
  ] as unknown as Section[],
};

function SocialIcons() {
  return (
    <div class="flex gap-2">
      <div class="bg-gray-200 rounded-full p-1">
        <Icon id="Link" size={24} />
      </div>
      <div class="bg-gray-200 rounded-full p-1">
        <Icon id="LinkedinOutline" size={24} />
      </div>
      <div class="bg-gray-200 rounded-full p-1">
        <Icon id="TwitterOutline" size={24} />
      </div>
      <div class="rounded-full bg-gray-200 p-1">
        <Icon id="FacebookOutline" size={24} />
      </div>
    </div>
  );
}

export default function BlogPost({ page }: Props) {
  const { title, image, date } = page?.post || DEFAULT_PROPS;
  const authors: Author[] = page?.post?.authors ??
    (DEFAULT_PROPS.authors as Author[]);
  const sections = page?.post?.sections;
  const content: string = page?.post?.content ??
    (DEFAULT_PROPS.content as string);

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full flex flex-col gap-20 container mx-auto px-4 md:px-0 py-12 lg:py-28">
      <div className="w-full flex flex-col gap-12 max-w-3xl lg:mx-auto">
        <h1 className="text-5xl font-bold">{title}</h1>
        <div className="flex items-center gap-4">
          <Image
            className="object-cover w-14 h-14 rounded-full"
            alt={authors[0]?.name}
            src={authors[0]?.avatar || DEFAULT_AVATAR}
            width={56}
            height={56}
          />
          <div className="flex flex-col">
            <p className="font-semibold text-base">
              {authors.map((author) => author.name).join(", ")}
            </p>
            <p className="text-base">{formattedDate}</p>
          </div>
        </div>
      </div>
      {image && (
        <Image
          className="w-full object-cover aspect-video max-h-[600px] rounded-2xl"
          width={600}
          src={image || ""}
        />
      )}
      {sections && sections.length > 0
        ? (
          <div class={CONTENT_STYLES}>
            {sections.map(renderBlockSection)}
          </div>
        )
        : (
          <div
            class={CONTENT_STYLES}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      <div class="flex flex-col gap-10 max-w-3xl w-full mx-auto">
        <div class="space-y-4">
          <p class="text-lg font-bold">Share this post</p>
          <div class="flex flex-col gap-8 md:flex-row justify-between">
            <SocialIcons />
            <div class="flex gap-2 text-white text-xs">
              <p class="flex items-center bg-zinc-700 py-2 px-4 rounded-full">
                Tag #1
              </p>
              <p class="flex items-center bg-zinc-700 py-2 px-4 rounded-full">
                Tag #2
              </p>
              <p class="flex items-center bg-zinc-700 py-2 px-4 rounded-full">
                Tag #3
              </p>
            </div>
          </div>
        </div>
        {/* divider zinc-300 */}
        <div class="w-full h-px bg-zinc-300"></div>
        <div className="flex items-center gap-4">
          <Image
            className="object-cover w-14 h-14 rounded-full"
            alt={authors[0]?.name}
            src={authors[0]?.avatar || ""}
            width={56}
            height={56}
          />
          <div className="flex flex-col">
            <p className="font-semibold text-base">
              {authors[0]?.name}
            </p>
            <p className="text-base">
              {`${authors[0]?.jobTitle ?? "Job Title"}, ${
                authors[0]?.company || "Company"
              }`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
