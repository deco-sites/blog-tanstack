/**
 * Inline scripts injected by blog sections via
 * `<script dangerouslySetInnerHTML={{ __html: ... }} />`. They run before
 * hydration, so they must be self-contained ES5 IIFEs.
 */

/**
 * Reveals `.blog-reveal` elements inside `containerId` as they scroll into
 * view. With `offsetHeader`, also pads the container by the fixed header height.
 */
export function revealScript(
  containerId: string,
  { offsetHeader = false }: { offsetHeader?: boolean } = {},
): string {
  return `(function(){
  var c=document.getElementById(${JSON.stringify(containerId)});
  ${
    offsetHeader
      ? "var h=document.querySelector('[data-blog-header]');if(c&&h)c.style.paddingTop=h.offsetHeight+'px';"
      : "if(!c)return;"
  }
  var o=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target);}
    });
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  (c||document).querySelectorAll('.blog-reveal').forEach(function(el){o.observe(el);});
})();`;
}

/** Highlights the TOC link of the heading currently in view. */
export function tocScript(navId: string): string {
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
