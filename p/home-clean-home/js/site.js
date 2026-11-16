// Home page behaviour: Services dropdown, phone menu, FAQ accordion, hero video.
(function () {
  document.documentElement.classList.add("js");
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Desktop Services dropdown: opens on hover or keyboard focus, closes when the pointer and focus leave.
  qa("[data-dd]").forEach(function (w) {
    var t;
    var open = function () { clearTimeout(t); w.classList.add("is-open"); q("[data-dd-link]", w).setAttribute("aria-expanded", "true"); q(".dd", w).setAttribute("aria-hidden", "false"); };
    var close = function () { t = setTimeout(function () { w.classList.remove("is-open"); q("[data-dd-link]", w).setAttribute("aria-expanded", "false"); q(".dd", w).setAttribute("aria-hidden", "true"); }, 60); };
    w.addEventListener("mouseenter", open); w.addEventListener("mouseleave", close);
    w.addEventListener("focusin", open); w.addEventListener("focusout", close);
  });

  // Tablet/phone menu: the hamburger toggles the panel, the Services row opens its sub list.
  var nav = q("nav.phone-close"), btn = q("[data-m-btn]");
  if (nav && btn) {
    var setMenu = function (on) {
      nav.classList.toggle("is-menu-open", on); btn.classList.toggle("is-menu-open", on);
      btn.setAttribute("aria-expanded", on); btn.setAttribute("aria-label", on ? "Close menu" : "Open menu");
      q(".m-panel", nav).setAttribute("aria-hidden", !on);
    };
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-menu-open")); });
    btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); } });
    var svc = q(".m-svc", nav), svcLink = q("[data-m-svc]", nav);
    svcLink.addEventListener("click", function (e) { e.preventDefault(); svc.classList.toggle("is-open"); });
    svcLink.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); svcLink.click(); } });
    qa(".m-panel a", nav).forEach(function (a) { if (a !== svcLink) a.addEventListener("click", function () { setMenu(false); }); });
  }

  // FAQ: one answer open at a time (the desktop/tablet list and the phone list are separate).
  [".block-desktop-v1", ".phone-v1"].forEach(function (sel) {
    var root = q(sel); if (!root) return;
    var items = qa(".faq-item", root);
    var set = function (it, on) { it.classList.toggle("is-open", on); it.setAttribute("aria-expanded", on); };
    items.forEach(function (it) {
      var go = function () { var was = it.classList.contains("is-open"); items.forEach(function (o) { set(o, false); }); if (!was) set(it, true); };
      it.addEventListener("click", go);
      it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  });

  // Appear on view: each section block fades in once when it is 60px into the viewport.
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -60px 0px" });
    qa("[data-appear]").forEach(function (e) { io.observe(e); });
  } else qa("[data-appear]").forEach(function (e) { e.classList.add("in-view"); });

  // Forms are inert here: no action and no network call. Stop the page reload (which would put the typed text in the address bar);
  // each lead build binds its own endpoint.
  qa("form").forEach(function (f) { f.addEventListener("submit", function (e) { e.preventDefault(); }); });

  // Scroll text reveal (about page): each character has a dim layer and a dark layer that wipes in left to right.
  // Decoded from the copy: char i turns dark when the paragraph top passes 0.70*viewport height + i/(n-1)*0.95*paragraph height.
  // The copy has a separate phone text (different run of spaces), kept in data-reveal-phone.
  qa("[data-reveal]").forEach(function (el) {
    var desk = el.textContent, phone = el.getAttribute("data-reveal-phone") || desk, mq = matchMedia("(max-width: 767.98px)");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // plain dark text
    var dark = [], last = -1, tick = 0;
    function build() {
      var txt = mq.matches ? phone : desk;
      el.textContent = ""; dark = []; last = -1;
      for (var i = 0; i < txt.length; i++) {
        var o = document.createElement("span"), a = document.createElement("span"), b = document.createElement("span");
        o.className = "rv-c"; a.textContent = b.textContent = txt.charAt(i); b.className = "rv-d"; o.appendChild(a); o.appendChild(b); el.appendChild(o); dark.push(b);
      }
      el.classList.add("rv-on"); upd();
    }
    function upd() {
      tick = 0;
      var r = el.getBoundingClientRect(), n = dark.length, k = Math.floor(((innerHeight * 0.7 - r.top) / (0.95 * r.height)) * (n - 1)) + 1;
      k = Math.max(0, Math.min(n, k));
      if (k === last) return;
      var from = Math.min(k, Math.max(last, 0)), to = Math.max(k, Math.max(last, 0));
      for (var j = from; j < to; j++) dark[j].classList.toggle("on", j < k);
      last = k;
    }
    function sched() { if (!tick) tick = requestAnimationFrame(upd); }
    addEventListener("scroll", sched, { passive: true }); addEventListener("resize", sched);
    mq.addEventListener("change", build); build();
  });

  // Hero video: muted autoplay is allowed by browsers; if one still blocks it, start it on the first touch.
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; // reduced motion: keep the first frame, no autoplay
  qa("video").forEach(function (v) { v.muted = true; if (still) { v.removeAttribute("autoplay"); v.preload = "auto"; v.pause(); return; } var p = v.play(); if (p && p.catch) p.catch(function () { document.addEventListener("pointerdown", function () { v.play(); }, { once: true }); }); });
})();
