import type { BlogPost } from "@decocms/apps/blog/types";
import type { Author } from "@decocms/apps/blog/types";
import { getSiteConfig, type SiteConfig } from "../../utils/site-config";

export interface Props {
  /**
   * @title Posts para busca
   * @description Conecte ao blog/loaders/BlogpostList.ts com todos os posts
   */
  posts?: BlogPost[];
}

function highlight(text: string, query: string): string {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return text.replace(
    re,
    '<mark class="bg-[#fff3cd] text-inherit not-italic">$1</mark>',
  );
}

function matchesQuery(post: BlogPost, q: string): boolean {
  const lq = q.toLowerCase();
  if (post.title?.toLowerCase().includes(lq)) return true;
  if (post.excerpt?.toLowerCase().includes(lq)) return true;
  if (post.categories?.some((c) => c.name.toLowerCase().includes(lq))) {
    return true;
  }
  const authors = (post.authors as Author[] | undefined) ?? [];
  if (authors.some((a) => a.name.toLowerCase().includes(lq))) return true;
  return false;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function loader(
  props: Props,
  req: Request,
): Promise<Props & { query: string; origin: string; siteConfig: SiteConfig }> {
  const url = new URL(req.url);
  return {
    ...props,
    query: url.searchParams.get("q") ?? "",
    origin: url.origin,
    siteConfig: getSiteConfig(),
  };
}

interface BlogSearchProps extends Props {
  query?: string;
  origin?: string;
  // @ts-ignore injected by loader
  siteConfig?: SiteConfig;
}

export default function BlogSearch(
  { posts, query = "", origin = "", siteConfig = getSiteConfig() }:
    BlogSearchProps,
) {
  const safePosts = posts ?? [];
  const filtered = query.trim()
    ? safePosts.filter((p) => matchesQuery(p, query.trim()))
    : [];

  const siteName = siteConfig.name;
  const searchUrl = `${origin}/search${
    query ? `?q=${encodeURIComponent(query)}` : ""
  }`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "url": searchUrl,
    "name": query ? `Busca: ${query} â€” ${siteName}` : `Busca â€” ${siteName}`,
    "description": query
      ? `${filtered.length} resultado${
        filtered.length !== 1 ? "s" : ""
      } para "${query}" no ${siteName}.`
      : `Busque artigos no ${siteName}.`,
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
          "name": "Busca",
          "item": searchUrl,
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-white" data-blog-index="">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      {/* â”€â”€ Page header â”€â”€ */}
      <div className="border-b border-[#e4e3df]">
        <div className="max-w-[1200px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-12 pb-8">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase text-[#a0a09a] mb-6"
            aria-label="Breadcrumb"
          >
            <a
              href="/"
              className="hover:text-[#ff6011] transition-colors no-underline"
            >
              {siteName}
            </a>
            <span aria-hidden="true">â€º</span>
            <span>Busca</span>
          </nav>

          {/* Search-as-heading â€” the query IS the page title */}
          <form
            action="/search"
            method="get"
            role="search"
            aria-label="Refinar busca"
          >
            <label htmlFor="search-input" className="sr-only">
              Buscar artigos
            </label>
            <div className="flex items-center gap-3 group">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="flex-shrink-0 text-[#c0bfbb]"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                id="search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Buscar artigos..."
                aria-label="Buscar artigos"
                autoFocus={!query}
                className="flex-1 text-[clamp(1.5rem,4vw,2.25rem)] font-bold text-[#1a1a18] bg-transparent outline-none placeholder:text-[#d4d3cf] placeholder:font-normal leading-tight"
              />
            </div>
            {/* visually hidden submit for keyboard/assistive tech */}
            <button type="submit" className="sr-only">Buscar</button>
          </form>

          {/* Count */}
          {query && (
            <p className="mt-4 text-sm text-[#7a7a74]">
              {filtered.length === 0 ? "Nenhum resultado" : (
                <>
                  <span className="font-semibold text-[#1a1a18]">
                    {filtered.length}
                  </span>{" "}
                  {filtered.length === 1 ? "resultado" : "resultados"}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* â”€â”€ Results / States â”€â”€ */}
      <div className="max-w-[1200px] mx-auto px-[clamp(1rem,3vw,2rem)] py-8">
        {/* Empty / initial state */}
        {!query && (
          <div className="flex flex-col items-center text-center py-24 gap-4 text-[#c0bfbb]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-lg font-medium">
              Digite algo acima para buscar
            </p>
            <p className="text-sm max-w-xs">
              Procure por título, descrição, categoria ou autor
            </p>
          </div>
        )}

        {/* No results */}
        {query && filtered.length === 0 && (
          <div className="flex flex-col items-center text-center py-24 gap-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              className="text-[#d4d3cf]"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-lg font-semibold text-[#1a1a18]">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-[#7a7a74]">
              Tente outras palavras ou navegue pelos{" "}
              <a
                href="/topics"
                className="text-[#ff6011] underline-offset-2 hover:opacity-80 transition-opacity"
              >
                tópicos
              </a>
            </p>
          </div>
        )}

        {/* Results */}
        {query && filtered.length > 0 && (
          <div
            className="flex flex-col divide-y divide-[#f0efeb]"
            aria-label={`${filtered.length} resultados para "${query}"`}
          >
            {filtered.map((post) => {
              const authors = (post.authors as Author[] | undefined) ?? [];
              const firstAuthor = authors[0];
              return (
                <article key={post.slug} className="py-7 group">
                  <a href={`/${post.slug}`} className="no-underline block">
                    <div className="flex gap-5 items-start">
                      {/* Thumbnail */}
                      {post.image && (
                        <div className="flex-shrink-0 hidden sm:block w-[120px] h-[80px] overflow-hidden rounded bg-[#f0efeb]">
                          <img
                            src={post.image}
                            alt={post.alt || post.title}
                            loading="lazy"
                            decoding="async"
                            width={120}
                            height={80}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[350ms]"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {post.categories?.[0] && (
                          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#ff6011] block mb-1">
                            {post.categories[0].name}
                          </span>
                        )}
                        <h2
                          className="text-[clamp(1rem,2vw,1.2rem)] font-bold text-[#1a1a18] leading-snug mb-1.5 group-hover:text-[#ff6011] transition-colors duration-150 [text-wrap:balance]"
                          dangerouslySetInnerHTML={{
                            __html: highlight(post.title, query),
                          }}
                        />
                        {post.excerpt && (
                          <p
                            className="text-sm text-[#7a7a74] leading-relaxed line-clamp-2 [text-wrap:pretty]"
                            dangerouslySetInnerHTML={{
                              __html: highlight(post.excerpt, query),
                            }}
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                          {firstAuthor && (
                            <span className="text-xs text-[#a0a09a]">
                              {firstAuthor.name}
                            </span>
                          )}
                          {post.date && firstAuthor && (
                            <span
                              className="text-[#e4e3df] text-xs"
                              aria-hidden="true"
                            >
                              Â·
                            </span>
                          )}
                          {post.date && (
                            <time
                              className="text-xs text-[#a0a09a]"
                              dateTime={post.date}
                            >
                              {formatDate(post.date)}
                            </time>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const eager = true;
