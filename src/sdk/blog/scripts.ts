/**
 * Inline scripts injected by blog sections via
 * `<script dangerouslySetInnerHTML={{ __html: ... }} />`. They run before
 * hydration, so they must be self-contained ES5 IIFEs.
 */

/**
 * Reveals `.blog-reveal` elements inside `containerId` as they scroll into
 * view. With `offsetHeader`, also pads the container by the fixed header height.
 *
 * The script runs once, when the HTML is parsed. In Studio a save re-renders
 * the page in place (StudioRefresh), which runs no script again: a section may
 * get new cards, have a card's class reset, or be remounted as a new element
 * when a section above it is added or removed. So the script watches the
 * document and observes the cards that appear, finding the container by its
 * id each time; a visitor's page loads as before.
 */
export function revealScript(
  containerId: string,
  { offsetHeader = false }: { offsetHeader?: boolean } = {},
): string {
  return `(function(){
  var id=${JSON.stringify(containerId)};
  ${offsetHeader ? "" : "if(!document.getElementById(id))return;"}
  var o=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target);}
    });
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  var watch=function(){
    var c=document.getElementById(id);
    ${
      offsetHeader
        ? "var h=document.querySelector('[data-blog-header]');if(c&&h&&!c.style.paddingTop)c.style.paddingTop=h.offsetHeight+'px';"
        : "if(!c)return;"
    }
    (c||document).querySelectorAll('.blog-reveal:not(.is-visible)').forEach(function(el){o.observe(el);});
  };
  watch();
  if(!window.MutationObserver)return;
  new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var r=records[i],t=r.target;
      if(r.type==='childList'?r.addedNodes.length:t.classList.contains('blog-reveal')&&!t.classList.contains('is-visible')){watch();return;}
    }
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();`;
}

/**
 * Highlights the TOC link of the heading currently in view. Like
 * `revealScript`, it follows a post Studio re-renders in place: the TOC
 * (`[data-blog-toc]`, or `navId`) is looked up again when nodes are added.
 */
export function tocScript(navId: string): string {
  return `(function(){
  var find = function() { return document.getElementById(${JSON.stringify(navId)}) || document.querySelector('[data-blog-toc]'); };
  if (!find()) return;
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
    var nav = find();
    links = nav ? Array.from(nav.querySelectorAll('a[data-anchor]')) : [];
    links.forEach(function(l) {
      var h = l.dataset.anchor ? document.getElementById(l.dataset.anchor) : null;
      if (h) io.observe(h);
    });
  };
  watch();
  if (!window.MutationObserver) return;
  new MutationObserver(function(records) {
    for (var i = 0; i < records.length; i++) if (records[i].addedNodes.length) { watch(); return; }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();`;
}
