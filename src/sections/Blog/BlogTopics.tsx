import type { BlogPost } from "@decocms/apps/blog/types";
import { getSiteConfig, type SiteConfig } from "../../utils/site-config";

export interface Category {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Props {
  /**
   * @title Categorias / Tópicos
   * @description Conecte ao loader blog/loaders/GetCategories.ts
   */
  categories?: Category[] | null;
  /**
   * @title Posts do blog
   * @description Conecte ao blog/loaders/BlogpostList.ts para exibir a contagem de posts por tópico
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

function countPostsByCategory(posts: BlogPost[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const post of posts) {
    for (const cat of post.categories ?? []) {
      counts[cat.slug] = (counts[cat.slug] ?? 0) + 1;
    }
  }
  return counts;
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

export default function BlogTopics({
  categories,
  posts,
  heading = "Tópicos",
  description,
  // @ts-ignore injected by loader
  origin = "",
  // @ts-ignore injected by loader
  pathname = "/topics",
  // @ts-ignore injected by loader
  siteConfig = getSiteConfig(),
}: Props & { origin?: string; pathname?: string; siteConfig?: SiteConfig }) {
  const cats = categories ?? [];
  const containerId = "blog-topics";
  const pageUrl = `${origin}${pathname}`;
  const siteName = siteConfig.name;

  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": pageUrl,
      "url": pageUrl,
      "name": heading,
      "description": description ??
        `Explore todos os tópicos e categorias do ${siteName}.`,
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
      "hasPart": cats.map((c) => ({
        "@type": "ItemList",
        "name": c.name,
        "url": `${origin}/topics/${c.slug}`,
        "description": c.description ?? `Artigos sobre ${c.name}`,
      })),
    },
  ]);

  if (cats.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <div className="border-b border-[#e4e3df]">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-12 md:py-16">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#ff6011] mb-4">
              Blog
            </p>
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#1a1a18] tracking-tight leading-tight [text-wrap:balance] mb-3">
              {heading}
            </h1>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-20 flex flex-col items-center text-center gap-4">
          <svg
            className="w-10 h-10 text-[#e4e3df]"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="8"
              width="32"
              height="24"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 16h16M12 22h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[#7a7a74] text-base">
            Nenhum tópico disponível ainda.
          </p>
          <a
            href="/"
            className="mt-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[#ff6011] no-underline hover:opacity-75 transition-opacity"
          >
            ← Ver todos os artigos
          </a>
        </div>
      </div>
    );
  }

  const counts = countPostsByCategory(posts ?? []);

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

      {/* Grid de tópicos */}
      <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-[#e4e3df]">
          {cats.map((cat, i) => {
            const count = counts[cat.slug] ?? 0;
            return (
              <a
                key={cat.slug}
                href={`/topics/${cat.slug}`}
                className="blog-reveal group flex items-center justify-between border-r border-b border-[#e4e3df] p-7 no-underline hover:bg-[#fafaf8] transition-colors duration-150"
                style={{
                  opacity: 0,
                  transform: "translateY(12px)",
                  transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${
                    i * 60
                  }ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${i * 60}ms`,
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#1a1a18] text-base group-hover:text-[#ff6011] transition-colors duration-150">
                    {cat.name}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-[#a0a09a]">
                      {count} {count === 1 ? "artigo" : "artigos"}
                    </span>
                  )}
                </div>
                {/* Arrow with hover slide */}
                <svg
                  className="w-4 h-4 text-[#a0a09a] flex-shrink-0 group-hover:text-[#ff6011] group-hover:translate-x-1 transition-[color,transform] duration-150"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            );
          })}
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
