import { useId } from "react";
import type { BlogPost } from "@decocms/apps/blog/types";
import BlogpostList from "../../loaders/BlogpostList";

/**
 * Blog header — sticky navigation with reading progress bar, hero mode,
 * mobile drawer menu, and Cmd+K search command palette.
 *
 * Hero mode: when a [data-blog-hero-image] is present on the page,
 * the header starts transparent (CSS :has() in app.css), then transitions
 * to white/blurred on scroll — zero FOUC.
 */
export interface Props {
  /**
   * @title URL do Logo
   */
  logoUrl?: string;
  /**
   * @title Alt do Logo
   */
  logoAlt?: string;
  /**
   * @title Barra de progresso de leitura
   */
  showReadingProgress?: boolean;
  /**
   * @title Links de navegação
   */
  navLinks?: Array<{ label: string; href: string }>;
  /**
   * @title Posts para busca em tempo real
   * @description Conecte ao loader blog/loaders/BlogpostList.ts (count >= 100) para habilitar busca instantânea no modal
   */
  posts?: BlogPost[] | null;
}

const DEFAULT_NAV = [
  { label: "Blog", href: "/" },
  { label: "Categorias", href: "/topics" },
  { label: "Autores", href: "/authors" },
];

const DIALOG_CSS = `
.blog-search-dialog {
  border: none;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 8px 48px rgba(26,26,24,0.22), 0 2px 12px rgba(26,26,24,0.10);
  max-width: 580px;
  width: calc(100vw - 2rem);
  position: fixed;
  top: 14vh;
  left: 0;
  right: 0;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
}
.blog-search-dialog::backdrop {
  background: rgba(26,26,24,0.48);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
@media (max-width: 640px) {
  .blog-search-dialog {
    top: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 0 0 14px 14px;
  }
}
`;

