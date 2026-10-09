/* CuteCats: shared behaviour. Animation clock, scroll reveal, counters, card flip, header, footer, page curtain.
   Page scripts (home.js, ...) use window.fetchKit. */
(function () {
  "use strict";
  var W = window, D = document, root = D.documentElement;
  var reduced = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var kit = (W.fetchKit = { mode: "dog", subs: [], ticks: [], raf: 0, last: 0, reduced: reduced, fine: fine, clamp: clamp, hero: null });

  /* ---------- mode ---------- */
  function readMode() { return "cat"; }
  function setMode(m) {
    if (m === kit.mode) return;
    kit.mode = m;
    root.setAttribute("data-mode", m);
    try { W.sessionStorage.setItem("fetch-mode", m); var u = new URL(W.location.href); u.searchParams.set("mode", m); W.history.replaceState(null, "", u.toString()); } catch (e) {}
    kit.subs.forEach(function (f) { f(m); });
    syncToggles();
  }
  // a toggle on the page asks for a mode; the hero (home page only) follows with its own slide animation
  function requestMode(m) {
    setMode(m);
    if (kit.hero) W.setTimeout(function () { kit.hero.sync(m); }, 16);
  }
  function syncToggles() { D.querySelectorAll("[data-mode-toggle]").forEach(function (b) { b.setAttribute("aria-checked", kit.mode === "cat" ? "true" : "false"); }); }
  kit.setMode = setMode; kit.requestMode = requestMode;
  kit.mode = readMode();
  root.setAttribute("data-mode", kit.mode);
  D.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-mode-toggle]");
    if (b) requestMode(kit.mode === "dog" ? "cat" : "dog");
    var go = e.target.closest && e.target.closest("[data-set-mode]");
    if (go) requestMode(go.getAttribute("data-set-mode"));
  });
  syncToggles();

  /* ---------- animation clock: one requestAnimationFrame loop shared by every moving piece ---------- */
  function frame(now) {
    kit.raf = 0;
    var dt = clamp((now - kit.last) / 1000, 0.001, 0.05);
    kit.last = now;
    var t = kit.ticks.slice();
    for (var i = 0; i < t.length; i++) { try { t[i](now, dt); } catch (e) {} }
    if (kit.ticks.length) kit.raf = W.requestAnimationFrame(frame);
  }
  kit.addTick = function (fn) { if (kit.ticks.indexOf(fn) < 0) kit.ticks.push(fn); if (!kit.raf) { kit.last = performance.now(); kit.raf = W.requestAnimationFrame(frame); } };
  kit.removeTick = function (fn) { var i = kit.ticks.indexOf(fn); if (i >= 0) kit.ticks.splice(i, 1); };

  /* ---------- run a callback once an element scrolls into view ---------- */
  function onReveal(el, cb, margin) {
    if (reduced) { cb(); return; }
    var done = false, left = false;
    function fire() { if (done) return; done = true; io.disconnect(); W.clearTimeout(tm); W.clearInterval(iv); cb(); }
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) { left = true; return; }
      if (left) { var r = el.getBoundingClientRect(); if (r.top < W.innerHeight * 0.95 && r.bottom > 0) fire(); }
    }, { rootMargin: "0px 0px " + (margin || "-10%") + " 0px" });
    io.observe(el);
    W.requestAnimationFrame(function () { W.requestAnimationFrame(function () {
      if (done) return; var r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < W.innerHeight * 0.8 && r.bottom > W.innerHeight * 0.12) fire();
    }); });
    var tm = W.setTimeout(function () {
      var r = el.getBoundingClientRect();
      if (r.top > W.innerHeight || r.bottom < 0) left = true; else if (r.top < W.innerHeight * 0.88 && r.bottom > W.innerHeight * 0.08) fire();
    }, W.innerWidth < 1000 ? 0 : 420);
    var iv = W.setInterval(function () { var r = el.getBoundingClientRect(); if (left && r.top < W.innerHeight * 0.9 && r.bottom > 0) fire(); }, 900);
  }
  kit.onReveal = onReveal;
  D.querySelectorAll(".fk-rv,.fk-iris,.fk-draw,.fvc-item").forEach(function (el) { onReveal(el, function () { el.classList.add("fk-on"); }); });
  D.querySelectorAll("[data-ring]").forEach(function (el) { onReveal(el, function () { el.classList.add("fnm-ringon"); }); });

  /* ---------- count-up numbers ---------- */
  D.querySelectorAll(".count").forEach(function (el) {
    var to = +el.getAttribute("data-to"), dec = +el.getAttribute("data-decimals") || 0, suf = el.getAttribute("data-suffix") || "";
    var fmt = function (v) { return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    onReveal(el, function () {
      if (reduced) return;
      var t0 = performance.now();
      var step = function (now) {
        var o = clamp((now - t0) / 1700, 0, 1), s = 1 - Math.pow(1 - o, 3);
        el.textContent = fmt(to * s);
        if (o >= 1) { el.textContent = fmt(to); kit.removeTick(step); }
      };
      kit.addTick(step);
    });
  });

  /* ---------- flip cards: hover on a mouse, tap on touch ---------- */
  D.querySelectorAll(".fk-flip").forEach(function (el) {
    el.addEventListener("pointerenter", function () { if (fine) el.classList.add("fk-go"); });
    el.addEventListener("pointerleave", function () { if (fine) el.classList.remove("fk-go"); });
    el.addEventListener("click", function () { if (!fine) el.classList.toggle("fk-go"); });
  });

  /* ---------- header: compact bar after scrolling, phone menu ---------- */
  var bar = D.querySelector("[data-nav]"), burger = D.querySelector("[data-burger]"), menu = D.querySelector("[data-menu]");
  var menuOpen = false, navBusy = false;
  function paintBar() { if (bar) bar.classList.toggle("fx-compact", W.scrollY > 24 && !menuOpen); }
  W.addEventListener("scroll", function () { if (navBusy) return; navBusy = true; W.requestAnimationFrame(function () { navBusy = false; paintBar(); }); }, { passive: true });
  paintBar();
  function setMenu(open) {
    menuOpen = open;
    burger.classList.toggle("fx-open", open); menu.classList.toggle("fx-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false"); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    root.style.overflow = open ? "hidden" : "";
    paintBar();
  }
  if (burger && menu) {
    burger.addEventListener("click", function () { setMenu(!menuOpen); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* ---------- footer: opening-hours line, tennis ball, jumping letters, back to top ---------- */
  var status = D.querySelector("[data-status]");
  if (status) {
    var line = function () {
      status.innerHTML = "Mon–Thu 10:00–18:30 · Fri 10:00–13:00 · Sat–Sun 10:00–18:30";
      var dot = D.querySelector(".fxf-dot"); if (dot) dot.classList.add("is-open");
    };
    line(); W.setInterval(line, 30000);
  }
  var up = D.querySelector("[data-to-top]");
  if (up) up.addEventListener("click", function () { W.scrollTo({ top: 0, behavior: "smooth" }); });
  D.querySelectorAll(".fxf-ltr").forEach(function (l) {
    var jump = function () { l.classList.remove("fxf-jump"); void l.offsetWidth; l.classList.add("fxf-jump"); };
    l.addEventListener("pointerenter", jump); l.addEventListener("click", jump);
  });
  var play = D.querySelector(".fxf-play"), ball = D.querySelector(".fxf-ball"), hint = D.querySelector(".fxf-hint");
  if (play && ball && !reduced) {
    var pw = 0, ph = 0, r0 = 29;
    var measure = function () { var r = play.getBoundingClientRect(); pw = r.width; ph = r.height; r0 = ball.getBoundingClientRect().width / 2 || 29; };
    measure(); W.addEventListener("resize", measure);
    var x = 0, y = 0, vx = 0, vy = 0, rot = 0, started = false, held = false, tx = 0, ty = 0, lx = 0, ly = 0, visible = false;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(play);
    ball.addEventListener("pointerdown", function (e) {
      held = true; if (hint) hint.style.opacity = "0"; ball.setPointerCapture(e.pointerId);
      var r = play.getBoundingClientRect(); tx = lx = e.clientX - r.left; ty = ly = e.clientY - r.top; e.preventDefault();
    });
    W.addEventListener("pointermove", function (e) { if (!held) return; var r = play.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
    W.addEventListener("pointerup", function () { held = false; }, { passive: true });
    kit.addTick(function (now, dt) {
      if (!visible || pw === 0) return;
      if (!started) { started = true; x = Math.min(pw * 0.72, pw - r0 - 10); y = ph - r0 - 4; }
      if (held) { vx = (tx - lx) / Math.max(dt, 0.001) * 0.9; vy = (ty - ly) / Math.max(dt, 0.001) * 0.9; x = tx; y = ty; lx = tx; ly = ty; }
      else {
        vy += 2300 * dt; x += vx * dt; y += vy * dt;
        var floor = ph - r0 - 4;
        if (y > floor) { y = floor; vy = Math.abs(vy) > 90 ? -vy * 0.58 : 0; vx *= 0.965; }
        if (y < r0) { y = r0; vy = Math.abs(vy) * 0.6; }
        if (x < r0) { x = r0; vx = Math.abs(vx) * 0.7; }
        if (x > pw - r0) { x = pw - r0; vx = -Math.abs(vx) * 0.7; }
      }
      rot += vx * dt / (r0 * 0.017) * 0.4;
      ball.style.transform = "translate3d(" + (x - r0).toFixed(1) + "px," + (y - r0).toFixed(1) + "px,0) rotate(" + rot.toFixed(1) + "deg)";
    });
  }

  /* ---------- narrow screens: paint entrances that are hidden but in view ----------
     Below 1000px wide, anything that sits in view at opacity < .35 and fades its opacity (a reveal that has not fired, a
     dimmed word) is switched on at once; a phone does not wait for the fade-in choreography. Decorative dimming that has no
     opacity transition (ghost numerals) is left alone. */
  (function () {
    if (reduced) return;
    var pending = new WeakSet(), busy = false;
    function paint(el, o, vh) {
      if (o === null || isNaN(o) || o >= 0.35) { pending.delete(el); return; }
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.width < 24 || r.height < 12 || (el.textContent || "").trim().length < 3) { pending.delete(el); return; }
      if (!pending.has(el)) { pending.add(el); return; }
      el.style.setProperty("opacity", "1", "important");
      var t = el.style.transform;
      if (t && /^translate(3d|X|Y)?\(/.test(t) && !/scale|rotate|skew/.test(t)) el.style.setProperty("transform", "none", "important");
      pending.delete(el);
    }
    function sweep() {
      if (W.innerWidth >= 1000) return;
      var vh = W.innerHeight, i, list = D.querySelectorAll("[style*=\"opacity\"]");
      for (i = 0; i < list.length && i < 900; i++) { var v = list[i].style.opacity; paint(list[i], v === "" ? null : parseFloat(v), vh); }
      list = D.querySelectorAll("section [class], footer [class], main [class]");
      for (i = 0; i < list.length && i < 2500; i++) {
        var el = list[i]; if (el.style.opacity) continue;
        var cs = getComputedStyle(el); if (cs.position === "fixed" || cs.visibility === "hidden") continue;
        var tp = cs.transitionProperty || ""; if (tp.indexOf("opacity") < 0 && tp.indexOf("all") < 0) continue;
        paint(el, parseFloat(cs.opacity), vh);
      }
    }
    var go = function () { if (busy) return; busy = true; W.requestAnimationFrame(function () { busy = false; sweep(); }); };
    W.addEventListener("scroll", go, { passive: true }); W.addEventListener("resize", go, { passive: true });
    W.addEventListener("orientationchange", go, { passive: true }); W.addEventListener("pageshow", go);
    W.setInterval(sweep, 180); go();
  })();

  /* ---------- page curtain ---------- */
  var st = { leaving: false };
  function curtainDone() { if (st.leaving) return; root.classList.add("fxv-done"); root.classList.remove("fxv-returning", "fxv-leaving", "fxv-full"); root.classList.add("fxv-quick"); }
  if (reduced) { curtainDone(); }
  else {
    D.addEventListener("animationend", function (e) { if (e.animationName === "fxvExitUp" && !st.leaving) curtainDone(); }, true);
    var wait = function () {
      if (root.classList.contains("fxv-done") || st.leaving) return;
      var crt = D.querySelector(".fxv-crt"), anims = crt ? crt.getAnimations() : [];
      anims.some(function (a) { return a.playState === "running" || a.playState === "pending"; }) ? W.setTimeout(wait, 200) : curtainDone();
    };
    var delay = 2600, crt0 = D.querySelector(".fxv-crt");
    if (crt0) { var cs = getComputedStyle(crt0), ms = function (v) { return (parseFloat(v) || 0) * (v.indexOf("ms") > -1 ? 1 : 1000); }; delay = ms(cs.animationDelay) + ms(cs.animationDuration) + 140; }
    W.setTimeout(wait, Math.min(delay, 2800));
    W.setTimeout(function () { if (!st.leaving) curtainDone(); }, 5200);
    // leaving the page: the curtain drops with a paw print, then the next page loads and lifts it again
    D.addEventListener("click", function (e) {
      if (!root.classList.contains("fxv-done") || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download") || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0 || href.charAt(0) === "#") return;
      var u; try { u = new URL(a.href, W.location.href); } catch (err) { return; }
      if (u.origin !== W.location.origin || u.pathname === W.location.pathname) return;
      e.preventDefault();
      root.classList.toggle("fxv-cat", kit.mode === "cat"); root.classList.toggle("fxv-dog", kit.mode !== "cat");
      st.leaving = true; root.classList.remove("fxv-done", "fxv-returning"); root.classList.add("fxv-leaving");
      W.setTimeout(function () { W.location.href = u.href; }, 760);
    }, true);
    W.addEventListener("pageshow", function (e) { if (e.persisted) { st.leaving = false; root.classList.remove("fxv-leaving"); curtainDone(); } });
  }
})();
