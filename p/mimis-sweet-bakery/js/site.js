/* Lenis smooth scroll (inlined, no CDN). The UMD prototype self-assign is stripped so strict mode cannot throw. */
(function(){"use strict";
function t(t,i,e){return Math.max(t,Math.min(i,e))}var i=class{isRunning=!1;value=0;from=0;to=0;currentTime=0;lerp;duration;easing;onUpdate;advance(i){if(!this.isRunning)return;let e=!1;if(this.duration&&this.easing){this.currentTime+=i;const s=t(0,this.currentTime/this.duration,1);e=s>=1;const o=e?1:this.easing(s);this.value=this.from+(this.to-this.from)*o}else this.lerp?(this.value=function(t,i,e,s){return function(t,i,e){return(1-e)*t+e*i}(t,i,1-Math.exp(-e*s))}(this.value,this.to,60*this.lerp,i),Math.round(this.value)===this.to&&(this.value=this.to,e=!0)):(this.value=this.to,e=!0);e&&this.stop(),this.onUpdate?.(this.value,e)}stop(){this.isRunning=!1}fromTo(t,i,{lerp:e,duration:s,easing:o,onStart:n,onUpdate:r}){this.from=this.value=t,this.to=i,this.lerp=e,this.duration=s,this.easing=o,this.currentTime=0,this.isRunning=!0,n?.(),this.onUpdate=r}};var e=class{constructor(t,i,{autoResize:e=!0,debounce:s=250}={}){this.wrapper=t,this.content=i,e&&(this.debouncedResize=function(t,i){let e;return function(...s){let o=this;clearTimeout(e),e=setTimeout((()=>{e=void 0,t.apply(o,s)}),i)}}(this.resize,s),this.wrapper instanceof Window?window.addEventListener("resize",this.debouncedResize,!1):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}width=0;height=0;scrollHeight=0;scrollWidth=0;debouncedResize;wrapperResizeObserver;contentResizeObserver;destroy(){this.wrapperResizeObserver?.disconnect(),this.contentResizeObserver?.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener("resize",this.debouncedResize,!1)}resize=()=>{this.onWrapperResize(),this.onContentResize()};onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)};onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)};get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}},s=class{events={};emit(t,...i){let e=this.events[t]||[];for(let t=0,s=e.length;t<s;t++)e[t]?.(...i)}on(t,i){return this.events[t]?.push(i)||(this.events[t]=[i]),()=>{this.events[t]=this.events[t]?.filter((t=>i!==t))}}off(t,i){this.events[t]=this.events[t]?.filter((t=>i!==t))}destroy(){this.events={}}},o=100/6,n={passive:!1},r=class{constructor(t,i={wheelMultiplier:1,touchMultiplier:1}){this.element=t,this.options=i,window.addEventListener("resize",this.onWindowResize,!1),this.onWindowResize(),this.element.addEventListener("wheel",this.onWheel,n),this.element.addEventListener("touchstart",this.onTouchStart,n),this.element.addEventListener("touchmove",this.onTouchMove,n),this.element.addEventListener("touchend",this.onTouchEnd,n)}touchStart={x:0,y:0};lastDelta={x:0,y:0};window={width:0,height:0};emitter=new s;on(t,i){return this.emitter.on(t,i)}destroy(){this.emitter.destroy(),window.removeEventListener("resize",this.onWindowResize,!1),this.element.removeEventListener("wheel",this.onWheel,n),this.element.removeEventListener("touchstart",this.onTouchStart,n),this.element.removeEventListener("touchmove",this.onTouchMove,n),this.element.removeEventListener("touchend",this.onTouchEnd,n)}onTouchStart=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:0,y:0},this.emitter.emit("scroll",{deltaX:0,deltaY:0,event:t})};onTouchMove=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t,s=-(i-this.touchStart.x)*this.options.touchMultiplier,o=-(e-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:s,y:o},this.emitter.emit("scroll",{deltaX:s,deltaY:o,event:t})};onTouchEnd=t=>{this.emitter.emit("scroll",{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:t})};onWheel=t=>{let{deltaX:i,deltaY:e,deltaMode:s}=t;i*=1===s?o:2===s?this.window.width:1,e*=1===s?o:2===s?this.window.height:1,i*=this.options.wheelMultiplier,e*=this.options.wheelMultiplier,this.emitter.emit("scroll",{deltaX:i,deltaY:e,event:t})};onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}}},Lenis=class{_isScrolling=!1;_isStopped=!1;_isLocked=!1;_preventNextNativeScrollEvent=!1;_resetVelocityTimeout=null;__rafID=null;isTouching;time=0;userData={};lastVelocity=0;velocity=0;direction=0;options;targetScroll;animatedScroll;animate=new i;emitter=new s;dimensions;virtualScroll;constructor({wrapper:t=window,content:i=document.documentElement,eventsTarget:s=t,smoothWheel:o=!0,syncTouch:n=!1,syncTouchLerp:l=.075,touchInertiaMultiplier:h=35,duration:a,easing:c=t=>Math.min(1,1.001-Math.pow(2,-10*t)),lerp:p=.1,infinite:d=!1,orientation:u="vertical",gestureOrientation:m="vertical",touchMultiplier:v=1,wheelMultiplier:S=1,autoResize:w=!0,prevent:g,virtualScroll:f,overscroll:y=!0,autoRaf:E=!1,anchors:T=!1,__experimental__naiveDimensions:z=!1}={}){window.lenisVersion="1.1.20",t&&t!==document.documentElement||(t=window),this.options={wrapper:t,content:i,eventsTarget:s,smoothWheel:o,syncTouch:n,syncTouchLerp:l,touchInertiaMultiplier:h,duration:a,easing:c,lerp:p,infinite:d,gestureOrientation:m,orientation:u,touchMultiplier:v,wheelMultiplier:S,autoResize:w,prevent:g,virtualScroll:f,overscroll:y,autoRaf:E,anchors:T,__experimental__naiveDimensions:z},this.dimensions=new e(t,i,{autoResize:w}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.addEventListener("scrollend",this.onScrollEnd,{capture:!0}),this.options.anchors&&this.options.wrapper===window&&this.options.wrapper.addEventListener("click",this.onClick,!1),this.options.wrapper.addEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll=new r(s,{touchMultiplier:v,wheelMultiplier:S}),this.virtualScroll.on("scroll",this.onVirtualScroll),this.options.autoRaf&&(this.__rafID=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.removeEventListener("scrollend",this.onScrollEnd,{capture:!0}),this.options.wrapper.removeEventListener("pointerdown",this.onPointerDown,!1),this.options.anchors&&this.options.wrapper===window&&this.options.wrapper.removeEventListener("click",this.onClick,!1),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this.__rafID&&cancelAnimationFrame(this.__rafID)}on(t,i){return this.emitter.on(t,i)}off(t,i){return this.emitter.off(t,i)}onScrollEnd=t=>{t instanceof CustomEvent||"smooth"!==this.isScrolling&&!1!==this.isScrolling||t.stopPropagation()};dispatchScrollendEvent=()=>{this.options.wrapper.dispatchEvent(new CustomEvent("scrollend",{bubbles:this.options.wrapper===window,detail:{lenisScrollEnd:!0}}))};setScroll(t){this.isHorizontal?this.options.wrapper.scrollTo({left:t,behavior:"instant"}):this.options.wrapper.scrollTo({top:t,behavior:"instant"})}onClick=t=>{const i=t.composedPath().find((t=>t instanceof HTMLAnchorElement&&t.getAttribute("href")?.startsWith("#")));if(i){const t=i.getAttribute("href");if(t){const i="object"==typeof this.options.anchors&&this.options.anchors?this.options.anchors:void 0;this.scrollTo(t,i)}}};onPointerDown=t=>{1===t.button&&this.reset()};onVirtualScroll=t=>{if("function"==typeof this.options.virtualScroll&&!1===this.options.virtualScroll(t))return;const{deltaX:i,deltaY:e,event:s}=t;if(this.emitter.emit("virtual-scroll",{deltaX:i,deltaY:e,event:s}),s.ctrlKey)return;if(s.lenisStopPropagation)return;const o=s.type.includes("touch"),n=s.type.includes("wheel");this.isTouching="touchstart"===s.type||"touchmove"===s.type;const r=0===i&&0===e;if(this.options.syncTouch&&o&&"touchstart"===s.type&&r&&!this.isStopped&&!this.isLocked)return void this.reset();const l="vertical"===this.options.gestureOrientation&&0===e||"horizontal"===this.options.gestureOrientation&&0===i;if(r||l)return;let h=s.composedPath();h=h.slice(0,h.indexOf(this.rootElement));const a=this.options.prevent;if(h.find((t=>t instanceof HTMLElement&&("function"==typeof a&&a?.(t)||t.hasAttribute?.("data-lenis-prevent")||o&&t.hasAttribute?.("data-lenis-prevent-touch")||n&&t.hasAttribute?.("data-lenis-prevent-wheel")))))return;if(this.isStopped||this.isLocked)return void s.preventDefault();if(!(this.options.syncTouch&&o||this.options.smoothWheel&&n))return this.isScrolling="native",this.animate.stop(),void(s.lenisStopPropagation=!0);let c=e;"both"===this.options.gestureOrientation?c=Math.abs(e)>Math.abs(i)?e:i:"horizontal"===this.options.gestureOrientation&&(c=i),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&(this.animatedScroll>0&&this.animatedScroll<this.limit||0===this.animatedScroll&&e>0||this.animatedScroll===this.limit&&e<0))&&(s.lenisStopPropagation=!0),s.preventDefault();const p=o&&this.options.syncTouch,d=o&&"touchend"===s.type&&Math.abs(c)>5;d&&(c=this.velocity*this.options.touchInertiaMultiplier),this.scrollTo(this.targetScroll+c,{programmatic:!1,...p?{lerp:d?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})};resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit("scroll",this)}onNativeScroll=()=>{if(null!==this._resetVelocityTimeout&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent)this._preventNextNativeScrollEvent=!1;else if(!1===this.isScrolling||"native"===this.isScrolling){const t=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-t,this.direction=Math.sign(this.animatedScroll-t),this.isStopped||(this.isScrolling="native"),this.emit(),0!==this.velocity&&(this._resetVelocityTimeout=setTimeout((()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()}),400))}};reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){this.isStopped&&(this.reset(),this.isStopped=!1)}stop(){this.isStopped||(this.reset(),this.isStopped=!0)}raf=t=>{const i=t-(this.time||t);this.time=t,this.animate.advance(.001*i),this.options.autoRaf&&(this.__rafID=requestAnimationFrame(this.raf))};scrollTo(i,{offset:e=0,immediate:s=!1,lock:o=!1,duration:n=this.options.duration,easing:r=this.options.easing,lerp:l=this.options.lerp,onStart:h,onComplete:a,force:c=!1,programmatic:p=!0,userData:d}={}){if(!this.isStopped&&!this.isLocked||c){if("string"==typeof i&&["top","left","start"].includes(i))i=0;else if("string"==typeof i&&["bottom","right","end"].includes(i))i=this.limit;else{let t;if("string"==typeof i?t=document.querySelector(i):i instanceof HTMLElement&&i?.nodeType&&(t=i),t){if(this.options.wrapper!==window){const t=this.rootElement.getBoundingClientRect();e-=this.isHorizontal?t.left:t.top}const s=t.getBoundingClientRect();i=(this.isHorizontal?s.left:s.top)+this.animatedScroll}}if("number"==typeof i){if(i+=e,i=Math.round(i),this.options.infinite?p&&(this.targetScroll=this.animatedScroll=this.scroll):i=t(0,i,this.limit),i===this.targetScroll)return h?.(this),void a?.(this);if(this.userData=d??{},s)return this.animatedScroll=this.targetScroll=i,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),a?.(this),this.userData={},void requestAnimationFrame((()=>{this.dispatchScrollendEvent()}));p||(this.targetScroll=i),this.animate.fromTo(this.animatedScroll,i,{duration:n,easing:r,lerp:l,onStart:()=>{o&&(this.isLocked=!0),this.isScrolling="smooth",h?.(this)},onUpdate:(t,i)=>{this.isScrolling="smooth",this.lastVelocity=this.velocity,this.velocity=t-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=t,this.setScroll(this.scroll),p&&(this.targetScroll=t),i||this.emit(),i&&(this.reset(),this.emit(),a?.(this),this.userData={},requestAnimationFrame((()=>{this.dispatchScrollendEvent()})),this.preventNextNativeScrollEvent())}})}}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame((()=>{this._preventNextNativeScrollEvent=!1}))}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.__experimental__naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?"x":"y"]}get isHorizontal(){return"horizontal"===this.options.orientation}get actualScroll(){const t=this.options.wrapper;return this.isHorizontal?t.scrollX??t.scrollLeft:t.scrollY??t.scrollTop}get scroll(){return this.options.infinite?(t=this.animatedScroll,i=this.limit,(t%i+i)%i):this.animatedScroll;var t,i}get progress(){return 0===this.limit?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(t){this._isScrolling!==t&&(this._isScrolling=t,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(t){this._isStopped!==t&&(this._isStopped=t,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(t){this._isLocked!==t&&(this._isLocked=t,this.updateClassName())}get isSmooth(){return"smooth"===this.isScrolling}get className(){let t="lenis";return this.isStopped&&(t+=" lenis-stopped"),this.isLocked&&(t+=" lenis-locked"),this.isScrolling&&(t+=" lenis-scrolling"),"smooth"===this.isScrolling&&(t+=" lenis-smooth"),t}updateClassName(){this.cleanUpClassName(),this.rootElement.className=`${this.rootElement.className} ${this.className}`.trim()}cleanUpClassName(){this.rootElement.className=this.rootElement.className.replace(/lenis(-\w+)?/g,"").trim()}};globalThis.Lenis=Lenis;
})();
/* Site script: menu, nav variants, hero scroll states, ticker, about zoom, cursor. */
(function () {
  "use strict";
  var doc = document, win = window;
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Open menu ---------- */
  var menu = $("#cp-menu");
  function setMenu(open) {
    if (!menu) return;
    if (open) { menu.hidden = false; menu.setAttribute("aria-hidden", "false"); void menu.offsetWidth; menu.classList.add("is-open"); doc.documentElement.style.overflow = "hidden"; if (win.lenis) win.lenis.stop(); }
    else { menu.classList.remove("is-open"); menu.hidden = true; menu.setAttribute("aria-hidden", "true"); doc.documentElement.style.overflow = ""; if (win.lenis) win.lenis.start(); }
  }
  $$("nav.menu, nav.block-menu-2").forEach(function (n) { n.addEventListener("click", function () { setMenu(true); }); });
  if (menu) {
    var cl = $(".cp-menu-close", menu); if (cl) cl.addEventListener("click", function () { setMenu(false); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- Nav variant (inverted over orange sections) ---------- */
  var header = $(".div");
  var orange = $("section.n2-bakes") || $("section.bakes-wrap-bakes-wrap");
  var onBakesPage = !!$("section.bakes-wrap-bakes-wrap");
  function navUpdate() {
    if (!header || !orange) return;
    var r = orange.getBoundingClientRect();
    header.classList.toggle("cp-inv", onBakesPage || (r.top <= 0 && r.bottom > 0));
  }

  /* ---------- Hero scroll states (home, desktop layout) ---------- */
  var heroImg = $(".n1-hero-and-steps-image-2");
  var heroBox = heroImg && heroImg.parentElement;
  var ids = ["top", "scale-down", "change-1", "change-2", "change-3"];
  var steps = {};
  if (heroImg && $("#scale-down")) {
    [["1", $(".image-step-1 img")], ["2", $(".image-step-2 img")], ["3", $(".image-step-3 img")]].forEach(function (p) {
      if (!p[1]) return;
      var im = doc.createElement("img");
      im.className = "cp-hero-step"; im.alt = ""; im.src = p[1].getAttribute("src");
      heroBox.appendChild(im); steps[p[0]] = im;
    });
  }
  var heroState = "";
  function heroUpdate() {
    if (!heroImg || !steps["1"]) return;
    var full = heroImg.closest(".full");
    if (!full || full.offsetParent === null) return;
    var vh = win.innerHeight, i, el, act = -1;
    for (i = 0; i < ids.length; i++) { el = doc.getElementById(ids[i]); if (el && el.getBoundingClientRect().top <= vh / 2) act = i; }
    var st = act < 1 ? "full" : ["full", "scale-down", "c1", "c2", "c3"][act];
    if (st === heroState) return;
    heroState = st;
    var wrapH = full.clientHeight, h = heroImg.offsetHeight, topFull = wrapH - h + 200;
    heroImg.style.transform = st === "full" ? "" : "translateY(" + (((wrapH - h / 2) / 2) - topFull) + "px) scale(.5)";
    doc.documentElement.classList.toggle("cp-hero-hide", st === "c1" || st === "c2" || st === "c3");
    steps["1"].classList.toggle("on", st === "c1");
    steps["2"].classList.toggle("on", st === "c2");
    steps["3"].classList.toggle("on", st === "c1" || st === "c3");
    steps["3"].style.zIndex = 0; steps["1"].style.zIndex = 1;
  }

  /* ---------- Ticker (our artisans) ---------- */
  var ul = $(".n3-our-artisans-ul");
  if (ul && !reduce && ul.animate) {
    var started = false;
    var startTicker = function () {
      var lis = ul.children;
      if (started || lis.length < 2) return;
      var d = lis[1].offsetLeft - lis[0].offsetLeft;
      if (d < 100) return;
      started = true;
      ul.animate([{ transform: "translateX(0)" }, { transform: "translateX(-" + d + "px)" }], { duration: d / 100 * 1000, iterations: Infinity, easing: "linear" });
    };
    startTicker(); win.addEventListener("load", startTicker);
  }

  /* ---------- About zoom (home) ---------- */
  var about = $("section.n4-about-sticky");
  var zn1 = $(".n4-about-sticky .n1"), zn2 = $(".n4-about-sticky .n2"), zn3 = $(".n4-about-sticky .n3"), zn4 = $(".n4-about-sticky .n4");
  var zmask = $(".n4-about-sticky .mask"), zcenter = $(".n4-about-sticky .center"), zinner = $(".n4-about-sticky .n4-about-sticky-image"), zover = $(".n4-about-sticky .overlay");
  var zp = 0, zv = 0, zq = 0, zqv = 0, zraf = 0, zlastT = 0;
  function zTarget() {
    var r = about.getBoundingClientRect();
    return clamp(-r.top / about.offsetHeight, 0, 1);
  }
  function zTargetQ() {
    var r = about.getBoundingClientRect();
    return clamp((win.innerHeight - r.top) / about.offsetHeight, 0, 1);
  }
  function zApply(p, q) {
    var ex = 1500 * p, ey = 550 * p, P = "perspective(1200px) ";
    zn1.style.transform = zn2.style.transform = P + "translate(" + (-ex) + "px," + (-ey) + "px)";
    zn3.style.transform = zn4.style.transform = P + "translate(" + ex + "px," + (-ey) + "px)";
    zmask.style.transform = P + "scale(" + (1 + 3 * p) + ")";
    zcenter.style.transform = P + "scale(" + (1 + 5 * p) + ")";
    zinner.style.transform = P + "scale(" + (1 - 0.7 * p) + ")";
    zover.style.opacity = String(clamp(q, 0, 1));
  }
  function zTick(t) {
    zraf = 0;
    var dt = Math.min(0.05, (t - zlastT) / 1000 || 0.016); zlastT = t;
    var zt = zTarget();
    var n = Math.max(1, Math.round(dt / 0.004)), h = dt / n;
    var zu = zTargetQ();
    for (var i = 0; i < n; i++) {
      var a = 500 * (zt - zp) - 60 * zv; zv += a * h; zp += zv * h;
      var b = 500 * (zu - zq) - 60 * zqv; zqv += b * h; zq += zqv * h;
    }
    zApply(zp, zq);
    if (Math.abs(zt - zp) > 0.0002 || Math.abs(zv) > 0.001 || Math.abs(zu - zq) > 0.0002 || Math.abs(zqv) > 0.001) zraf = requestAnimationFrame(zTick);
    else { zp = zt; zv = 0; zq = zu; zqv = 0; zApply(zp, zq); }
  }
  function zKick() {
    if (!about || !zn1 || !zmask) return;
    if (reduce) { zp = zTarget(); zq = zTargetQ(); zApply(zp, zq); return; }
    if (!zraf) { zlastT = performance.now(); zraf = requestAnimationFrame(zTick); }
  }

  /* ---------- Cursor dot / bake icon ---------- */
  var cur = doc.createElement("div"); cur.className = "cp-cursor"; cur.setAttribute("aria-hidden", "true");
  var curImg = doc.createElement("img"); curImg.alt = ""; cur.appendChild(curImg);
  cur.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14 L14 2 M5 2 H14 V11" fill="none" stroke="#fff" stroke-width="2.4"/></svg>');
  doc.body.appendChild(cur);
  var mx = -100, my = -100, cx = -100, cy = -100, offX = 8, offY = 0, craf = 0, mode = "";
  function cTick() {
    cx += (mx - cx) * 0.35; cy += (my - cy) * 0.35;
    cur.style.transform = "translate(" + (cx - offX) + "px," + (cy - offY) + "px)";
    craf = (Math.abs(mx - cx) > 0.1 || Math.abs(my - cy) > 0.1) ? requestAnimationFrame(cTick) : 0;
  }
  function cMove(e) { mx = e.clientX; my = e.clientY; if (!craf) craf = requestAnimationFrame(cTick); }
  function cShow(m, src) {
    cur.classList.toggle("icon", m === "icon"); cur.classList.toggle("arrow", m === "arrow");
    if (m === "icon") { offX = 35; offY = 35; if (curImg.getAttribute("src") !== src) curImg.src = src; }
    else if (m === "arrow") { offX = 30; offY = 30; }
    else { offX = 8; offY = 0; }
    if (mode === "") { cx = mx; cy = my; cur.style.transform = "translate(" + (cx - offX) + "px," + (cy - offY) + "px)"; }
    mode = m; cur.classList.add("on");
  }
  function cHide() { mode = ""; cur.classList.remove("on"); }
  doc.addEventListener("mousemove", cMove, { passive: true });
  doc.addEventListener("mouseleave", cHide);
  var dotSel = "a, button, input, textarea, nav.menu, nav.block-menu-2, summary, label";
  doc.addEventListener("mouseover", function (e) {
    var t = e.target; if (!t.closest) return;
    var item = t.closest(".n2-bakes-desktop");
    if (item) {
      var a = $(".n2-bakes-heading-a", item), m = a && /\/bakes\/([^\/]+)/.exec(a.getAttribute("href") || "");
      
    }
    if (t.closest(dotSel)) { cShow("dot"); return; }
    cHide();
  });

  /* ---------- Back to top ---------- */
  $$('a[href="#top"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (win.lenis) win.lenis.scrollTo(0); else win.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  });

  /* ---------- Smooth scroll (Lenis) and entrance motion ---------- */
  if (!reduce && win.Lenis) {
    try { win.lenis = new win.Lenis({ duration: 1.3, smoothWheel: true, autoRaf: true, anchors: { offset: -72 } }); } catch (err) { win.lenis = null; }
  }
  if (!reduce && "IntersectionObserver" in win) {
    var rvs = $$(".rv");
    $$("[data-rv-group]").forEach(function (g) {
      $$(".rv", g).forEach(function (el, i) { el.style.setProperty("--d", (i * 0.08).toFixed(2) + "s"); });
    });
    var rvIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rvIO.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { if (!el.classList.contains("rv-lone")) rvIO.observe(el); });
    doc.documentElement.classList.add("cp-rv");
    // safety: anything still hidden after a long wait (hidden section opened later is handled by the observer)
    win.__rvIO = rvIO;
  }

  /* ---------- Loop ---------- */
  function onScroll() { navUpdate(); heroUpdate(); zKick(); }
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("resize", function () { heroState = ""; onScroll(); });
  win.addEventListener("load", function () { heroState = ""; onScroll(); });
  onScroll();
})();