function getHeaderScript(
  headerId: string,
  btnId: string,
  menuId: string,
  overlayId: string,
  progressId: string,
  dialogId: string,
  searchInputId: string,
  resultsId: string,
  postsDataId: string,
) {
  return `(function() {
  var header = document.getElementById(${JSON.stringify(headerId)});
  var btn = document.getElementById(${JSON.stringify(btnId)});
  var menu = document.getElementById(${JSON.stringify(menuId)});
  var overlay = document.getElementById(${JSON.stringify(overlayId)});
  var progress = document.getElementById(${JSON.stringify(progressId)});
  var dialog = document.getElementById(${JSON.stringify(dialogId)});
  var searchInput = document.getElementById(${JSON.stringify(searchInputId)});
  var resultsEl = document.getElementById(${JSON.stringify(resultsId)});
  var postsDataEl = document.getElementById(${JSON.stringify(postsDataId)});
  var postsData = postsDataEl ? (function(){try{return JSON.parse(postsDataEl.textContent||'[]');}catch(e){return[];}})() : [];

  // ── Scroll / hero behavior ──────────────────────────────────────────────
  var heroIO = null;

  function applyHeroLayout(heroImg) {
    if (!heroImg || !header) return;
    var topbarH = header.offsetHeight;
    var postSection = document.querySelector('[data-blog-post-section]');
    if (postSection) postSection.style.paddingTop = topbarH + 'px';
    heroImg.style.marginTop = '-' + topbarH + 'px';
  }

  function updateShadow() {
    if (!header || document.querySelector('[data-blog-hero-image]')) return;
    var y = window.scrollY;
    if (y > 20) {
      header.classList.add('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
      header.classList.remove('border-b');
    } else {
      header.classList.remove('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
      header.classList.add('border-b');
    }
  }

  function setupScrollBehavior() {
    if (heroIO) { heroIO.disconnect(); heroIO = null; }
    var heroImg = document.querySelector('[data-blog-hero-image]');
    if (heroImg && header) {
      applyHeroLayout(heroImg);
      // IntersectionObserver: header turns opaque when hero fully exits viewport
      heroIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (!header) return;
          var gone = !e.isIntersecting;
          header.classList.toggle('blog-header--scrolled', gone);
          if (gone) {
            header.classList.add('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
            header.classList.remove('border-b');
          } else {
            header.classList.remove('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
            header.classList.add('border-b');
          }
        });
      }, { threshold: 0 });
      heroIO.observe(heroImg);
    } else if (header) {
      header.classList.remove('blog-header--scrolled');
      updateShadow();
    }
  }

  // Shadow for non-hero pages
  window.addEventListener('scroll', updateShadow, { passive: true });

  // SPA navigation: re-setup when hero image appears or disappears
  var prevHasHero = !!document.querySelector('[data-blog-hero-image]');
  new MutationObserver(function() {
    var hasHero = !!document.querySelector('[data-blog-hero-image]');
    if (hasHero !== prevHasHero) {
      prevHasHero = hasHero;
      setupScrollBehavior();
    }
  }).observe(document.body, { childList: true, subtree: true });

  setupScrollBehavior();

  if (progress) {
    var updateProgress = function() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = Math.min(100, pct) + '%';
      progress.style.opacity = pct > 1 ? '1' : '0';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  // Active nav highlight + aria-current
  var p = window.location.pathname;
  document.querySelectorAll('[data-blog-nav]').forEach(function(el) {
    var href = el.getAttribute('href') || '';
    var active = false;
    if (href === '/') {
      active = p === '/' || (p.length > 1 && !p.startsWith('/topics') && !p.startsWith('/authors') && !p.startsWith('/search'));
    } else if (href.length > 1) {
      active = p.startsWith(href);
    }
    if (active) {
      el.setAttribute('aria-current', 'page');
      el.style.color = '#1a1a18';
      var ind = el.querySelector('[data-nav-ind]');
      if (ind) ind.style.transform = 'scaleX(1)';
    }
  });

  // Mobile drawer
  var openMenu = function() {};
  var closeMenu = function() {};

  if (btn && menu && overlay) {
    openMenu = function() {
      overlay.classList.remove('hidden', 'opacity-0');
      setTimeout(function() { overlay.classList.add('opacity-100'); }, 10);
      menu.classList.remove('-translate-x-full');
      menu.classList.add('translate-x-0');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    closeMenu = function() {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      setTimeout(function() { overlay.classList.add('hidden'); }, 300);
      menu.classList.remove('translate-x-0');
      menu.classList.add('-translate-x-full');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    btn.addEventListener('click', function() {
      btn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeMenu); });
    var closeDrawerBtn = menu.querySelector('[data-close-btn]');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeMenu);
  }

  // ── Search dialog ─────────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function openSearch() {
    closeMenu();
    if (!dialog) return;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    renderResults('');
  }

  function closeSearch() {
    if (dialog) dialog.close();
  }

  function renderResults(q) {
    if (!resultsEl) return;
    var lq = q.trim().toLowerCase();
    var results;
    if (!lq) {
      results = postsData.slice(0, 5);
    } else {
      results = postsData.filter(function(post) {
        return post.t.toLowerCase().indexOf(lq) !== -1 ||
               (post.e && post.e.toLowerCase().indexOf(lq) !== -1) ||
               (post.c && post.c.toLowerCase().indexOf(lq) !== -1);
      }).slice(0, 6);
    }

    var html = '';
    if (results.length === 0 && lq) {
      html = '<div style="padding:28px 20px;text-align:center;">' +
             '<p style="font-size:13px;color:#7a7a74;margin:0 0 12px;">Nenhum resultado para &ldquo;' + escHtml(q) + '&rdquo;</p>' +
             '<a href="/search?q=' + encodeURIComponent(q) + '" style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ff6011;text-decoration:none;">Buscar em todas as páginas →</a>' +
             '</div>';
    } else if (results.length === 0) {
      html = '<div style="padding:28px 20px;text-align:center;font-size:13px;color:#7a7a74;">Digite para buscar artigos...</div>';
    } else {
      html = results.map(function(post) {
        return '<a href="/' + escHtml(post.s) + '" class="bsd-result" style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid #f0efeb;text-decoration:none;color:inherit;transition:background 120ms;">' +
               '<div style="flex-shrink:0;padding-top:1px;">' +
               '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a09a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
               '</div>' +
               '<div style="flex:1;min-width:0;">' +
               '<div class="bsd-title" style="font-size:13px;font-weight:600;color:#1a1a18;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 120ms;">' + escHtml(post.t) + '</div>' +
               (post.e ? '<div style="font-size:11px;color:#7a7a74;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">' + escHtml(post.e) + '</div>' : '') +
               '</div>' +
               '</a>';
      }).join('');
      if (lq) {
        html += '<a href="/search?q=' + encodeURIComponent(q) + '" style="display:flex;align-items:center;justify-content:center;padding:10px 16px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ff6011;text-decoration:none;border-top:1px solid #f0efeb;">Ver todos os resultados →</a>';
      }
    }
    resultsEl.innerHTML = html;
    resultsEl.querySelectorAll('.bsd-result').forEach(function(el) {
      el.addEventListener('mouseenter', function() { el.style.background = '#f8f7f3'; el.querySelector('.bsd-title').style.color = '#ff6011'; });
      el.addEventListener('mouseleave', function() { el.style.background = ''; el.querySelector('.bsd-title').style.color = '#1a1a18'; });
    });
  }

  // Open triggers (search icon button in header + mobile drawer)
  document.querySelectorAll('[data-open-search]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openSearch();
    });
  });

  // Cmd+K / Ctrl+K global shortcut
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // Dialog native events
  if (dialog) {
    dialog.addEventListener('close', function() {
      document.body.style.overflow = '';
    });
    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) dialog.close();
    });
  }

  // Close button inside dialog
  var searchCloseBtn = dialog && dialog.querySelector('[data-search-close]');
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      renderResults(searchInput.value);
    });
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var q = searchInput.value.trim();
        window.location.assign('/search?q=' + encodeURIComponent(q));
      }
    });
  }
})();`;
}

