/* Makro site script. Every motion value is measured, not chosen by eye (notes in BUILD.md).
   Section scripts live in js/pages/home-<section>.js and use window.__makro (bottom of this file). */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const bp = () => (innerWidth >= 1200 ? "desk" : innerWidth >= 810 ? "tab" : "ph");

  // ---- smooth scroll: Lenis with its defaults (lerp .1,
  //   smooth wheel); it starts every visit at the top
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  }

  // ---- current page link (header, hero options, footer: the footer draws it in full ink, as the
  //   reference does on /about and /contact). Off the three homepages the Hero Options pill shows
  //   option 1 on the lime disc (.is-on: it links to / and is not the current page).
  const here = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".hdr__links a, .hopts__track a, .ftr__col a").forEach((a) => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
  const opts = document.querySelectorAll(".hopts__track a");
  if (opts.length && ![...opts].some((a) => a.hasAttribute("aria-current"))) opts[0].classList.add("is-on");

  // ---- scroll-linked state (variant targets): the active state is the one of the
  //   LAST marker whose top has passed a line in the window: the header's markers
  //   (data-nav="light|dark") at the top edge (threshold 0, measured: switches when the
  //   marker's top is within 1px of it), the page background's markers (data-bg="dark|light")
  //   at the middle (threshold .5). Scrolling back restores the earlier state.
  const navMarks = [...document.querySelectorAll("[data-nav]")];
  const bgMarks = [...document.querySelectorAll("[data-bg]")];
  const onScrollFns = [];
  const pick = (marks, line, attr, def) => {
    let v = def;
    for (const m of marks) if (m.getBoundingClientRect().top <= line) v = m.getAttribute(attr);
    return v;
  };
  function tick() {
    const y = scrollY;
    root.dataset.nav = pick(navMarks, 1, "data-nav", "hero");
    root.classList.toggle("is-dark-bg", pick(bgMarks, innerHeight * 0.5, "data-bg", "light") === "dark");
    for (const f of onScrollFns) f(y);
  }
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);

  // ---- phone / tablet menu: the burger opens the header box downwards to its content height
  //   ("Mobile Open": links + button, 48px bottom padding), spring {1, .2}
  const box = document.querySelector(".hdr__box");
  const setMenu = (on) => {
    root.classList.toggle("is-menu", on);
    document.querySelectorAll("[data-menu-toggle]").forEach((b) => { b.setAttribute("aria-expanded", String(on)); b.setAttribute("aria-label", on ? "Close menu" : "Open menu"); });
  };
  // content height of the open box = top row + gap + links + gap + button + 48px padding
  const openHeight = () => { if (!box) return; const kids = [...box.children]; const h = kids.reduce((s, k) => s + k.offsetHeight, 0) + 32 * (kids.length - 1) + 48; box.style.setProperty("--open-h", h + "px"); };
  document.querySelectorAll("[data-menu-toggle]").forEach((b) => b.addEventListener("click", () => { openHeight(); setMenu(!root.classList.contains("is-menu")); }));
  document.querySelectorAll(".hdr__links a, .hdr__cta a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-menu")) setMenu(false); });
  addEventListener("resize", () => { if (bp() === "desk" && root.classList.contains("is-menu")) setMenu(false); else openHeight(); });

  // ---- parallax speed: translateY = -scrollY x (speed / 100 - 1)
  const drifters = [...document.querySelectorAll("[data-speed]")];
  if (drifters.length && !reduce) onScrollFns.push((y) => { for (const el of drifters) el.style.transform = `translate3d(0, ${(-y * (el.dataset.speed / 100 - 1)).toFixed(2)}px, 0)`; });

  // ---- scroll-in appear (once): .is-in when in view; data-th sets the
  //   threshold (0 by default), data-appear-parent watches the parent instead (for items that
  //   start fully outside a clipped box)
  const ios = {};
  const io = (th) => ios[th] || (ios[th] = new IntersectionObserver((es, o) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const t = e.target; (t.__appear || [t]).forEach((x) => x.classList.add("is-in")); o.unobserve(t);
  }), { threshold: +th }));
  document.querySelectorAll("[data-appear]").forEach((el) => {
    const target = el.hasAttribute("data-appear-parent") ? el.parentElement : el;
    (target.__appear = target.__appear || []).push(el);
    if (target !== el && target.__appear.length > 1) return;
    io(el.dataset.th || "0").observe(target);
  });
  if (reduce) document.querySelectorAll("[data-appear]").forEach((el) => el.classList.add("is-in"));

  // ---- load entrances start after first paint
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-loaded")));

  tick();
  window.__makro = { reduce, bp, lenis, onScrollFns, tick, io };
})();
