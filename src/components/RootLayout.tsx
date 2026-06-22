import { useEffect, type ReactNode } from "react";
import { HeadContent, Scripts, ScriptOnce, ScrollRestoration } from "@tanstack/react-router";
import {
  LiveControls,
  NavigationProgress,
  StableOutlet,
} from "@decocms/start/hooks";

declare global {
  interface Window {
    __deco_ready?: boolean;
  }
}

function buildDecoEventsBootstrap(): string {
  return `
window.__RUNTIME__ = window.__RUNTIME__ || {};
window.DECO = window.DECO || {};
window.DECO.events = window.DECO.events || {
  _q: [],
  _subs: [],
  dispatch: function(e) {
    this._q.push(e);
    for (var i = 0; i < this._subs.length; i++) {
      try { this._subs[i](e); } catch(err) { console.error('[DECO.events]', err); }
    }
  },
  subscribe: function(fn) {
    this._subs.push(fn);
    for (var i = 0; i < this._q.length; i++) {
      try { fn(this._q[i]); } catch(err) {}
    }
  }
};
window.dataLayer = window.dataLayer || [];
`;
}

// Polyfill for hx-on:* attributes and inline module scripts injected by deco sections
const HX_ON_POLYFILL = `
(function(){
  if (window.__hxOnPolyfilled) return;
  window.__hxOnPolyfilled = true;
  var WIRED = new WeakSet();

  function wireOne(el) {
    if (!el.attributes || WIRED.has(el)) return;
    var toWire = [];
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (attr.name.indexOf('hx-on:') !== 0) continue;
      toWire.push({ event: attr.name.slice(6), code: attr.value });
    }
    if (!toWire.length) return;
    for (var j = 0; j < toWire.length; j++) {
      try {
        var handler = new Function('event', toWire[j].code);
        el.addEventListener(toWire[j].event, handler);
      } catch (e) {
        console.warn('[hx-on polyfill] failed to wire', toWire[j].event, e);
      }
    }
    WIRED.add(el);
  }

  function wireAll(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    var sel = '[hx-on\\\\:click],[hx-on\\\\:input],[hx-on\\\\:change],[hx-on\\\\:submit],[hx-on\\\\:mousemove],[hx-on\\\\:mouseleave],[hx-on\\\\:mouseenter],[hx-on\\\\:scroll],[hx-on\\\\:load]';
    scope.querySelectorAll(sel).forEach(wireOne);
  }

  function wireAllSafe() { try { wireAll(); } catch(e) {} }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAllSafe);
  } else {
    wireAllSafe();
  }

  var EXECUTED_SCRIPTS = new WeakSet();
  function execInlineScripts(scope) {
    var scripts = (scope || document).querySelectorAll('script[type="module"]:not([src])');
    scripts.forEach(function(s) {
      if (EXECUTED_SCRIPTS.has(s)) return;
      var body = s.textContent || '';
      if (!/^\\s*\\(/.test(body)) { EXECUTED_SCRIPTS.add(s); return; }
      try { new Function(body)(); } catch (e) { console.warn('[inline-script polyfill]', e); }
      EXECUTED_SCRIPTS.add(s);
    });
  }
  function execSafe() { try { execInlineScripts(); } catch(e) {} }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', execSafe);
  } else {
    execSafe();
  }

  var mo = new MutationObserver(function(muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      for (var k = 0; k < m.addedNodes.length; k++) {
        var n = m.addedNodes[k];
        if (n.nodeType === 1) {
          wireOne(n);
          if (n.querySelectorAll) { wireAll(n); execInlineScripts(n); }
        }
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
`;

export interface RootLayoutProps {
  lang?: string;
  dataTheme?: string;
  siteName: string;
  bodyClassName?: string;
  decoReadyDelay?: number;
  children?: ReactNode;
}

export function RootLayout({
  lang = "pt-BR",
  dataTheme = "light",
  siteName,
  bodyClassName = "bg-white text-[#1a1a18]",
  decoReadyDelay = 500,
  children,
}: RootLayoutProps) {
  useEffect(() => {
    const id = setTimeout(() => {
      window.__deco_ready = true;
      document.dispatchEvent(new Event("deco:ready"));
    }, decoReadyDelay);
    return () => clearTimeout(id);
  }, [decoReadyDelay]);

  return (
    <html lang={lang} data-theme={dataTheme} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className={bodyClassName} suppressHydrationWarning>
        <ScriptOnce children={buildDecoEventsBootstrap()} />
        <ScriptOnce children={HX_ON_POLYFILL} />
        <NavigationProgress />
        <main>
          <StableOutlet />
        </main>
        {children}
        <LiveControls site={siteName} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