export async function loader(props: Props, _req: Request): Promise<Props> {
  if (props.posts != null) return props;
  const posts = await BlogpostList({ count: 100, sortBy: "date_desc" });
  return { ...props, posts: posts ?? [] };
}

export default function BlogHeader({
  logoUrl,
  logoAlt = "Blog",
  showReadingProgress = true,
  navLinks = DEFAULT_NAV,
  posts,
}: Props) {
  const toId = (s: string) => s.replace(/:/g, "-");
  const headerId = toId(useId());
  const btnId = toId(useId());
  const menuId = toId(useId());
  const overlayId = toId(useId());
  const progressId = toId(useId());
  const dialogId = toId(useId());
  const searchInputId = toId(useId());
  const resultsId = toId(useId());
  const postsDataId = toId(useId());

  // Slim down posts to just what the client-side search needs
  const searchData = (posts ?? []).slice(0, 100).map((p) => ({
    s: p.slug,
    t: p.title ?? "",
    e: p.excerpt ? p.excerpt.slice(0, 120) : "",
    c: (p.categories ?? []).map((c) => c.name ?? "").join(" "),
  }));

  const searchIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DIALOG_CSS }} />

      {/* Header */}
      <header
        id={headerId}
        data-blog-header=""
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-[12px] border-b border-[#e4e3df] transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300"
      >
        {/* Reading progress bar */}
        {showReadingProgress && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div
              id={progressId}
              className="h-full bg-[#1a1a18]"
              style={{
                width: "0%",
                opacity: 0,
                transition: "width 100ms linear, opacity 200ms ease",
              }}
            />
          </div>
        )}

        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16 md:h-[72px] px-[clamp(1rem,0.5rem+2.5vw,2.5rem)]">
          {/* Logo */}
          <a
            href="/"
            className="flex-shrink-0 flex items-center"
            aria-label={logoAlt}
          >
            {logoUrl
              ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="h-[44px] w-auto block hover:opacity-70 transition-opacity duration-200"
                />
              )
              : (
                <span className="blog-header-logo-text text-[#1a1a18] font-bold text-lg tracking-tight">
                  {logoAlt}
                </span>
              )}
          </a>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-7"
            aria-label="Navegação principal"
          >
            {navLinks.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                data-blog-nav=""
                className="relative text-[11px] font-medium tracking-[0.12em] uppercase text-[#7a7a74] hover:text-[#1a1a18] transition-colors duration-150 no-underline py-1 group"
              >
                {label}
                <span
                  data-nav-ind=""
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1a1a18] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
                />
              </a>
            ))}

            {/* Search trigger — opens command palette */}
            <button
              type="button"
              data-open-search=""
              aria-label="Buscar artigos (Cmd+K)"
              className="flex items-center gap-2 text-[#7a7a74] hover:text-[#ff6011] transition-colors duration-150"
            >
              {searchIcon}
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#a0a09a] border border-[#e4e3df] rounded select-none">
                ⌘K
              </kbd>
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            id={btnId}
            className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 text-[#1a1a18]"
            aria-label="Abrir menu"
            aria-expanded="false"
            aria-controls={menuId}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        id={overlayId}
        aria-hidden="true"
        className="hidden opacity-0 fixed inset-0 bg-[rgba(26,26,24,0.4)] z-40 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Mobile drawer */}
      <nav
        id={menuId}
        aria-label="Menu mobile"
        className="fixed top-0 left-0 bottom-0 w-[72vw] max-w-[300px] bg-white z-50 -translate-x-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col overflow-y-auto will-change-transform"
      >
        <div className="flex items-center justify-between h-16 px-4 pl-6 border-b border-[#e4e3df] flex-shrink-0">
          {logoUrl
            ? (
              <a href="/" className="flex items-center">
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  loading="eager"
                  className="h-[28px] w-auto block"
                />
              </a>
            )
            : <span className="font-bold text-[#1a1a18]">{logoAlt}</span>}
          <button
            data-close-btn=""
            aria-label="Fechar menu"
            className="flex items-center justify-center w-9 h-9 text-[#7a7a74] hover:text-[#1a1a18] transition-colors duration-150"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile search — opens the same dialog */}
        <div className="px-6 py-4 border-b border-[#f0efeb]">
          <button
            type="button"
            data-open-search=""
            className="w-full flex items-center gap-2 border border-[#e4e3df] rounded px-3 py-2.5 text-left text-[#a0a09a] hover:border-[#ff6011] hover:text-[#ff6011] transition-colors duration-150"
          >
            <span className="flex-shrink-0 text-[#a0a09a]">{searchIcon}</span>
            <span className="text-sm">Buscar artigos...</span>
          </button>
        </div>

        <div className="py-2 flex-1">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              data-blog-nav=""
              className="flex items-center px-6 py-3.5 text-[11px] font-medium tracking-[0.12em] uppercase text-[#1a1a18] no-underline border-b border-[#f0efeb] hover:text-[#ff6011] transition-colors duration-150"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Command palette — search dialog */}
      <dialog id={dialogId} className="blog-search-dialog">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-[#e4e3df] h-14">
          <span className="flex-shrink-0 text-[#a0a09a]">{searchIcon}</span>
          <input
            id={searchInputId}
            type="search"
            placeholder="Buscar artigos..."
            autoComplete="off"
            className="flex-1 h-full text-sm text-[#1a1a18] bg-transparent outline-none placeholder:text-[#a0a09a]"
          />
          <button
            type="button"
            data-search-close=""
            aria-label="Fechar busca"
            className="flex-shrink-0 text-[10px] font-semibold tracking-wider text-[#a0a09a] hover:text-[#1a1a18] border border-[#e4e3df] rounded px-1.5 py-0.5 transition-colors duration-150"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          id={resultsId}
          style={{ maxHeight: "340px", overflowY: "auto" }}
        >
          <div
            style={{
              padding: "28px 20px",
              textAlign: "center",
              fontSize: "13px",
              color: "#7a7a74",
            }}
          >
            Digite para buscar artigos...
          </div>
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-5 px-4 py-2 border-t border-[#e4e3df]">
          <span className="text-[10px] text-[#c0bfbb]">↵ buscar</span>
          <span className="text-[10px] text-[#c0bfbb]">esc fechar</span>
          {posts && posts.length > 0 && (
            <span className="ml-auto text-[10px] text-[#c0bfbb]">
              {posts.length} artigos
            </span>
          )}
        </div>
      </dialog>

      {/* Posts data for real-time search filtering */}
      <script
        id={postsDataId}
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchData) }}
      />

      <script
        defer
        dangerouslySetInnerHTML={{
          __html: getHeaderScript(
            headerId,
            btnId,
            menuId,
            overlayId,
            progressId,
            dialogId,
            searchInputId,
            resultsId,
            postsDataId,
          ),
        }}
      />
    </>
  );
}

export const eager = true;
export const sync = true;
export const layout = true;
