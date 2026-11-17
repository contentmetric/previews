/* RenovateHub site script (every page): smooth scroll, header scroll state, phone menu. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ duration: 1.5 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  }

  // header: turns into the blurred dark bar once the page's [data-nav-trigger] element has reached mid-screen
  const header = document.querySelector(".site-header");
  const trigger = document.querySelector("[data-nav-trigger]");
  if (header) {
    const check = () => {
      const top = trigger ? trigger.getBoundingClientRect().top : 1;
      header.classList.toggle("is-scrolled", trigger ? top <= innerHeight * 0.5 + 1 : scrollY > 0);
    };
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    check();

    // phone / tablet menu
    const burger = header.querySelector(".humberger-block");
    if (burger) {
      burger.setAttribute("role", "button");
      burger.setAttribute("aria-label", "Menu");
      burger.setAttribute("aria-expanded", "false");
      burger.addEventListener("click", () => {
        const open = header.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("is-open")) burger.click(); });
    }
  }

  // FAQ accordion: one open at a time, click again closes
  document.querySelectorAll(".faq-card").forEach((card) => {
    const toggle = () => {
      const item = card.parentElement, open = !item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item.is-open").forEach((o) => { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); });
      item.classList.toggle("is-open", open);
      card.setAttribute("aria-expanded", String(open));
    };
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });

  // Logo ticker: clone the logos to fill twice the width, slide left at 50px/s, loop seamlessly
  document.querySelectorAll(".ticker-slider-div-div > ul").forEach((ul) => {
    const items = [...ul.children], gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    const setW = items.reduce((w, li) => w + li.getBoundingClientRect().width + gap, 0);
    if (!setW) return;
    for (let w = setW; w < ul.parentElement.clientWidth + setW; w += setW) items.forEach((li) => { const c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); ul.appendChild(c); });
    ul.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-setW}px)` }], { duration: (setW / 50) * 1000, iterations: Infinity });
  });

  // Before/after sliders: drag or click to move the divider, double-click resets to 50%, arrow keys nudge
  document.querySelectorAll('[role="slider"][aria-label="Image comparison slider"]').forEach((box) => {
    const before = box.querySelector('[aria-label="Before Image"]'), line = box.children[2], handle = box.children[3];
    let pct = 50;
    const set = (v) => {
      pct = Math.min(100, Math.max(0, v));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      line.style.left = handle.style.left = pct + "%";
      box.setAttribute("aria-valuenow", Math.round(pct));
    };
    const fromEvent = (e) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    box.tabIndex = 0;
    box.setAttribute("aria-valuemin", "0"); box.setAttribute("aria-valuemax", "100");
    set(50);
    box.addEventListener("pointerdown", (e) => { box.setPointerCapture(e.pointerId); fromEvent(e); });
    box.addEventListener("pointermove", (e) => { if (box.hasPointerCapture(e.pointerId)) fromEvent(e); });
    box.addEventListener("dblclick", () => set(50));
    box.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") set(pct - 5); else if (e.key === "ArrowRight") set(pct + 5); });
  });

  // Review slider: 5 copies of the cards, always re-centred on the middle copy so it loops;
  // autoplay every 4s (paused on hover), drag/swipe, dots. Desktop shows all 3 cards and does not slide.
  document.querySelectorAll(".review-section-responsive-div").forEach((view) => {
    const track = view.firstElementChild, dots = [...view.parentElement.querySelectorAll('button[aria-label^="Go to slide"]')];
    const cards = [...track.children];
    const N = dots.length || 3;
    let idx = 2 * N, drag = null, timer = null, hover = false;
    const step = () => cards[0].getBoundingClientRect().width + 20;
    const canSlide = () => cards.length >= N * 5 && getComputedStyle(cards[N]).display !== "none";
    const paint = () => dots.forEach((d, i) => d.classList.toggle("is-on", i === ((idx % N) + N) % N));
    const place = (px, animate) => { track.style.transition = animate ? "" : "none"; track.style.transform = `translate3d(${px}px,0,0)`; };
    const go = (i) => { idx = i; place(-idx * step(), true); paint(); };
    track.addEventListener("transitionend", (e) => {
      if (e.target !== track || !canSlide()) return;
      if (idx < N || idx >= 3 * N) { idx = 2 * N + (((idx % N) + N) % N); place(-idx * step(), false); }
    });
    const fit = () => {
      if (!canSlide()) { track.style.transform = track.style.transition = ""; clearInterval(timer); return; }
      idx = 2 * N + (((idx % N) + N) % N); place(-idx * step(), false); paint();
      clearInterval(timer); timer = setInterval(() => { if (!hover && !drag && canSlide()) go(idx + 1); }, 4000);
    };
    dots.forEach((d, i) => d.addEventListener("click", () => canSlide() && go(idx - (((idx % N) + N) % N) + i)));
    view.addEventListener("mouseenter", () => (hover = true));
    view.addEventListener("mouseleave", () => (hover = false));
    view.addEventListener("pointerdown", (e) => { if (canSlide()) drag = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId }; });
    view.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.on) { if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return; drag.on = true; view.setPointerCapture(drag.id); view.style.cursor = "grabbing"; }
      place(-idx * step() + dx, false);
    });
    const end = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, on = drag.on; drag = null; view.style.cursor = "";
      if (!on) return;
      go(Math.abs(dx) >= Math.min(100, step() * 0.22) ? idx + (dx < 0 ? 1 : -1) : idx);
    };
    view.addEventListener("pointerup", end);
    view.addEventListener("pointercancel", end);
    let w = view.clientWidth;
    new ResizeObserver(() => { if (view.clientWidth !== w) { w = view.clientWidth; fit(); } }).observe(view);
    fit();
  });
  /* process timeline: sticky section, steps light up with scroll progress */
  (function () {
    var sec = document.querySelector('section[aria-label="Scroll progress timeline"]');
    if (!sec) return;
    var q = function (c) { return sec.querySelector(c); };
    var gridH = q(".our-process-our-process-our-div-8"), lineH = q(".our-process-our-process-our-div-3"), lineV = q(".our-process-our-process-our-div-2");
    var pillsH = [].slice.call(gridH.querySelectorAll("span")), artsH = [].slice.call(q(".our-process-our-process-our-div-10").children);
    var artsV = [].slice.call(lineH.children), N = artsH.length, TOP = 120, W = 1 / N;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)");
    var pillsV = artsV.map(function (a) { return a.querySelectorAll("span")[1]; });
    var skin = {};
    function grab(list, key) {
      if (skin[key]) return skin[key];
      list.forEach(function (e) { e.style.background = e.style.color = ""; });
      var on = getComputedStyle(list[0]), off = getComputedStyle(list[1]);
      return (skin[key] = { on: [on.backgroundColor, on.color], off: [off.backgroundColor, off.color] });
    }
    var clamp = function (v) { return Math.min(Math.max(v, 0), 1); };
    function update() {
      var horiz = getComputedStyle(gridH).display !== "none";
      var vh = innerHeight, r = sec.getBoundingClientRect();
      var p = clamp((TOP - r.top) / Math.max(r.height - vh + TOP, 1));
      var rm = reduce.matches;
      var G = W + p * (1 - W);
      if (rm) { G = clamp(Math.round(G * N) / N); p = clamp(Math.round(p * N) / N); }
      var pills = horiz ? pillsH : pillsV, sk = grab(pills, horiz ? "h" : "v");
      for (var i = 0; i < N; i++) {
        var n = clamp(G * N - i), on = n > 0.5, o = 0.32 + 0.68 * n;
        pills[i].style.background = (on ? sk.on : sk.off)[0];
        pills[i].style.color = (on ? sk.on : sk.off)[1];
        var box = horiz ? artsH[i] : artsV[i].children[1];
        box.style.opacity = o;
        box.style.transition = rm ? "none" : "";
      }
      if (horiz) {
        var last = pillsH[N - 1].getBoundingClientRect(), base = lineH.parentNode.getBoundingClientRect();
        var P = Math.min(Math.max(last.right - base.left, 0), base.width);
        sec.querySelector(".our-process-our-div").style.width = P + "px";
        lineH.style.width = P * p + "px";
        lineV.style.transform = "";
      } else {
        lineH.style.width = "";
        sec.querySelector(".our-process-our-div").style.width = "";
        lineV.style.transform = "scaleY(" + p + ")";
        lineV.style.transition = rm ? "none" : "";
      }
    }
    var raf = 0, tick = function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); };
    addEventListener("scroll", tick, { passive: true });
    addEventListener("resize", tick);
    update();
  })();
  /* category tabs (projects, services): show the cards whose label matches the tab */
  document.querySelectorAll('[class*="tabing-category-div"]').forEach(function (bar) {
    if (bar.children.length < 2 || !bar.querySelector("p")) return;
    var content = bar.closest('[class*="tabing-content"]'), list = content && content.querySelector('[class*="filter-block-div"]');
    if (!list) return;
    var norm = function (t) { return t.trim().toLowerCase().replace(/\s+/g, "-"); };
    var tabs = [].slice.call(bar.querySelectorAll("p")), cards = [].slice.call(list.children);
    var label = function (c) { var e = c.querySelector(".category-name p, [class*='services-section-text-7']"); return e ? norm(e.textContent) : ""; };
    function pick(tab) {
      var all = norm(tab.textContent) === "all";
      tabs.forEach(function (p) {
        var on = p === tab, box = p.parentElement.parentElement;
        box.className = on ? "project-tabing-section-active" : "default";
        p.className = on ? "project-tabing-section-text" : "project-tabing-section-text-2";
      });
      cards.forEach(function (c) { c.hidden = !all && label(c) !== norm(tab.textContent); });
    }
    tabs.forEach(function (p) { p.parentElement.parentElement.addEventListener("click", function () { pick(p); }); });
  });
  /* contact form: markup only, nothing is sent */
  document.querySelectorAll("form.contact-right-bottom-form").forEach(function (f) {
    var note = f.querySelector(".form-note");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      note.textContent = f.querySelector('input[type="checkbox"]:checked') ? "This form is not connected yet." : "Please choose at least one service.";
      note.hidden = false;
    });
  });
})();
