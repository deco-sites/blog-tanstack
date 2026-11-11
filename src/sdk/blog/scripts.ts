/**
 * Inline scripts injected by blog sections via
 * `<script dangerouslySetInnerHTML={{ __html: ... }} />`. They run before
 * hydration, so they must be self-contained ES5 IIFEs.
 */

/**
 * Reveals `.blog-reveal` elements inside `containerId` as they scroll into
 * view. With `offsetHeader`, also pads the container by the fixed header height.
 * The script runs once, when the HTML is parsed; a section Studio patches in
 * place on a save (StudioRefresh re-renders it, nothing runs the script again)
 * can add cards or reset a card's class, so those are observed as they appear.
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
  var watch=function(){(c||document).querySelectorAll('.blog-reveal:not(.is-visible)').forEach(function(el){o.observe(el);});};
  watch();
  if(window.MutationObserver)new MutationObserver(watch).observe(c||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();`;
}

/**
 * Highlights the TOC link of the heading currently in view. Follows a TOC
 * Studio patches in place (new or renamed headings), as `revealScript` does.
 */
export function tocScript(navId: string): string {
  return `(function(){
  var nav = document.getElementById(${JSON.stringify(navId)});
  if (!nav) return;
  var links = [];
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
  var watch = function() {
    links = Array.from(nav.querySelectorAll('a[data-anchor]'));
    links.forEach(function(l) {
      var h = l.dataset.anchor ? document.getElementById(l.dataset.anchor) : null;
      if (h) io.observe(h);
    });
  };
  watch();
  if (window.MutationObserver) new MutationObserver(watch).observe(nav, { childList: true, subtree: true });
})();`;
}
