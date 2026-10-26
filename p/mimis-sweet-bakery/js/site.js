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
    if (open) { menu.hidden = false; menu.setAttribute("aria-hidden", "false"); void menu.offsetWidth; menu.classList.add("is-open"); doc.documentElement.style.overflow = "hidden"; }
    else { menu.classList.remove("is-open"); menu.hidden = true; menu.setAttribute("aria-hidden", "true"); doc.documentElement.style.overflow = ""; }
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
    a.addEventListener("click", function (e) { e.preventDefault(); win.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  });

  /* ---------- Loop ---------- */
  function onScroll() { navUpdate(); heroUpdate(); zKick(); }
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("resize", function () { heroState = ""; onScroll(); });
  win.addEventListener("load", function () { heroState = ""; onScroll(); });
  onScroll();
})();
