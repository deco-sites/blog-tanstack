import type { Author, BlogPost } from "@decocms/apps/blog/types";
import { getSiteConfig, type SiteConfig } from "../../utils/site-config";

export interface Props {
  /**
   * @title Posts do blog
   * @description Conecte ao blog/loaders/BlogpostList.ts para extrair os autores únicos
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

export async function loader(
  props: Props,
  req: Request,
): Promise<
  Props & { origin: string; pathname: string; siteConfig: SiteConfig }
> {
  const url = new URL(req.url);
  return {
    ...props,
    origin: url.origin,
    pathname: url.pathname,
    siteConfig: getSiteConfig(),
  };
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

function AuthorInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="w-16 h-16 rounded-full bg-[#ff6011] text-white flex items-center justify-center text-xl font-bold select-none flex-shrink-0"
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}

function getScrollRevealScript(containerId: string) {
  return `(function(){
  var c=document.getElementById(${JSON.stringify(containerId)});
  if(!c)return;
  var o=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target);}
    });
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  c.querySelectorAll('.blog-reveal').forEach(function(el){o.observe(el);});
})();`;
}

export default function BlogAuthors({
  posts,
  heading = "Autores",
  description,
  // @ts-ignore injected by loader
  origin = "",
  // @ts-ignore injected by loader
  pathname = "/authors",
  // @ts-ignore injected by loader
  siteConfig = getSiteConfig(),
}: Props & { origin?: string; pathname?: string; siteConfig?: SiteConfig }) {
  const authors = getUniqueAuthors(posts ?? []);
  if (authors.length === 0) return null;

  const containerId = "blog-authors";
  const pageUrl = `${origin}${pathname}`;
  const siteName = siteConfig.name;

  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": pageUrl,
      "url": pageUrl,
      "name": heading,
      "description": description ?? `Conheça os autores do ${siteName}.`,
      "inLanguage": "pt-BR",
      "isPartOf": { "@id": origin ? `${origin}/#website` : "/" },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": siteName,
            "item": origin ? `${origin}/` : "/",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": heading,
            "item": pageUrl,
          },
        ],
      },
    },
    ...authors.map((a) => ({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": a.name,
      "url": `${origin}/authors/${a.email}`,
      "image": a.avatar ?? undefined,
      "jobTitle": a.jobTitle ?? undefined,
      "worksFor": a.company
        ? { "@type": "Organization", "name": a.company }
        : undefined,
    })),
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
                {author.avatar
                  ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      loading="lazy"
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  )
                  : <AuthorInitials name={author.name} />}

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
                    {author.postCount === 1 ? "artigo" : "artigos"}
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
        dangerouslySetInnerHTML={{ __html: getScrollRevealScript(containerId) }}
      />
    </div>
  );
}

export const eager = true;
export const sync = true;
