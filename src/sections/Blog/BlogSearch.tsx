import type { BlogPost } from "@decocms/apps/blog/types";
import type { Author } from "@decocms/apps/blog/types";

export interface Props {
  /**
   * @title Posts para busca
   * @description Conecte ao blog/loaders/BlogpostList.ts com todos os posts
   */
  posts?: BlogPost[];
  /** @title Placeholder do campo de busca */
  placeholder?: string;
}

function highlight(text: string, query: string): string {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return text.replace(re, '<mark class="bg-[#fff3cd] text-inherit not-italic">$1</mark>');
}

function matchesQuery(post: BlogPost, q: string): boolean {
  const lq = q.toLowerCase();
  if (post.title?.toLowerCase().includes(lq)) return true;
  if (post.excerpt?.toLowerCase().includes(lq)) return true;
  if (post.categories?.some((c) => c.name.toLowerCase().includes(lq))) return true;
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

export async function loader(props: Props, req: Request): Promise<Props & { query: string }> {
  const url = new URL(req.url);
  return { ...props, query: url.searchParams.get("q") ?? "" };
}

interface BlogSearchProps extends Props {
  query?: string;
}

export default function BlogSearch({ posts, placeholder = "Buscar artigos...", query = "" }: BlogSearchProps) {
  const safePosts = posts ?? [];
  const filtered = query.trim()
    ? safePosts.filter((p) => matchesQuery(p, query.trim()))
    : [];

  return (
    <div className="min-h-screen bg-white" data-blog-index="">
      <div className="max-w-[1200px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-20 pb-24">
        {/* Search header */}
        <div className="mb-10 max-w-[640px]">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#a0a09a] mb-4">
            Pesquisa
          </p>
          <form action="/search" method="get" className="flex items-center gap-3 border border-[#e4e3df] rounded-xl px-4 py-3 bg-[#f7f6f3] focus-within:border-[#ff6011] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[#a0a09a] flex-shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={placeholder}
              aria-label="Buscar artigos"
              className="flex-1 text-[#1a1a18] bg-transparent outline-none text-lg placeholder:text-[#c8c7c2]"
              autoFocus
            />
            <button
              type="submit"
              className="flex-shrink-0 text-sm font-semibold text-white bg-[#ff6011] hover:bg-[#e8510a] transition-colors px-4 py-1.5 rounded-lg"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Empty / initial state */}
        {!query && (
          <div className="text-center py-20 text-[#a0a09a]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="mx-auto mb-4 opacity-40" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-lg font-medium text-[#c8c7c2]">Digite algo para buscar</p>
          </div>
        )}

        {/* No results */}
        {query && filtered.length === 0 && (
          <div className="text-center py-20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="mx-auto mb-4 opacity-30 text-[#a0a09a]" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-lg font-semibold text-[#1a1a18] mb-2">
              Nenhum resultado para "{query}"
            </p>
            <p className="text-[#7a7a74]">
              Tente palavras diferentes ou navegue pelos{" "}
              <a href="/topics" className="text-[#ff6011] underline underline-offset-2 hover:opacity-80 transition-opacity">
                tópicos
              </a>
              .
            </p>
          </div>
        )}

        {/* Results */}
        {query && filtered.length > 0 && (
          <>
            <p className="text-sm text-[#7a7a74] mb-8">
              <span className="font-semibold text-[#1a1a18]">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "resultado" : "resultados"} para{" "}
              <span className="font-semibold text-[#1a1a18]">"{query}"</span>
            </p>

            <div className="flex flex-col divide-y divide-[#f0efeb]">
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
                              alt={(post as any).alt || post.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Category */}
                          {post.categories?.[0] && (
                            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#ff6011] block mb-1">
                              {post.categories[0].name}
                            </span>
                          )}

                          {/* Title */}
                          <h2
                            className="text-lg font-bold text-[#1a1a18] leading-snug mb-2 group-hover:text-[#ff6011] transition-colors duration-200 [text-wrap:balance]"
                            dangerouslySetInnerHTML={{ __html: highlight(post.title, query) }}
                          />

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p
                              className="text-sm text-[#7a7a74] leading-relaxed line-clamp-2 [text-wrap:pretty]"
                              dangerouslySetInnerHTML={{ __html: highlight(post.excerpt, query) }}
                            />
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                            {firstAuthor && (
                              <span className="text-xs text-[#a0a09a]">{firstAuthor.name}</span>
                            )}
                            {post.date && (
                              <>
                                <span className="text-[#e4e3df]" aria-hidden="true">·</span>
                                <time className="text-xs text-[#a0a09a]" dateTime={post.date}>
                                  {formatDate(post.date)}
                                </time>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const eager = true;
export const sync = true;
