/* 3Arts Pottery site script (every page): smooth scroll, header, phone menu, entrance (appear) effects, reveal text.
   Timings and curves come from the decoded motion spec (INTERACTIONS.md). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPhone = () => innerWidth <= 809.98;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const E = { e1: "cubic-bezier(.44,0,.56,1)", e2: "cubic-bezier(.44,0,0,1)", e3: "cubic-bezier(.16,1,.3,1)" };
  // cubic-bezier as a function (for rAF tweens)
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) { const d = sx(t) - x; if (Math.abs(d) < 1e-5) break; const s = dx(t); if (Math.abs(s) < 1e-6) break; t -= d / s; }
      return sy(clamp(t, 0, 1));
    };
  };
  // the original starts its load-time effects when its runtime has hydrated (about 450ms after navigation)
  const warm = () => Math.max(0, 450 - performance.now());
  window.SC = { warm, $, $$, reduce, isPhone, clamp, E, bezier };

  /* smooth scroll: Lenis on desktop and tablet only (phones keep native scroll) */
  if (window.Lenis && !reduce && !isPhone()) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.lenis = lenis;
  }

  /* header: hides while scrolling down, returns on scroll up (4px of confirmed travel), turns into a cream bar after 44px on the home page */
  const header = $(".site-header");
  if (header) {
    const swap = document.body.classList.contains("home");
    let last = scrollY, dir = 0, anchor = scrollY;
    const tick = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (y !== last && y >= 0 && y <= max) {
        const d = y > last ? 1 : -1;
        if (d !== dir) { dir = d; anchor = last; }
        if (Math.abs(y - anchor) >= 4) header.classList.toggle("is-hidden", d === 1 && !header.classList.contains("is-open"));
      }
      if (y <= 0) header.classList.remove("is-hidden");
      last = y;
      if (swap) header.classList.toggle("is-light", y >= 44);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // phone menu
    const toggle = $(".menu-toggle", header);
    if (toggle) {
      const set = (open) => {
        header.classList.toggle("is-open", open);
        document.documentElement.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", () => set(!header.classList.contains("is-open")));
      $$(".phone-panel a", header).forEach((a) => a.addEventListener("click", () => set(false)));
      addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("is-open")) set(false); });
      addEventListener("resize", () => { if (!isPhone() && header.classList.contains("is-open")) set(false); });
    }
  }

  /* entrance effects: data-appear="opacity x y scale delay duration e1,e2,e3,e4 mode" (mode io = when it touches the viewport, scroll = at a scroll position, hero ones at load) */
  const appear = () => {
    const items = $$("[data-appear]");
    const play = (el, p) => {
      if (el.dataset.ap === "done") return;
      el.dataset.ap = "done";
      const [o, x, y, s, delay, dur, ease] = p;
      const to = { opacity: 1, transform: "none" };
      const from = { opacity: o, transform: `translate(${x}px, ${reduce ? 0 : y}px) scale(${s})` };
      const a = el.animate([from, to], { delay: delay * 1000 + warm(), duration: dur * 1000, easing: `cubic-bezier(${ease})`, fill: "both" });
      a.onfinish = () => { a.cancel(); el.style.opacity = ""; el.style.transform = ""; el.style.willChange = ""; };
    };
    const refTop = (el) => { let t = 0; for (let e = el; e; e = e.offsetParent) t += e.offsetTop; return t; };
    const scrollItems = [];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); play(e.target, e.target._ap); } }), { threshold: 0 });
    items.forEach((el) => {
      const p = el.dataset.appear.split(" "); const [o, x, y, s, d, du] = p.slice(0, 6).map(parseFloat);
      el._ap = [o, x, y, s, d, du, p[6]];
      const mode = p[7];
      el.style.opacity = String(o); el.style.transform = `translate(${x}px, ${y}px) scale(${s})`; el.style.willChange = "transform, opacity";
      el.dataset.ap = "set";
      if (mode === "io") io.observe(el);
      else if (mode === "load" || el.closest(".section-hero")) requestAnimationFrame(() => play(el, el._ap));
      else { let r = el.parentElement; while (r && getComputedStyle(r).display === "contents") r = r.parentElement; scrollItems.push([el, r]); }
    });
    if (scrollItems.length) {
      const check = () => {
        for (let i = scrollItems.length - 1; i >= 0; i--) {
          const [el, ref] = scrollItems[i];
          if (scrollY >= refTop(ref) - 1 - innerHeight) { play(el, el._ap); scrollItems.splice(i, 1); }
        }
        if (!scrollItems.length) removeEventListener("scroll", check);
      };
      addEventListener("scroll", check, { passive: true }); check();
    }
  };

  /* reveal text: characters slide up inside a clip box (0.9s headings / 0.6s sublines, curve e3) */
  const reveal = () => {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    const split = (el) => {
      const walk = (node, out) => {
        node.childNodes.forEach((n) => {
          if (n.nodeType === 3) {
            n.nodeValue.split(/(\s+)/).forEach((tok) => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { out.appendChild(document.createTextNode(tok)); return; }
              const w = document.createElement("span"); w.className = "rv-w";
              for (const ch of tok) { const m = document.createElement("span"); m.className = "rv-m"; const c = document.createElement("span"); c.className = "rv-c"; c.textContent = ch; m.appendChild(c); w.appendChild(m); }
              out.appendChild(w);
            });
          } else if (n.nodeType === 1) {
            if (n.tagName === "BR") out.appendChild(n.cloneNode());
            else { const cp = n.cloneNode(false); walk(n, cp); out.appendChild(cp); }
          }
        });
        return out;
      };
      const label = el.textContent.replace(/\s+/g, " ").trim();
      const clone = walk(el, document.createElement("div"));
      el.textContent = ""; while (clone.firstChild) el.appendChild(clone.firstChild);
      el.setAttribute("aria-label", label);
      $$(".rv-w", el).forEach((w) => w.setAttribute("aria-hidden", "true"));
    };
    const params = (el) => (el.tagName === "P" ? { delay: 0.5, stagger: 0.01, dur: 0.6, bottom: true } : { delay: el.closest(".section-hero") ? 0 : 0.2, stagger: 0.015, dur: 0.9, bottom: false });
    const run = (el) => {
      if (el._rv) return; el._rv = true;
      const q = params(el), chars = $$(".rv-c", el), w0 = warm();
      el.classList.add("rv-in");
      if (reduce) return;
      chars.forEach((c, i) => c.animate([{ transform: "translateY(110%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { delay: (q.delay + i * q.stagger) * 1000 + w0, duration: q.dur * 1000, easing: E.e3, fill: "backwards" }));
    };
    const ready = (document.fonts && document.fonts.ready) || Promise.resolve();
    ready.then(() => {
      els.forEach((el) => { split(el); el.classList.add("rv-ready"); });
      const test = () => {
        els.forEach((el) => {
          if (el._rv) return;
          // phone-only / desktop-only copies: skip anything not rendered
          const r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
          const anchor = params(el).bottom ? r.bottom : r.top;
          if ((anchor >= 0 && anchor <= innerHeight) || (r.top < innerHeight && r.bottom > 0)) run(el);
        });
      };
      addEventListener("scroll", test, { passive: true, capture: true }); addEventListener("resize", test);
      test(); setTimeout(test, 300);
    });
  };

  /* paragraph entrance: each line fades up 10px, lines 0.075s apart, 0.65s each (starts when the paragraph touches the viewport) */
  const lines = () => {
    const els = $$("[data-lines]"); if (!els.length) return;
    const splitWords = (el) => {
      const out = document.createDocumentFragment();
      const walk = (node, into) => node.childNodes.forEach((n) => {
        if (n.nodeType === 3) n.nodeValue.split(/(\s+)/).forEach((tok) => { if (!tok) return; if (/^\s+$/.test(tok)) into.appendChild(document.createTextNode(tok)); else { const w = document.createElement("span"); w.className = "ln-w"; w.textContent = tok; into.appendChild(w); } });
        else if (n.nodeType === 1) { if (n.tagName === "BR") into.appendChild(n.cloneNode()); else { const c = n.cloneNode(false); walk(n, c); into.appendChild(c); } }
      });
      walk(el, out); el.textContent = ""; el.appendChild(out);
    };
    const play = (el) => {
      if (el._ln) return; el._ln = true;
      const w0 = warm(), ws = $$(".ln-w", el), wt = ws.map((w) => Math.round(w.getBoundingClientRect().top)), tops = [...new Set(wt)].sort((a, b) => a - b);
      el.classList.add("ln-in");
      if (reduce) return;
      ws.forEach((w, i) => { const li = tops.indexOf(wt[i]);   /* line index measured before ln-in changes layout */
        w.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { delay: (0.5 + li * 0.075) * 1000 + w0, duration: 650, easing: E.e1, fill: "backwards" }); });
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } }), { threshold: 0 });
    els.forEach((el) => { splitWords(el); el.classList.add("ln-ready"); io.observe(el); });
  };

  /* primary buttons (plum pill) get the colour hover */
  const buttons = () => $$("a").forEach((a) => { const w = a.firstElementChild; if (w && getComputedStyle(w).backgroundColor === "rgb(63, 36, 85)" && getComputedStyle(w).borderTopLeftRadius !== "0px") a.dataset.kind = "primary"; });

  const start = () => { buttons(); appear(); reveal(); lines(); };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start); else start();
})();
