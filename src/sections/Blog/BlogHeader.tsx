import { useId } from "react";

/**
 * Blog header — sticky navigation with reading progress bar, hero mode,
 * and mobile drawer menu.
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
}

const DEFAULT_NAV = [
  { label: "Blog", href: "/" },
  { label: "Categorias", href: "/topics" },
  { label: "Autores", href: "/authors" },
];

// Client-side script for scroll behavior, mobile menu, active nav, search
function getHeaderScript(headerId: string, btnId: string, menuId: string, overlayId: string, progressId: string, searchFormId: string) {
  return `(function() {
  var header = document.getElementById(${JSON.stringify(headerId)});
  var btn = document.getElementById(${JSON.stringify(btnId)});
  var menu = document.getElementById(${JSON.stringify(menuId)});
  var overlay = document.getElementById(${JSON.stringify(overlayId)});
  var progress = document.getElementById(${JSON.stringify(progressId)});
  var searchForm = document.getElementById(${JSON.stringify(searchFormId)});

  var heroImg = document.querySelector('[data-blog-hero-image]');

  if (heroImg && header) {
    var topbarH = header.offsetHeight;
    var postSection = document.querySelector('[data-blog-post-section]');
    if (postSection) postSection.style.paddingTop = topbarH + 'px';
    heroImg.style.marginTop = '-' + topbarH + 'px';

    var onHeroScroll = function() {
      header.classList.toggle('blog-header--scrolled', window.scrollY > topbarH);
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  } else {
    var onScroll = function() {
      var y = window.scrollY;
      if (!header) return;
      if (y > 20) {
        header.classList.add('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
        header.classList.remove('border-b');
      } else {
        header.classList.remove('shadow-[0_1px_24px_rgba(26,26,24,0.08)]');
        header.classList.add('border-b');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (progress) {
    var updateProgress = function() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = Math.min(100, pct) + '%';
      progress.style.opacity = pct > 1 ? '1' : '0';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

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
      el.style.color = '#1a1a18';
      var ind = el.querySelector('[data-nav-ind]');
      if (ind) ind.style.transform = 'scaleX(1)';
    }
  });

  if (!btn || !menu || !overlay) return;

  var openMenu = function() {
    overlay.classList.remove('hidden', 'opacity-0');
    setTimeout(function() { overlay.classList.add('opacity-100'); }, 10);
    menu.classList.remove('-translate-x-full');
    menu.classList.add('translate-x-0');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  var closeMenu = function() {
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
  var closeBtn = menu.querySelector('[data-close-btn]');
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
})();`;
}

export default function BlogHeader({
  logoUrl,
  logoAlt = "Blog",
  showReadingProgress = true,
  navLinks = DEFAULT_NAV,
}: Props) {
  const headerId = useId().replace(/:/g, "-");
  const btnId = useId().replace(/:/g, "-");
  const menuId = useId().replace(/:/g, "-");
  const overlayId = useId().replace(/:/g, "-");
  const progressId = useId().replace(/:/g, "-");
  const searchFormId = useId().replace(/:/g, "-");

  const lineStyle =
    "transform-box:fill-box;transform-origin:center;" +
    "transition:transform 0.28s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease";

  return (
    <>
      {/* Header */}
      <header
        id={headerId}
        data-blog-header=""
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-[12px] border-b border-[#e4e3df] transition-shadow duration-300"
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
              style={{ width: "0%", opacity: 0, transition: "width 100ms linear, opacity 200ms ease" }}
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
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-[44px] w-auto block hover:opacity-70 transition-opacity duration-200"
              />
            ) : (
              <span className="blog-header-logo-text text-[#1a1a18] font-bold text-lg tracking-tight">
                {logoAlt}
              </span>
            )}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
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

            {/* Search icon */}
            <form
              id={searchFormId}
              action="/search"
              method="get"
              className="flex items-center gap-2"
              role="search"
            >
              <input
                type="search"
                name="q"
                placeholder="Buscar..."
                aria-label="Buscar artigos"
                className="hidden md:block w-0 focus:w-36 text-sm border-0 border-b border-[#e4e3df] focus:border-[#ff6011] bg-transparent outline-none transition-all duration-300 pb-0.5 text-[#1a1a18] placeholder:text-[#a0a09a]"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="flex items-center justify-center w-8 h-8 text-[#7a7a74] hover:text-[#ff6011] transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </form>
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
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="7" x2="20" y2="7" style={{ ...{ transformBox: "fill-box", transformOrigin: "center" }, transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease" }} />
              <line x1="4" y1="12" x2="20" y2="12" style={{ ...{ transformBox: "fill-box", transformOrigin: "center" }, transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease" }} />
              <line x1="4" y1="17" x2="20" y2="17" style={{ ...{ transformBox: "fill-box", transformOrigin: "center" }, transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease" }} />
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
          {logoUrl ? (
            <a href="/" className="flex items-center">
              <img src={logoUrl} alt={logoAlt} loading="eager" className="h-[28px] w-auto block" />
            </a>
          ) : (
            <span className="font-bold text-[#1a1a18]">{logoAlt}</span>
          )}
          <button
            data-close-btn=""
            aria-label="Fechar menu"
            className="flex items-center justify-center w-9 h-9 text-[#7a7a74] hover:text-[#1a1a18] transition-colors duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile search */}
        <div className="px-6 py-4 border-b border-[#f0efeb]">
          <form action="/search" method="get" role="search" className="flex items-center gap-2 border border-[#e4e3df] rounded px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[#a0a09a] flex-shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Buscar artigos..."
              aria-label="Buscar artigos"
              className="flex-1 text-sm bg-transparent outline-none text-[#1a1a18] placeholder:text-[#a0a09a]"
            />
          </form>
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

      <script
        defer
        dangerouslySetInnerHTML={{
          __html: getHeaderScript(headerId, btnId, menuId, overlayId, progressId, searchFormId),
        }}
      />
    </>
  );
}

export const eager = true;
export const sync = true;
export const layout = true;
