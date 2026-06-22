import { useId, type ReactNode } from "react";
import type { BlogPost, BlogPostPage, Author } from "@decocms/apps/blog/types";

// Block components
import Heading from "./blocks/Heading";
import Paragraph from "./blocks/Paragraph";
import Quote from "./blocks/Quote";
import Code from "./blocks/Code";
import List from "./blocks/List";
import Checklist from "./blocks/Checklist";
import Steps from "./blocks/Steps";
import Callout from "./blocks/Callout";
import BlockImage from "./blocks/BlockImage";
import Video from "./blocks/Video";
import Divider from "./blocks/Divider";
import CallToAction from "./blocks/CallToAction";

export interface Props {
  /** @description Página do post do blog */
  page?: BlogPostPage | null;
  /**
   * @title Posts relacionados
   * @description Conecte ao blog/loaders/BlogpostList.ts
   */
  relatedPosts?: BlogPost[] | null;
}

type AnyComponent = (props: any) => ReactNode;

const BLOCK_COMPONENTS: Record<string, AnyComponent> = {
  "blog/sections/blocks/Heading.tsx": Heading,
  "blog/sections/blocks/Paragraph.tsx": Paragraph,
  "blog/sections/blocks/Quote.tsx": Quote,
  "blog/sections/blocks/Code.tsx": Code,
  "blog/sections/blocks/List.tsx": List,
  "blog/sections/blocks/Checklist.tsx": Checklist,
  "blog/sections/blocks/Steps.tsx": Steps,
  "blog/sections/blocks/Callout.tsx": Callout,
  "blog/sections/blocks/BlockImage.tsx": BlockImage,
  "blog/sections/blocks/Video.tsx": Video,
  "blog/sections/blocks/Divider.tsx": Divider,
  "blog/sections/blocks/CallToAction.tsx": CallToAction,
  // Local section paths
  "sections/Blog/blocks/Heading.tsx": Heading,
  "sections/Blog/blocks/Paragraph.tsx": Paragraph,
  "sections/Blog/blocks/Quote.tsx": Quote,
  "sections/Blog/blocks/Code.tsx": Code,
  "sections/Blog/blocks/List.tsx": List,
  "sections/Blog/blocks/Checklist.tsx": Checklist,
  "sections/Blog/blocks/Steps.tsx": Steps,
  "sections/Blog/blocks/Callout.tsx": Callout,
  "sections/Blog/blocks/BlockImage.tsx": BlockImage,
  "sections/Blog/blocks/Video.tsx": Video,
  "sections/Blog/blocks/Divider.tsx": Divider,
  "sections/Blog/blocks/CallToAction.tsx": CallToAction,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function toAnchorId(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

function extractToc(sections: any[]): TocItem[] {
  const items: TocItem[] = [];
  for (const s of sections) {
    const rt = (s?.__resolveType as string) ?? "";
    if (rt.includes("Heading") && (s.level === "2" || s.level === "h2" || s.level === "3" || s.level === "h3")) {
      items.push({
        id: toAnchorId(s.text ?? ""),
        text: stripHtml(s.text ?? ""),
        depth: (s.level === "3" || s.level === "h3") ? 3 : 2,
      });
    } else if ((rt.includes("Steps") || rt.includes("Checklist")) && s.title) {
      items.push({ id: toAnchorId(s.title), text: s.title, depth: 3 });
    }
  }
  return items;
}

function renderBlock(section: any, idx: number): ReactNode {
  const resolveType = section?.__resolveType as string | undefined;
  if (!resolveType) return null;
  const Component = BLOCK_COMPONENTS[resolveType];
  if (!Component) return null;
  const { __resolveType: _rt, ...props } = section;
  if (resolveType.includes("Heading") && (props.level === "2" || props.level === "h2" || props.level === "3" || props.level === "h3")) {
    return <Component key={idx} {...props} id={toAnchorId(props.text ?? "")} />;
  }
  if ((resolveType.includes("Steps") || resolveType.includes("Checklist")) && props.title) {
    return <Component key={idx} {...props} id={toAnchorId(props.title)} />;
  }
  return <Component key={idx} {...props} />;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getTocScript(navId: string) {
  return `(function(){
  var nav = document.getElementById(${JSON.stringify(navId)});
  if (!nav) return;
  var links = Array.from(nav.querySelectorAll('a[data-anchor]'));
  var activate = function(id) {
    links.forEach(function(l) {
      var on = l.dataset.anchor === id;
      l.style.color = on ? '#ff6011' : '';
      l.style.borderLeftColor = on ? '#ff6011' : '';
      l.style.fontWeight = on ? '600' : '';
    });
  };
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) activate(e.target.id); });
  }, { rootMargin: '-8% 0% -82% 0%', threshold: 0 });
  links.forEach(function(l) {
    var h = l.dataset.anchor ? document.getElementById(l.dataset.anchor) : null;
    if (h) io.observe(h);
  });
})();`;
}

function AnimatedTitle({ text }: { text: string }) {
  const words = text.split(" ");
  let charIdx = 0;
  return (
    <span aria-hidden="true">
      {words.flatMap((word, wi) => {
        const wordEl = (
          <span key={`w${wi}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((char) => {
              const delay = charIdx++ * 22;
              return (
                <span
                  key={`c${delay}`}
                  style={{ display: "inline-block", animation: `charIn 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
        return wi < words.length - 1 ? [wordEl, <span key={`sp${wi}`}> </span>] : [wordEl];
      })}
    </span>
  );
}

function AuthorInitial({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div
      className="w-10 h-10 rounded-full bg-[#ff6011] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold select-none"
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}

function buildJsonLd(post: BlogPost & { sections?: any[] }, url: string): string {
  const authors: Author[] = (post.authors as Author[] | undefined) ?? [];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt ?? "",
    "image": post.image ?? undefined,
    "datePublished": post.date ?? undefined,
    "dateModified": post.date ?? undefined,
    "url": url,
    "inLanguage": "pt-BR",
    "abstract": post.excerpt ?? undefined,
    "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".post-excerpt"] },
    "author": authors.map((a) => ({
      "@type": "Person",
      "name": a.name,
      "jobTitle": a.jobTitle ?? undefined,
      "image": a.avatar ?? undefined,
    })),
    "publisher": {
      "@type": "Organization",
      "name": "Blog",
    },
    "keywords": post.categories?.map((c) => c.name).join(", ") ?? undefined,
  });
}

export default function BlogPostSection({ page, relatedPosts }: Props) {
  if (!page?.post) return null;

  const post = page.post as BlogPost & { sections?: any[] };
  const { title, image, date, authors, sections, content, excerpt, categories, slug } = post;
  const alt = (post as any).alt;

  const authorsArray: Author[] = (authors as Author[] | undefined) ?? [];
  const firstCategory = categories?.[0];
  const toc: TocItem[] = sections ? extractToc(sections) : [];
  const hasToc = toc.length > 1;
  const tocNavId = useId().replace(/:/g, "-");

  const related = (relatedPosts ?? []).filter((p) => p.slug !== slug).slice(0, 2);

  // JSON-LD for SEO/GEO
  const canonicalUrl = typeof window !== "undefined"
    ? window.location.href
    : `/${slug}`;

  return (
    <div className="bg-white min-h-screen" data-blog-post-section="">
      {/* JSON-LD structured data — BlogPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(post, canonicalUrl) }}
      />

      {/* Hero image */}
      {image && (
        <figure className="m-0 w-full overflow-hidden bg-[#f0efeb] max-h-[520px] relative" data-blog-hero-image="">
          <img
            src={image}
            alt={alt || title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width={1200}
            height={630}
            className="w-full object-cover block max-h-[520px]"
          />
        </figure>
      )}

      {/* Bottom gradient fade from hero */}
      {image && (
        <div
          aria-hidden="true"
          className="relative pointer-events-none select-none"
          style={{ zIndex: 1, marginTop: -180, height: 180, background: "linear-gradient(to bottom,transparent 0%,rgba(255,255,255,0.8) 55%,#fff 100%)" }}
        />
      )}

      {/* Hero mode styles — injected AFTER hero image for CSS :has() to work (zero FOUC) */}
      {image && (
        <style>{`
          body:has([data-blog-hero-image]) [data-blog-header]:not(.blog-header--scrolled) {
            background-color: transparent !important;
            border-bottom-color: transparent !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
          }
          body:has([data-blog-hero-image]) [data-blog-hero-image]::before {
            content: "";
            position: absolute; top: 0; left: 0; right: 0;
            height: 220px;
            background: linear-gradient(to bottom,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.20) 60%,transparent 100%);
            pointer-events: none; z-index: 1;
            transition: opacity 250ms cubic-bezier(0.16,1,0.3,1);
          }
          body:has([data-blog-header].blog-header--scrolled) [data-blog-hero-image]::before { opacity: 0; }
          body:has([data-blog-hero-image]) [data-blog-header] a,
          body:has([data-blog-hero-image]) [data-blog-header] button {
            transition: color 250ms cubic-bezier(0.16,1,0.3,1) !important;
          }
          body:has([data-blog-hero-image]) [data-blog-header]:not(.blog-header--scrolled) a,
          body:has([data-blog-hero-image]) [data-blog-header]:not(.blog-header--scrolled) button { color: #fff !important; }
          body:has([data-blog-hero-image]) [data-blog-header]:not(.blog-header--scrolled) [data-nav-ind] { background-color: rgba(255,255,255,0.6) !important; }
          body:has([data-blog-hero-image]) [data-blog-post-section] { padding-top: 72px; }
          body:has([data-blog-hero-image]) [data-blog-hero-image]   { margin-top: -72px; }
          @media (max-width: 767px) {
            body:has([data-blog-hero-image]) [data-blog-post-section] { padding-top: 64px; }
            body:has([data-blog-hero-image]) [data-blog-hero-image]   { margin-top: -64px; }
          }
          @keyframes charIn {
            from { opacity: 0; transform: translateY(0.4em); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroReveal {
            from { opacity: 0.88; transform: scale(1.025); }
            to   { opacity: 1; transform: scale(1); }
          }
          [data-blog-hero-image] img { animation: heroReveal 1.6s cubic-bezier(0.16,1,0.3,1) both; will-change: transform,opacity; }
          @keyframes postFadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .post-anim-1 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
          .post-anim-2 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
          .post-anim-3 { animation: postFadeUp 0.70s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
          .post-anim-4 { animation: postFadeUp 0.70s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
          .post-anim-5 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        `}</style>
      )}

      {!image && (
        <style>{`
          @keyframes charIn {
            from { opacity: 0; transform: translateY(0.4em); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes postFadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .post-anim-1 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
          .post-anim-2 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
          .post-anim-3 { animation: postFadeUp 0.70s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
          .post-anim-4 { animation: postFadeUp 0.70s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
          .post-anim-5 { animation: postFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        `}</style>
      )}

      <div className="max-w-[1200px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-8 pb-20 box-border">
        <div className={hasToc ? "flex gap-16 xl:gap-24" : ""}>

          {/* Article */}
          <article className="flex-1 min-w-0 max-w-[720px]">

            {/* Breadcrumb */}
            <nav
              className="post-anim-1 flex items-center gap-2 text-[10px] tracking-[0.12em] uppercase mb-6 text-[#a0a09a] flex-wrap"
              aria-label="Breadcrumb"
            >
              <a href="/" className="hover:text-[#ff6011] transition-colors no-underline text-[#7a7a74]">Blog</a>
              {firstCategory && (
                <>
                  <span>/</span>
                  <a href={`/topics/${firstCategory.slug}`} className="hover:text-[#ff6011] transition-colors no-underline text-[#7a7a74]">
                    {firstCategory.name}
                  </a>
                </>
              )}
              <span>/</span>
              <span className="truncate max-w-[200px] text-[#a0a09a]">{title}</span>
            </nav>

            {/* Category pill */}
            {firstCategory && (
              <a
                href={`/topics/${firstCategory.slug}`}
                className="post-anim-2 inline-block mb-4 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#ff6011] no-underline"
              >
                {firstCategory.name}
              </a>
            )}

            {/* Title with letter-by-letter animation */}
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-[#1a1a18] break-words [text-wrap:balance] mb-4">
              <span className="sr-only">{title}</span>
              <AnimatedTitle text={title} />
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="post-excerpt post-anim-4 text-[#4a4a46] text-lg leading-relaxed mb-6 [text-wrap:pretty]">
                {excerpt}
              </p>
            )}

            {/* Author + Date bar */}
            <div className="post-anim-5 flex flex-wrap items-center gap-x-4 gap-y-2 py-5 border-y border-[#e4e3df] mb-8">
              {authorsArray.map((author) => (
                <div key={author.email} className="flex items-center gap-2.5">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      loading="lazy"
                      decoding="async"
                      className="w-8 h-8 rounded-full object-cover block flex-shrink-0"
                    />
                  ) : (
                    <AuthorInitial name={author.name} />
                  )}
                  <span className="text-sm font-semibold text-[#1a1a18]">{author.name}</span>
                  {author.jobTitle && (
                    <span className="text-xs text-[#7a7a74]">· {author.jobTitle}</span>
                  )}
                </div>
              ))}
              {date && (
                <time className="text-sm text-[#7a7a74] ml-auto" dateTime={date}>
                  {formatDate(date)}
                </time>
              )}
            </div>

            {/* Mobile TOC */}
            {hasToc && (
              <details className="lg:hidden mb-8 border border-[#e4e3df] rounded overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer bg-[#f7f6f3] text-[10px] font-semibold tracking-[0.14em] uppercase text-[#7a7a74] select-none list-none">
                  <span>Nesta Página</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <nav className="flex flex-col px-5 py-3 gap-0">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      data-anchor={item.id}
                      className={`text-sm text-[#4a4a46] hover:text-[#ff6011] transition-colors py-1.5 no-underline border-l-2 border-[#e4e3df] hover:border-[#ff6011] leading-snug ${item.depth === 3 ? "pl-7" : "pl-3"}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* Content blocks or raw HTML */}
            {sections && sections.length > 0 ? (
              <div className="flex flex-col">
                {sections.map(renderBlock)}
              </div>
            ) : content && (
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{ __html: content as string }}
              />
            )}

            {/* Author card */}
            {authorsArray.length > 0 && (
              <div className="mt-14 pt-8 border-t border-[#e4e3df]">
                <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#a0a09a] mb-5">
                  Sobre o{authorsArray.length > 1 ? "s Autores" : " Autor"}
                </p>
                {authorsArray.map((author) => (
                  <div key={author.email} className="flex items-start gap-4 mb-6 last:mb-0">
                    {author.avatar ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        loading="lazy"
                        decoding="async"
                        className="w-14 h-14 rounded-full object-cover block flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#ff6011] text-white flex items-center justify-center flex-shrink-0 text-xl font-bold select-none">
                        {author.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="font-semibold text-[#1a1a18]">{author.name}</span>
                      {author.jobTitle && <span className="text-xs text-[#7a7a74]">{author.jobTitle}</span>}
                      {author.company && <span className="text-xs text-[#a0a09a]">{author.company}</span>}
                      <a
                        href={`/authors/${author.email}`}
                        className="mt-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#ff6011] no-underline hover:opacity-75 transition-opacity"
                      >
                        Ver todos os posts →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Sticky TOC sidebar (lg+) */}
          {hasToc && (
            <aside
              className="hidden lg:block w-[240px] flex-shrink-0"
              aria-label="Índice do artigo"
            >
              <div className="sticky top-10">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#a0a09a] mb-3 pl-4">
                  Nesta Página
                </p>
                <nav
                  id={tocNavId}
                  className="flex flex-col gap-0 max-h-[calc(100vh-140px)] overflow-y-auto"
                >
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      data-anchor={item.id}
                      className={`text-[13px] text-[#7a7a74] hover:text-[#ff6011] py-[5px] no-underline border-l-2 border-transparent hover:border-[#ff6011] leading-snug block transition-colors ${item.depth === 3 ? "pl-7" : "pl-4"}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
                <script defer dangerouslySetInnerHTML={{ __html: getTocScript(tocNavId) }} />
              </div>
            </aside>
          )}
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#e4e3df]">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#a0a09a] mb-8">
              Continue lendo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((rp) => (
                <a
                  key={rp.slug}
                  href={`/${rp.slug}`}
                  className="group flex flex-col no-underline text-inherit"
                >
                  {rp.image && (
                    <div className="overflow-hidden aspect-[16/9] bg-[#f0efeb] mb-4">
                      <img
                        src={rp.image}
                        alt={(rp as any).alt || rp.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-[#1a1a18] text-base leading-snug mb-2 group-hover:text-[#ff6011] transition-colors [text-wrap:balance]">
                    {rp.title}
                  </h3>
                  {rp.excerpt && (
                    <p className="text-sm text-[#7a7a74] leading-relaxed line-clamp-2">{rp.excerpt}</p>
                  )}
                  {rp.categories?.[0] && (
                    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#ff6011] mt-2">
                      {rp.categories[0].name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const eager = true;
export const sync = true;
