
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, ev, fn) { if (el) el.addEventListener(ev, fn); };

  
  function chars(sel) { return $$(sel + " span").filter(function (s) { return !s.children.length; }); }
  var groups = [[chars(".hero-text-5"), 0], [chars(".heading"), 0], [chars(".hero-text-7"), 0.4]];
  if (!reduce) {
    groups.forEach(function (g) {
      g[0].forEach(function (c, i) { c.style.transitionDelay = (0.05 + g[1] + i * 0.05).toFixed(2) + "s"; c.classList.add("fx-c"); });
    });
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add("fx-go"); }); }); };
    if (document.readyState === "complete") go(); else on(window, "load", go);
  }

  
  var par = [
    [$(".hero-photo"), 7],
    [$(".look-1-photo-image"), 6],
    [$(".look-2-photo-image"), 6],
    [$(".atelier-photo-image"), 7]
  ].filter(function (p) { return p[0]; });
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function frame() {
    var vh = window.innerHeight, sy = window.pageYOffset;
    par.forEach(function (p) {
      var el = p[0], top = docTop(el), h = el.offsetHeight;
      var pr = Math.min(1, Math.max(0, (sy + vh - top) / (h + vh)));
      el.style.translate = "0 " + (-p[1] + 2 * p[1] * pr).toFixed(5) + "%";
    });
  }
  if (!reduce && par.length) {
    var tick = false;
    var req = function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; frame(); }); } };
    on(window, "scroll", req); on(window, "resize", req); on(window, "load", req); frame();
  }

  
  function kids(el) {
    var out = [];
    if (el) Array.prototype.forEach.call(el.children, function (c) {
      if (c.hasAttribute("data-instatic-loop")) out = out.concat(kids(c)); else out.push(c);
    });
    return out;
  }
  function group(trigs, panels, panelShow) {
    if (!trigs.length || trigs.length !== panels.length) return;
    var dark = getComputedStyle($("p", trigs[0])).color, light = getComputedStyle($("p", trigs[1])).color;
    function set(n) {
      trigs.forEach(function (t, k) {
        var act = k === n;
        t.style.backgroundColor = act ? "rgb(224, 183, 138)" : "transparent";
        $$("p", t).forEach(function (p) { p.style.color = act ? dark : light; });
        panels[k].style.display = act ? panelShow : "none";
      });
    }
    trigs.forEach(function (t, k) { on(t, "click", function () { set(k); }); });
    set(0);
  }
  group(kids($(".tabs")), [$(".list-colour"), $(".list-cut"), $(".list-care")].filter(Boolean), "flex");
  var chooser = $(".chooser");
  if (chooser) group(kids($(".choices")), kids(chooser).slice(2), "flex");

  
  var items = kids($(".questions")), open = 0;
  function faq() { items.forEach(function (it, i) { if (it.children[1]) it.children[1].style.display = i === open ? "block" : "none"; }); }
  items.forEach(function (it, i) { on(it.children[0], "click", function () { open = open === i ? -1 : i; faq(); }); });
  faq();

  
  var menu = $(".menu-panel"), burger = $(".menu-button"), shown = false;
  function setMenu(v) { shown = v; menu.style.display = v ? "flex" : ""; }
  if (menu && burger) { on(burger, "click", function () { setMenu(!shown); }); on(menu, "click", function () { setMenu(false); }); }
})();
