import type { BlogPost } from "@decocms/apps/blog/types";
import { getSiteConfig, type SiteConfig } from "../../utils/site-config";

export interface Props {
  /**
   * @title Posts do Blog
   * @description Conecte ao loader blog/loaders/BlogpostList.ts (count >= 50)
   */
  posts?: BlogPost[] | null;
  /**
   * @title Posts por página
   * @default 10
   */
  perPage?: number;
  /**
   * @title Título da seção (ex: "Engenharia", "Design")
   * @description Exibido quando filtrando por categoria/autor
   */
  sectionTitle?: string;
  /**
   * @title URL base para paginação
   * @description Ex: "/topics/engineering". Padrão: raiz
   */
  baseUrl?: string;
}

export function loader(
  props: Props,
  req: Request,
): Props & {
  currentPage: number;
  query: string;
  origin: string;
  siteConfig: SiteConfig;
} {
  const url = new URL(req.url);
  const currentPage = Math.max(
    1,
    parseInt(url.searchParams.get("page") ?? "1") || 1,
  );
  const query = url.searchParams.get("q") ?? "";
  const baseUrl = url.pathname;
  return {
    ...props,
    baseUrl,
    currentPage,
    query,
    origin: url.origin,
    siteConfig: getSiteConfig(),
  };
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

const REVEAL_CSS = `
  [data-blog-index] { padding-top: 72px; }
  @media (max-width: 767px) { [data-blog-index] { padding-top: 64px; } }
  .blog-reveal {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 400ms cubic-bezier(0.16,1,0.3,1),
                transform 400ms cubic-bezier(0.16,1,0.3,1);
  }
  .blog-reveal.is-visible { opacity: 1; transform: translateY(0); }
`;

function getRevealScript(id: string) {
  return `(function(){
  var el=document.getElementById(${JSON.stringify(id)});
  var header=document.querySelector('[data-blog-header]');
  if(el&&header)el.style.paddingTop=header.offsetHeight+'px';
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target);}
    });
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  (el||document).querySelectorAll('.blog-reveal').forEach(function(el){obs.observe(el);});
})();`;
}

function buildBlogJsonLd(
  posts: BlogPost[],
  origin: string,
  baseUrl: string,
  page: number,
  _totalPages: number,
  siteConfig: SiteConfig,
  sectionTitle?: string,
): string {
  const siteName = siteConfig.name;
  const siteDescription = sectionTitle
    ? `Artigos sobre ${sectionTitle}`
    : siteConfig.description;
  const pageUrl = `${origin}${baseUrl}`;
  const fullUrl = page === 1 ? pageUrl : `${pageUrl}?page=${page}`;

  // CollectionPage for all pages
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": fullUrl,
    "url": fullUrl,
    "name": sectionTitle ??
      (page === 1 ? siteName : `${siteName} — Página ${page}`),
    "inLanguage": "pt-BR",
    "description": siteDescription,
    "isPartOf": { "@id": `${origin}/` },
    ...(page > 1
      ? {
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": siteName,
              "item": `${origin}/`,
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": `Página ${page}`,
              "item": fullUrl,
            },
          ],
        },
      }
      : {}),
  };

  const jsonLds: object[] = [collectionPage];

  // WebSite + SearchAction only on homepage page 1
  if (page === 1 && !sectionTitle) {
    jsonLds.unshift(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        "url": `${origin}/`,
        "name": siteName,
        "description": siteConfig.description,
        "inLanguage": "pt-BR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${origin}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        "name": siteName,
        "url": `${origin}/`,
        "logo": siteConfig.favicon
          ? { "@type": "ImageObject", "url": siteConfig.favicon }
          : { "@type": "ImageObject", "url": `${origin}/favicon.svg` },
      },
    );

    // Blog entity with blogPost ItemList
    const blogPosting = posts.slice(0, 10).map((p, i) => ({
      "@type": "BlogPosting",
      "@id": `${origin}/${p.slug}`,
      "position": i + 1,
      "url": `${origin}/${p.slug}`,
      "headline": p.title,
      "description": p.excerpt ?? "",
      "datePublished": p.date ?? undefined,
      "image": p.image ?? undefined,
      "inLanguage": "pt-BR",
      "author": ((p.authors as Array<{ name: string }> | undefined) ?? []).map((
        a,
      ) => ({
        "@type": "Person",
        "name": a.name,
      })),
    }));

    jsonLds.push({
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${origin}/#blog`,
      "url": `${origin}/`,
      "name": siteName,
      "description": siteConfig.description,
      "inLanguage": "pt-BR",
      "publisher": { "@id": `${origin}/#organization` },
      "blogPost": blogPosting,
    });
  }

  return JSON.stringify(jsonLds);
}

