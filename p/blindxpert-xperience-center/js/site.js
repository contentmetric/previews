// Refit base motion (JS). Pairs with css/motion.css. Every number was measured on the Refit original (refit/decode, BUILD.md).
// Reduced motion = final states, nothing loops. No markup is changed: elements are found by their existing class names.
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // ---- springs as CSS linear() easings (stiffness k, damping c, mass 1) ----
  var SP = {};
  function spring(k, c) {
    var key = k + "/" + c;
    if (SP[key]) return SP[key];
    var z = c / (2 * Math.sqrt(k)), w = Math.sqrt(k), f;
    if (z < 1) { var wd = w * Math.sqrt(1 - z * z); f = function (t) { return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }; }
    else if (Math.abs(z - 1) < 1e-6) { f = function (t) { return 1 - Math.exp(-w * t) * (1 + w * t); }; }
    else { var s = Math.sqrt(c * c - 4 * k), r1 = (-c + s) / 2, r2 = (-c - s) / 2; f = function (t) { return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1); }; }
    var T = 0;
    for (var t = 0; t < 10; t += 1 / 240) if (Math.abs(1 - f(t)) > 0.002) T = t;
    T += 1 / 60;
    return (SP[key] = lin(f, T));
  }
  function lin(f, T) {
    var n = Math.max(12, Math.min(90, Math.ceil(T * 60))), pts = [];
    for (var i = 0; i <= n; i++) pts.push((i === n ? 1 : f(T * i / n)).toFixed(4));
    return { ease: "linear(" + pts.join(",") + ")", ms: Math.round(T * 1000) };
  }
  var SPR_REVEAL = [250, 80], SPR_ACC = [133.21, 23.08], SPR_FAQ = [236.82, 30.78], SPR_LETTER = [832.58, 57.71],
    SPR_SLIDE = [200, 40], SPR_BTN = [126.4, 17.99], SPR_COL = [200, 40], SPR_RING = [60, 24];
  var MENU = lin(function (t) { return 1 - Math.exp(-t / 0.1); }, 0.8); // drawer: exponential settle, 0.1 s time constant
  function play(el, kf, sp, delay, done) {
    var s = spring(sp[0], sp[1]);
    var a = el.animate(kf, { duration: s.ms, delay: delay || 0, easing: s.ease, fill: "both" });
    a.finished.then(function () { a.cancel(); if (done) done(); }, function () {});
    return a;
  }
  function stopAnims(el) { if (el) el.getAnimations().forEach(function (a) { a.cancel(); }); }
  function angle(el) {
    var t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    var m = new DOMMatrixReadOnly(t);
    return Math.round(Math.atan2(m.b, m.a) * 1800 / Math.PI) / 10;
  }

  // CSS hooks for hovers and the drawer
  var rs = root.style, sb = spring(SPR_BTN[0], SPR_BTN[1]), sc = spring(SPR_COL[0], SPR_COL[1]);
  rs.setProperty("--mv-btn", sb.ease); rs.setProperty("--mv-btn-ms", sb.ms + "ms");
  rs.setProperty("--mv-col", sc.ease); rs.setProperty("--mv-col-ms", sc.ms + "ms");
  rs.setProperty("--mv-menu", MENU.ease);

  // ---- 1. smooth scroll (Lenis, loaded as a classic script before this file) ----
  if (!reduce && window.Lenis) window.lenis = new window.Lenis({ duration: 0.8, autoRaf: true, anchors: true });

  // ---- phone menu ----
  (function () {
    var hdr = $(".site-header"), burger = $(".logo-hamburger-logo-hamburger-div"), nav = $(".site-header .navigation");
    if (!hdr || !burger || !nav) return;
    var open = false, ha = null;
    var set = function (v) {
      if (v === open) return;
      open = v;
      var h0 = hdr.getBoundingClientRect().height;
      if (ha) { ha.cancel(); ha = null; }
      hdr.style.height = v ? "100vh" : "";
      nav.style.right = v ? "0px" : "";
      burger.classList.toggle("is-open", v);
      hdr.classList.toggle("mv-open", v);
      var h1 = hdr.getBoundingClientRect().height;
      if (!reduce && h0 !== h1) {
        ha = hdr.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: MENU.ms, easing: MENU.ease });
        ha.onfinish = function () { ha = null; };
      }
    };
    burger.addEventListener("click", function () { set(!open); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
  })();

  var form = $("form"); if (form) form.addEventListener("submit", function (e) { e.preventDefault(); });

  // ---- 3. load entrance, 4. badge pulse ----
  if (!reduce) (function () {
    var EASE = "cubic-bezier(.2,.8,.2,1)";
    var tween = function (el, y, delay) {
      if (!el) return;
      el.classList.add("mv-in");
      var a = el.animate([{ opacity: 0.001, transform: "translateY(" + y + "px)" }, { opacity: 1, transform: "none" }], { duration: 1800, delay: delay, easing: EASE, fill: "both" });
      a.onfinish = function () { a.cancel(); };
    };
    tween($(".banner-background .image"), 0, 80);
    var letters = $$(".banner-heading-span-span");
    letters.forEach(function (l, i) {
      l.classList.add("mv-in");
      play(l, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], SPR_LETTER, 190 + 50 * i);
    });
    var base = 190 + 50 * Math.max(0, letters.length - 1) - 10;
    tween($(".banner .badge"), 10, base);
    tween($(".banner-text-and-button-div"), 40, base);
    tween($(".banner-text-and-button-div-2"), 40, base + 200);
    tween($(".banner .review"), 40, base + 400);

    var host = $(".badge-div > div");
    if (host) {
      var dot = $(".banner-badge-div-div-div-2", host), s = spring(SPR_RING[0], SPR_RING[1]);
      var ring = function () {
        if (doc.hidden) return;
        var r = doc.createElement("div"); r.className = "mv-ring";
        host.insertBefore(r, dot || host.firstChild);
        var a = r.animate([{ opacity: 0.5, transform: "scale(1)" }, { opacity: 0, transform: "scale(2.24)" }], { duration: 2050, easing: s.ease });
        a.onfinish = function () { r.remove(); };
      };
      ring(); setInterval(ring, 1000);
    }
  })();

  // ---- 5. scroll reveals: [selector, visible share needed, delay s] ----
  (function () {
    var spec = [[".about-title", .5, 0], [".about-content", .5, .3], [".header", .5, 0],
      [".services-images", 0, 0], [".services-services", 0, 0],
      [".first-open-tablet-mobile .images", 0, 0], [".first-open-tablet-mobile .services", 0, 0],
      [".our-work-header", .5, 0], [".testimonials-header", .5, 0],
      [".faqs-content", 0, 0], [".faqs-container-div-div", 0, .3], [".contact-content", 0, 0], [".form-wrapper", 0, .3]];
    var todo = [];
    spec.forEach(function (s) { var el = $(s[0]); if (el) todo.push({ el: el, th: s[1], delay: s[2] }); });
    if (reduce) return;
    var show = function (it) {
      it.el.classList.add("mv-in");
      play(it.el, [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }], SPR_REVEAL, it.delay * 1000);
    };
    var check = function () {
      var vh = innerHeight;
      todo = todo.filter(function (it) {
        var r = it.el.getBoundingClientRect();
        if (!r.width && !r.height) return true; // display:none at this width
        var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        if (vis > 0 && vis >= it.th * Math.min(r.height, vh) - 0.01) { show(it); return false; }
        return true;
      });
      if (!todo.length) { removeEventListener("scroll", check); removeEventListener("resize", check); }
    };
    addEventListener("scroll", check, { passive: true }); addEventListener("resize", check);
    check(); addEventListener("load", check);
  })();

  // ---- sticky "Our work" cards shrink to 0.9 while the next one covers them ----
  (function () {
    var cards = [1, 2].map(function (n) { return { box: $("#sticky-container-" + n), card: $(".our-work-sticky-container-" + n + "-div"), top: 0 }; }).filter(function (c) { return c.box && c.card; });
    if (!cards.length || reduce) return;
    var measure = function () {
      cards.forEach(function (c) {
        var p = c.box.style.position; c.box.style.position = "relative";
        c.top = c.box.getBoundingClientRect().top + scrollY; c.box.style.position = p;
      });
      update();
    };
    var update = function () {
      cards.forEach(function (c) {
        if (getComputedStyle(c.box).position !== "sticky") { c.card.style.transform = ""; return; }
        var h = c.box.offsetHeight || 1;
        c.card.style.transform = "scale(" + (1 - 0.1 * clamp((scrollY - c.top) / h, 0, 1)).toFixed(5) + ")";
      });
    };
    measure(); addEventListener("load", measure); addEventListener("resize", measure); addEventListener("scroll", update, { passive: true });
  })();

  // ---- 2. tickers: 35 px/s, hover halves it; [list class, direction] ----
  if (!reduce) [["about-about-desktop-div-ul", -1], ["testimonials-testimonials-desktop-div-ul", -1], ["testimonials-testimonials-desktop-ul", 1]].forEach(function (d) {
    var ul = $("ul." + d[0]);
    if (!ul) return;
    var host = ul.parentElement, off = 0, last = 0, on = false, f = 1;
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; last = 0; }).observe(host);
    host.addEventListener("mouseenter", function () { f = 0.5; });
    host.addEventListener("mouseleave", function () { f = 1; });
    var tick = function (t) {
      var li = ul.children;
      if (on && li.length > 6 && ul.getClientRects().length) {
        var set = li[6].offsetLeft - li[0].offsetLeft;
        if (last && set > 0) {
          off = (off + 0.035 * f * Math.min(t - last, 64)) % set;
          ul.style.transform = "translateX(" + (d[1] > 0 ? off : -off) + "px)";
        }
        last = t;
      } else last = 0;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // ---- 9. phone slideshows: 6 slides x 4 copies, a step every 3 s, spring 200/40, dots, drag ----
  ["about-desktop-div-ul", "testimonials-desktop-div-ul"].forEach(function (cls) {
    var ul = $("ul." + cls);
    if (!ul) return;
    var sec = ul.closest("section") || ul.parentElement, P = ul.children.length / 4;
    var dots = $$('button[aria-label^="Scroll to page"]', sec).map(function (b) { var d = b.querySelector(":scope > div") || b; d.style.transition = "opacity .3s cubic-bezier(0,0,.58,1)"; return { b: b, d: d }; });
    var idx = P, x = 0, anim = null, timer = 0, vis = false, drag = null;
    var step = function () {
      var s = ul.children[0] && ul.children[0].firstElementChild;
      return s ? s.getBoundingClientRect().width + (parseFloat(getComputedStyle(ul).columnGap) || 0) : 0;
    };
    var setX = function (px) { x = px; ul.style.transform = "translateX(" + px + "px)"; };
    var curX = function () { var t = getComputedStyle(ul).transform; return t && t !== "none" ? new DOMMatrixReadOnly(t).m41 : x; };
    var paint = function () { dots.forEach(function (o, i) { o.d.style.opacity = i === idx % P ? 1 : 0.5; }); };
    var norm = function () { var st = step(); while (idx >= 2 * P) idx -= P; while (idx < P) idx += P; if (st) setX(-idx * st); paint(); };
    var goTo = function (i) {
      var st = step(); if (!st) return;
      var from = curX(); if (anim) { anim.cancel(); anim = null; }
      idx = i; paint();
      var to = -i * st; setX(to);
      if (reduce) { norm(); return; }
      var s = spring(SPR_SLIDE[0], SPR_SLIDE[1]);
      anim = ul.animate([{ transform: "translateX(" + from + "px)" }, { transform: "translateX(" + to + "px)" }], { duration: s.ms, easing: s.ease });
      var a = anim; a.onfinish = function () { if (anim === a) { anim = null; norm(); } };
    };
    var sched = function (ms) {
      clearTimeout(timer);
      timer = setTimeout(function () { if (vis && !drag && !doc.hidden && step()) goTo(idx + 1); sched(3000); }, ms);
    };
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(sec);
    var layout = function () { if (!anim && step()) { norm(); } };
    layout(); addEventListener("resize", layout); addEventListener("load", layout);
    if (!reduce) sched(2500);
    dots.forEach(function (o, p) {
      o.b.addEventListener("click", function () {
        var i = idx - (idx % P) + p; if (i - idx > P / 2) i -= P; if (idx - i > P / 2) i += P;
        goTo(i); if (!reduce) sched(3000);
      });
    });
    ul.addEventListener("pointerdown", function (e) {
      if (!step() || (e.pointerType === "mouse" && e.button !== 0)) return;
      var cx = curX(); if (anim) { anim.cancel(); anim = null; } setX(cx);
      drag = { sx: e.clientX, x0: cx, lx: e.clientX, lt: e.timeStamp, v: 0 };
      try { ul.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ul.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dt = e.timeStamp - drag.lt;
      if (dt > 0) { drag.v = (e.clientX - drag.lx) / dt; drag.lx = e.clientX; drag.lt = e.timeStamp; }
      setX(drag.x0 + e.clientX - drag.sx);
    });
    var end = function () {
      if (!drag) return;
      var st = step(), v = drag.v; drag = null;
      goTo(Math.round(-(x + v * 200) / st)); if (!reduce) sched(3000);
    };
    ul.addEventListener("pointerup", end); ul.addEventListener("pointercancel", end);
  });

  // ---- 6. services accordion (one open at a time) and FAQ (independent rows) ----
  var PAIRS = { "services-open": "services-closed-2", "open": "services-closed", "faqs-open": "faqs-closed" };
  var REV = {}; Object.keys(PAIRS).forEach(function (k) { REV[PAIRS[k]] = k; });
  function swap(V, open) {
    var from = open ? REV : PAIRS;
    Object.keys(from).forEach(function (a) { if (V.classList.contains(a)) { V.classList.remove(a); V.classList.add(from[a]); } });
  }
  var isOpen = function (V) { return Object.keys(PAIRS).some(function (k) { return V.classList.contains(k); }); };
  function toggle(V, open, sp, faq) {
    var icon = V.firstElementChild.lastElementChild, ct = faq ? V.children[1] : null;
    var h0 = V.getBoundingClientRect().height, a0 = angle(icon), o0 = ct ? +getComputedStyle(ct).opacity : 1;
    [V, icon, ct].forEach(stopAnims);
    swap(V, open);
    if (ct) { // the FAQ answer is a different block when closed (absolute, transparent)
      var c2 = ct.classList.contains("faqs-content-2"), c3 = ct.classList.contains("faqs-content-3");
      if (open && c3) { ct.classList.replace("faqs-content-3", "faqs-content-2"); } else if (!open && c2) { ct.classList.replace("faqs-content-2", "faqs-content-3"); }
      var cd = ct.firstElementChild;
      if (cd) { if (open && cd.classList.contains("faqs-content-3-div")) cd.classList.replace("faqs-content-3-div", "faqs-content-2-div"); else if (!open && cd.classList.contains("faqs-content-2-div")) cd.classList.replace("faqs-content-2-div", "faqs-content-3-div"); }
    }
    var h1 = V.getBoundingClientRect().height, a1 = open ? 45 : 0;
    icon.style.transform = "rotate(" + a1 + "deg)";
    if (reduce) return;
    if (Math.abs(h0 - h1) > 0.5) play(V, [{ height: h0 + "px" }, { height: h1 + "px" }], sp);
    play(icon, [{ transform: "rotate(" + a0 + "deg)" }, { transform: "rotate(" + a1 + "deg)" }], sp);
    if (ct) play(ct, [{ opacity: o0 }, { opacity: open ? 1 : 0 }], sp);
  }
  function initRows(vs, faq) {
    vs.forEach(function (V) { V.firstElementChild.lastElementChild.style.transform = isOpen(V) ? "rotate(45deg)" : "none"; });
  }
  function services(list, imgBox) {
    if (!list) return;
    var vs = $$(":scope > *", list).map(function (r) { return r.firstElementChild; }), imgs = imgBox ? $$(":scope > *", imgBox) : [];
    initRows(vs, false);
    vs.forEach(function (V, k) {
      V.addEventListener("click", function () {
        if (isOpen(V)) { toggle(V, false, SPR_ACC); return; }
        vs.forEach(function (o) { if (o !== V && isOpen(o)) toggle(o, false, SPR_ACC); });
        toggle(V, true, SPR_ACC);
        imgs.forEach(function (im, j) {
          if (j === 0) return;
          var to = j === k ? 1 : 0, from = +getComputedStyle(im).opacity;
          stopAnims(im); im.style.opacity = to;
          if (!reduce && from !== to) play(im, [{ opacity: from }, { opacity: to }], SPR_ACC);
        });
      });
    });
  }
  services($(".services-services"), $(".services-images"));
  services($(".first-open-tablet-mobile .services"), $(".first-open-tablet-mobile .images"));
  var fv = $$(".faqs-faqs-faqs-div").map(function (r) { return r.firstElementChild; });
  initRows(fv, true);
  fv.forEach(function (V) { V.addEventListener("click", function () { toggle(V, !isOpen(V), SPR_FAQ, true); }); });
})();
