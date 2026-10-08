import type { Author, BlogPost } from "@decocms/apps-blog/types";
import AuthorAvatar from "../../components/blog/AuthorAvatar";
import { pluralize } from "../../sdk/blog/format";
import {
  collectionPageJsonLd,
  homeCrumb,
  personJsonLd,
  serializeJsonLd,
} from "../../sdk/blog/jsonLd";
import { getSiteContext, type SiteContext } from "../../sdk/blog/loader";
import { revealScript } from "../../sdk/blog/scripts";

export interface Props {
  /**
   * @title Posts do blog
   * @description Conecte ao site/loaders/BlogpostList.ts para extrair os autores únicos
   */
  posts?: BlogPost[] | null;
  /**
   * @title Título da página
   */
  heading?: string;
  /**
   * @title Descrição
   */
  description?: string;
}

export function loader(props: Props, req: Request): Props & SiteContext {
  return { ...props, ...getSiteContext(req) };
}

interface AuthorWithCount extends Author {
  postCount: number;
}

function getUniqueAuthors(posts: BlogPost[]): AuthorWithCount[] {
  const map = new Map<string, AuthorWithCount>();
  for (const post of posts) {
    for (const author of ((post.authors as Author[] | undefined) ?? [])) {
      const existing = map.get(author.email);
      if (existing) {
        existing.postCount++;
      } else {
        map.set(author.email, { ...author, postCount: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.postCount - a.postCount);
}

export default function BlogAuthors({
  posts,
  heading = "Autores",
  description,
  origin,
  pathname,
  siteConfig,
}: Props & SiteContext) {
  const authors = getUniqueAuthors(posts ?? []);
  if (authors.length === 0) return null;

  const containerId = "blog-authors";
  const pageUrl = `${origin}${pathname}`;
  const siteName = siteConfig.name;

  const jsonLd = serializeJsonLd([
    collectionPageJsonLd({
      url: pageUrl,
      name: heading,
      description: description ?? `Conheça os autores do ${siteName}.`,
      origin,
      breadcrumb: [
        homeCrumb(siteConfig, origin),
        { name: heading, url: pageUrl },
      ],
    }),
    ...authors.map((a) => personJsonLd(a, origin)),
  ]);

  return (
    <div className="bg-white min-h-screen" id={containerId}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      {/* Header */}
      <div className="border-b border-[#e4e3df]">
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-12 md:py-16">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#ff6011] mb-4">
            Blog
          </p>
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#1a1a18] tracking-tight leading-tight [text-wrap:balance] mb-3">
            {heading}
          </h1>
          {description && (
            <p className="text-[#7a7a74] text-base leading-relaxed max-w-[520px]">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Grid de autores */}
      <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {authors.map((author, i) => (
            <div
              key={author.email}
              className="blog-reveal group flex flex-col border-t-2 border-[#e4e3df] pt-6 hover:border-[#ff6011] transition-colors duration-200"
              style={{
                opacity: 0,
                transform: "translateY(12px)",
                transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${
                  i * 60
                }ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${
                  i * 60
                }ms, border-color 0.2s ease`,
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <AuthorAvatar author={author} size="lg" />

                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-[#1a1a18] leading-snug group-hover:text-[#ff6011] transition-colors duration-150 truncate">
                    {author.name}
                  </span>
                  {author.jobTitle && (
                    <span className="text-xs text-[#7a7a74] truncate">
                      {author.jobTitle}
                    </span>
                  )}
                  <span className="text-xs text-[#a0a09a] mt-0.5">
                    {author.postCount}{" "}
                    {pluralize(author.postCount, "artigo", "artigos")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html:
            ".blog-reveal.is-visible{opacity:1!important;transform:none!important;}",
        }}
      />
      <script
        defer
        dangerouslySetInnerHTML={{ __html: revealScript(containerId) }}
      />
    </div>
  );
}

export const eager = true;
export const sync = true;