export default function BlogHome({
  posts,
  perPage = 10,
  sectionTitle,
  baseUrl,
  // @ts-ignore injected by loader
  currentPage = 1,
  // @ts-ignore injected by loader
  query = "",
  // @ts-ignore injected by loader
  origin = "",
  // @ts-ignore injected by loader
  siteConfig = getSiteConfig(),
}: Props & {
  currentPage?: number;
  query?: string;
  origin?: string;
  siteConfig?: SiteConfig;
}) {
  const all = posts ?? [];
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * perPage;
  const visible = all.slice(startIdx, startIdx + perPage);

  const isFirstPage = page === 1 && !sectionTitle;
  const heroPost = isFirstPage ? visible[0] : null;
  const duoPosts = isFirstPage ? visible.slice(1, 3) : [];
  const listPosts = isFirstPage ? visible.slice(3) : visible;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const containerId = `blog-home-${page}`;
  const paginationBase = baseUrl ?? "";
  const prevHref = page - 1 <= 1
    ? paginationBase || "/"
    : `${paginationBase}?page=${page - 1}`;
  const nextHref = `${paginationBase}?page=${page + 1}`;

  const jsonLd = buildBlogJsonLd(
    all,
    origin,
    paginationBase || "/",
    page,
    totalPages,
    siteConfig,
    sectionTitle,
  );

  return (
    <div className="bg-white min-h-screen" id={containerId} data-blog-index="">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <style dangerouslySetInnerHTML={{ __html: REVEAL_CSS }} />

      {/* Page title for category/author views */}
      {sectionTitle && (
        <div className="border-b border-[#e4e3df]">
          <div className="max-w-[1280px] mx-auto px-[clamp(1rem,3vw,2rem)] py-12 md:py-16">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#ff6011] mb-4">
              Blog
            </p>
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#1a1a18] tracking-tight leading-tight [text-wrap:balance] mb-3">
              {sectionTitle}
            </h1>
            {query && (
              <p className="text-[#7a7a74] text-base leading-relaxed max-w-[520px]">
                {all.length} {all.length === 1 ? "resultado" : "resultados"}
                {" "}
                para &ldquo;<strong>{query}</strong>&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cover Story Hero */}
      {isFirstPage && heroPost && (
        <div className="border-b border-[#e4e3df]">
          <a
            href={`/${heroPost.slug}`}
            className="blog-reveal grid grid-cols-1 md:grid-cols-2 group no-underline text-inherit"
          >
            {/* Left — text */}
            <div className="flex flex-col justify-center py-12 md:py-16 px-6 md:pr-14 md:pl-[clamp(1.5rem,5vw,4rem)] order-2 md:order-1 bg-white">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#ff6011] mb-5">
                Cover Story
              </span>
              <h2 className="font-bold leading-[1.1] tracking-tight mb-5 text-[#808080] break-words [text-wrap:balance] text-[clamp(1.8rem,3.5vw,3rem)] line-clamp-4 group-hover:text-[#ff6011] transition-colors duration-150">
                {heroPost.title}
              </h2>
              {heroPost.excerpt && (
                <p className="text-[#4a4a46] text-base leading-relaxed mb-6 line-clamp-3">
                  {heroPost.excerpt}
                </p>
              )}
              {heroPost.date && (
                <span className="text-xs text-[#a0a09a]">
                  {formatDate(heroPost.date)}
                </span>
              )}
            </div>
            {/* Right — image */}
            <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto md:[min-height:clamp(440px,66vh,680px)] order-1 md:order-2 bg-[#f3f2ee]">
              {heroPost.image && (
                <img
                  src={heroPost.image}
                  alt={heroPost.alt || heroPost.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width={1280}
                  height={720}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              )}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{
                  height: 220,
                  background:
                    "linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.18) 55%,transparent 100%)",
                  zIndex: 1,
                }}
              />
            </div>
          </a>
        </div>
      )}

      {/* Magazine Duo */}
      {isFirstPage && duoPosts.length > 0 && (
        <div className="border-b border-[#e4e3df]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {duoPosts.map((post, i) => (
              <a
                key={post.slug}
                href={`/${post.slug}`}
                className={`blog-reveal flex flex-col gap-5 p-6 md:p-10 group no-underline text-inherit${
                  i === 0
                    ? " border-b md:border-b-0 md:border-r border-[#e4e3df]"
                    : ""
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {post.image && (
                  <div className="overflow-hidden aspect-[16/9] bg-[#f3f2ee]">
                    <img
                      src={post.image}
                      alt={post.alt || post.title}
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={360}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold leading-tight tracking-tight text-[#808080] text-[clamp(1.1rem,2vw,1.4rem)] line-clamp-3 group-hover:text-[#ff6011] transition-colors duration-150 [text-wrap:balance]">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-[#7a7a74] text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  {post.date && (
                    <span className="text-xs text-[#a0a09a] mt-1">
                      {formatDate(post.date)}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Section label */}
      {(listPosts.length > 0 || !isFirstPage) && (
        <div className="max-w-[1400px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-10 pb-6 flex items-center gap-4">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#a0a09a] whitespace-nowrap">
            {isFirstPage ? "Mais Recentes" : `Página ${page}`}
          </span>
          <hr className="flex-1 border-0 border-t border-[#e4e3df]" />
        </div>
      )}

      {/* Article Feed */}
      <div className="max-w-[1400px] mx-auto px-[clamp(1rem,3vw,2rem)] pb-10">
        {listPosts.length === 0 && (
          <div className="py-20 flex flex-col items-center text-center gap-4">
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
            <p className="text-[#7a7a74]">Nenhum artigo encontrado.</p>
            <a
              href="/"
              className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#ff6011] no-underline hover:opacity-75 transition-opacity"
            >
              ← Ver todos os artigos
            </a>
          </div>
        )}
        {listPosts.map((post, i) => (
          <a
            key={post.slug}
            href={`/${post.slug}`}
            className={`blog-reveal flex items-start gap-6 py-8 group no-underline text-inherit${
              i < listPosts.length - 1 ? " border-b border-[#e4e3df]" : ""
            }`}
            style={{ transitionDelay: `${Math.min(i, 6) * 60}ms` }}
          >
            <span className="hidden sm:block text-xs font-semibold tracking-[0.12em] text-[#ff6011] tabular-nums w-7 flex-shrink-0 pt-0.5">
              {String(isFirstPage ? i + 4 : startIdx + i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <h3 className="font-bold leading-tight tracking-tight text-[#808080] text-[clamp(1rem,1.5vw,1.25rem)] group-hover:text-[#ff6011] transition-colors duration-150 [text-wrap:balance]">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-[#7a7a74] text-sm leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              {post.date && (
                <span className="text-xs text-[#a0a09a] mt-1">
                  {formatDate(post.date)}
                </span>
              )}
            </div>
            {post.image && (
              <div className="overflow-hidden w-24 sm:w-32 aspect-[4/3] flex-shrink-0 bg-[#f3f2ee]">
                <img
                  src={post.image}
                  alt={post.alt || post.title}
                  loading="lazy"
                  decoding="async"
                  width={128}
                  height={96}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </div>
            )}
          </a>
        ))}
      </div>

      {
        /* Pagination — anchor links trigger full-URL navigation so TanStack
          route loaderDeps picks up the ?page= param and re-runs section loaders */
      }
      {(hasPrev || hasNext) && (
        <nav
          aria-label="Paginação"
          className="flex justify-center items-center gap-4 pb-16"
        >
          {hasPrev
            ? (
              <a
                href={prevHref}
                rel={page > 2 ? "prev" : undefined}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#e4e3df] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1a1a18] hover:bg-[#1a1a18] hover:text-white hover:border-[#1a1a18] transition-colors duration-150 no-underline"
              >
                ← Anterior
              </a>
            )
            : (
              <span
                className="px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#c0bfbb] select-none"
                aria-disabled="true"
              >
                ← Anterior
              </span>
            )}

          <span
            className="text-[11px] text-[#a0a09a] tabular-nums"
            aria-label={`Página ${page} de ${totalPages}`}
          >
            {page} / {totalPages}
          </span>

          {hasNext
            ? (
              <a
                href={nextHref}
                rel="next"
                className="flex items-center gap-2 px-5 py-2.5 border border-[#e4e3df] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1a1a18] hover:bg-[#1a1a18] hover:text-white hover:border-[#1a1a18] transition-colors duration-150 no-underline"
              >
                Próxima →
              </a>
            )
            : (
              <span
                className="px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#c0bfbb] select-none"
                aria-disabled="true"
              >
                Próxima →
              </span>
            )}
        </nav>
      )}

      <script
        defer
        dangerouslySetInnerHTML={{ __html: getRevealScript(containerId) }}
      />
    </div>
  );
}

export const eager = true;
export const sync = true;
