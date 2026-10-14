/* SkillClass home page: hero, scroll-linked effects, timeline, parallax images, video, lightbox, ticker, FAQ, forms.
   Numbers are from the decoded motion spec (INTERACTIONS.md, sections 4.x). */
(() => {
  "use strict";
  const { $, $$, reduce, isPhone, clamp, E, bezier, warm } = window.SC;
  const chainTop = (el) => { let t = 0; for (let e = el; e; e = e.offsetParent) t += e.offsetTop; return t; };
  const docTop = (el) => el.getBoundingClientRect().top + scrollY;
  const frame = []; // callbacks run on every animation frame while scrolling or resizing
  let dirty = true;
  const mark = () => { dirty = true; };
  addEventListener("scroll", mark, { passive: true }); addEventListener("resize", mark);
  const loop = () => { if (dirty) { dirty = false; frame.forEach((f) => f()); } requestAnimationFrame(loop); };

  /* ---- hero: background drifts at 30% of the scroll speed and scales in from 1.1 (0.8s) ---- */
  const hero = () => {
    const bg = $(".bg-image-parallax"); if (!bg) return;
    let sc = reduce ? 1 : 1.1; const ease = bezier(.17, .56, .43, .91);
    const paint = () => { bg.style.transform = `translate3d(0, ${(0.3 * scrollY).toFixed(2)}px, 0) scale(${sc})`; };
    if (!reduce) { const t0 = performance.now() + warm(); const step = (t) => { const p = clamp((t - t0) / 800, 0, 1); sc = 1.1 - 0.1 * ease(p); paint(); if (p < 1 || t < t0) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    frame.push(paint); paint();
  };

  /* ---- create: three sticky cards scale down as the next one arrives, header fades ---- */
  const create = () => {
    const c1 = $("#card-one"), c2 = $("#card-two"), c3 = $("#card-three"), head = $(".section-create-container > .header");
    if (!c1 || !c2 || !c3) return;
    [c1, c2, c3].forEach((c) => { c.style.transformOrigin = "50% 0"; c.style.willChange = "transform"; });
    const ramp = (ref) => clamp((scrollY - (chainTop(ref) - 1 - innerHeight)) / ref.offsetHeight, 0, 1);
    frame.push(() => {
      const a = ramp(c2), b = ramp(c3);
      c1.style.transform = `scale(${b > 0 ? 0.9 - 0.1 * b : 1 - 0.1 * a})`;
      c2.style.transform = `scale(${1 - 0.1 * b})`;
      if (head) head.style.opacity = String(1 - b);
    });
  };

  /* ---- timeline: sticky container, horizontal track driven by the section height, 8 progress lines, 7 dots ---- */
  const timeline = () => {
    const cards = $(".section-timeline-cards"), trig = $(".section-timeline-horizontal-scroll-trigger");
    if (!cards || !trig) return;
    const steps = $$(".triggers-for-progress-dots > div"), items = $$(".section-timeline-card");
    const lines = items.map((c) => $(".progress-line", c)), dots = items.map((c) => $(".progress-circle", c));
    frame.push(() => {
      const top = docTop(trig), h = trig.offsetHeight, parentW = cards.parentElement.clientWidth, f = cards.offsetWidth - parentW;
      if (h - innerHeight > 0) {
        const t = Math.max((scrollY - top) / (h - innerHeight), 0);
        cards.style.transform = `translateX(${-Math.round(Math.min(t, 1) * f + Math.max(t - 1, 0) * 0.4 * parentW)}px)`;
      }
      steps.forEach((s, k) => {
        const start = docTop(s) - 1 - innerHeight;
        if (lines[k]) lines[k].style.transform = `translateX(${-360 + 360 * clamp((scrollY - start) / 420, 0, 1)}px)`;
        if (k > 0 && items[k]) items[k].classList.toggle("is-on", scrollY >= start);
      });
    });
  };

  /* ---- parallax images: the picture drifts inside its clipped box (target smoothed, 55 ms time constant) ---- */
  const parallax = () => {
    const imgs = $$(".vp-img").map((img) => ({ img, box: img.parentElement, ty: null, on: false }));
    if (!imgs.length) return;
    let last = performance.now();
    const run = (now) => {
      const dt = Math.min(64, now - last); last = now;
      for (const o of imgs) {
        const r = o.box.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200 || !r.height) continue;
        const g = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
        const s = Math.min(80, (o.img.offsetHeight - o.box.offsetHeight) / 2);
        const target = reduce ? 0 : (g * 2 - 1) * s;
        o.ty = o.ty === null ? target : o.ty + (target - o.ty) * (1 - Math.exp(-dt / 55));
        o.img.style.transform = `translate3d(0, ${o.ty.toFixed(2)}px, 0)`;
        if (!o.on) { o.on = true; o.img.style.opacity = "1"; }
      }
      requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  };

  /* ---- decorative images bob up and down forever ---- */
  const bob = () => {
    if (reduce) return;
    [[".decorative-image-1", 0], [".decorative-image-2", 0.5]].forEach(([sel, delay]) => {
      const el = $(sel); if (!el) return;
      el.animate([{ transform: "translateY(0)" }, { transform: "translateY(10px)" }], { duration: 2000, delay: delay * 1000, easing: E.e1, direction: "alternate", iterations: Infinity, fill: "backwards" });
    });
  };

  /* ---- video: starts when it first touches the viewport, the round button toggles play / pause ---- */
  const video = () => {
    const sec = $(".section-video"); if (!sec) return;
    const vids = $$("video", sec);
    const vis = () => vids.find((v) => v.offsetParent !== null) || vids[0];
    const setIcon = (playing) => sec.classList.toggle("is-playing", playing);
    const play = () => { const v = vis(); v.play().then(() => setIcon(true)).catch(() => setIcon(false)); };
    const pause = () => { const v = vis(); v.pause(); setIcon(false); };
    vids.forEach((v) => { v.removeAttribute("autoplay"); v.muted = true; v.pause(); });
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0 });
    io.observe($(".pause", sec));
    $$(".s-play, .m-play, .l-play", sec).forEach((b) => {
      b.setAttribute("role", "button"); b.setAttribute("tabindex", "0"); b.setAttribute("aria-label", "Play or pause the video");
      const tog = () => { const v = vis(); if (v.paused) play(); else pause(); };
      b.addEventListener("click", tog);
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
    });
  };

  /* ---- gallery lightbox: instant dark overlay, closes on Escape or a click outside the picture ---- */
  const lightbox = () => {
    const tiles = $$(".section-gallery .section-gallery-section-gallery-image-div, .section-gallery .section-gallery-image-div");
    const imgs = $$(".section-gallery .lightbox-image img");
    let box = null;
    const close = () => { if (box) { box.remove(); box = null; } };
    const open = (src) => {
      close();
      box = document.createElement("div"); box.className = "lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
      box.innerHTML = '<div class="lightbox-pad"><img alt=""></div>'; $("img", box).src = src;
      box.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") close(); });
      document.body.appendChild(box);
    };
    imgs.forEach((img) => {
      const tile = img.closest(".section-gallery-section-gallery-image-div") || img.parentElement;
      tile.style.cursor = "pointer"; tile.addEventListener("click", () => open(img.src));
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  };

  /* ---- testimonial ticker: 100px/s to the left, draggable with inertia, seamless loop ---- */
  const ticker = () => {
    const ul = $(".ticker-ul"); if (!ul) return;
    const wrap = ul.parentElement; const items = [...ul.children];
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 24;
    const measure = () => {
      const first = items[0].getBoundingClientRect().left, last = items[items.length - 1].getBoundingClientRect();
      return (last.right - first) + gap;
    };
    let period = 0, x = 0, vx = 0, dragging = false, inertia = false, lx = 0, lt = 0, moved = 0, run = !reduce;
    const clones = () => {
      $$("[data-clone]", ul).forEach((c) => c.remove());
      period = measure(); if (!period) return;
      const need = Math.ceil((wrap.clientWidth + items[0].offsetWidth) / period) + 1;
      for (let n = 0; n < need; n++) items.forEach((li) => { const c = li.cloneNode(true); c.setAttribute("data-clone", ""); c.setAttribute("aria-hidden", "true"); ul.appendChild(c); });
    };
    ul.style.opacity = "1";
    ul.style.width = "max-content"; ul.style.maxWidth = "none";
    clones(); addEventListener("resize", clones);
    const io = new IntersectionObserver((es) => { run = es[0].isIntersecting && !reduce; }, { rootMargin: "200px" }); io.observe(wrap);
    let last = performance.now(); const wrapX = (v) => ((v % period) + period) % period;
    const tick = (now) => {
      const dt = Math.min(0.064, (now - last) / 1000); last = now;
      if (period) {
        if (!dragging) {
          if (inertia) { x += vx * dt; vx *= Math.exp(-dt / 0.75); if (Math.abs(vx) <= 100) inertia = false; }
          else if (run) x -= 100 * dt;
        }
        ul.style.transform = `translateX(${-wrapX(-x)}px)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    ul.style.cursor = "ew-resize"; ul.style.touchAction = "pan-y"; ul.style.userSelect = "none";
    ul.addEventListener("pointerdown", (e) => { dragging = true; inertia = false; lx = e.clientX; lt = performance.now(); moved = 0; vx = 0; ul.setPointerCapture(e.pointerId); });
    ul.addEventListener("pointermove", (e) => { if (!dragging) return; const now = performance.now(), dx = e.clientX - lx; x += dx; moved += Math.abs(dx); if (now > lt) vx = (dx / (now - lt)) * 1000 * 0.8 / 0.8; lx = e.clientX; lt = now; });
    const end = () => { if (!dragging) return; dragging = false; if (Math.abs(vx) > 100) { vx = vx * 0.8 / 0.75 * 0.75; inertia = true; } };
    ul.addEventListener("pointerup", end); ul.addEventListener("pointercancel", end);
    ul.addEventListener("click", (e) => { if (moved > 3) { e.preventDefault(); e.stopPropagation(); } }, true);
  };

  /* ---- FAQ: one item open at a time, 0.5s height tween ---- */
  const faq = () => {
    const items = $$(".section-faqs-wrap .closed");
    const ease = E.e1;
    const open = (it) => {
      const h0 = it.offsetHeight; it.classList.add("is-open"); it.setAttribute("aria-expanded", "true");
      const h1 = it.offsetHeight;
      it.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 500, easing: ease });
    };
    const shut = (it) => {
      const h1 = it.offsetHeight; it.classList.remove("is-open"); it.setAttribute("aria-expanded", "false");
      const h0 = it.offsetHeight;
      it.animate([{ height: h1 + "px" }, { height: h0 + "px" }], { duration: 500, easing: ease });
    };
    items.forEach((it) => {
      it.setAttribute("role", "button"); it.setAttribute("tabindex", "0"); it.setAttribute("aria-expanded", "false");
      const toggle = () => { const was = it.classList.contains("is-open"); items.forEach((o) => { if (o !== it && o.classList.contains("is-open")) shut(o); }); if (was) shut(it); else open(it); };
      it.addEventListener("click", toggle);
      it.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
  };

  /* ---- apply form: focus ring, phone field with country list, submit states (no network) ---- */
  const form = () => {
    const f = $("form.form-add-you-email-in"); if (!f) return;
    const btn = $("button[type=submit]", f), label = $("p", btn);
    const required = $$("[required]", f);
    const check = () => { const ok = f.checkValidity(); btn.classList.toggle("is-ready", ok); };
    f.addEventListener("input", check); f.addEventListener("change", check); check();
    // phone: format as typed, country picker
    const tel = $("input[type=tel]", f), full = $("input[name='Full Phone Number']", f), combo = $("[role=combobox]", f);
    const wrap = combo.closest(".section-apply-form-div");
    let dial = "+1", iso = "us";
    const countries = (window.COUNTRIES || []).slice().sort((a, b) => a[1].localeCompare(b[1]));
    const fmt = (d) => { d = d.replace(/\D/g, "").slice(0, 15); return d.length > 6 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d; };
    const sync = () => { full.value = tel.value ? `${dial} ${tel.value}` : ""; };
    tel.addEventListener("input", () => { tel.value = fmt(tel.value); sync(); });
    const flag = $("img", combo);
    let list = null;
    const closeList = () => { if (!list) return; const l = list; list = null; combo.setAttribute("aria-expanded", "false"); combo.classList.remove("is-open"); const a = l.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-10px)" }], { duration: 200, easing: E.e1 }); a.onfinish = () => l.remove(); };
    const openList = () => {
      list = document.createElement("div"); list.className = "country-list"; list.setAttribute("role", "listbox");
      list.innerHTML = '<div class="country-search"><input type="text" placeholder="Search countries..." class="country-search-input"></div><div class="country-rows"></div>';
      const rows = $(".country-rows", list);
      const paint = (q) => { rows.textContent = ""; countries.filter((c) => c[1].toLowerCase().includes(q.toLowerCase())).forEach((c) => {
        const r = document.createElement("div"); r.className = "country-row"; r.setAttribute("role", "option"); r.setAttribute("aria-selected", String(c[0].toLowerCase() === iso));
        r.innerHTML = `<img src="/img/flags/${c[0].toLowerCase()}.png" alt="" width="16" height="12"><span></span>`; $("span", r).textContent = c[1];
        r.addEventListener("click", () => { iso = c[0].toLowerCase(); dial = c[2]; flag.src = `/img/flags/${iso}.png`; flag.alt = c[1] + " flag"; sync(); closeList(); tel.focus(); });
        rows.appendChild(r); }); };
      paint(""); $(".country-search-input", list).addEventListener("input", (e) => paint(e.target.value));
      wrap.appendChild(list); combo.setAttribute("aria-expanded", "true"); combo.classList.add("is-open");
      list.animate([{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 200, easing: E.e1 });
      $(".country-search-input", list).focus();
    };
    combo.setAttribute("aria-haspopup", "listbox"); combo.setAttribute("aria-expanded", "false"); combo.setAttribute("tabindex", "0");
    combo.addEventListener("click", () => (list ? closeList() : openList()));
    document.addEventListener("mousedown", (e) => { if (list && !list.contains(e.target) && !combo.contains(e.target)) closeList(); });
    // submit: nothing is sent anywhere
    f.addEventListener("submit", (e) => {
      e.preventDefault(); if (!f.checkValidity()) return;
      btn.classList.add("is-pending"); label.textContent = "";
      setTimeout(() => { btn.classList.remove("is-pending"); btn.classList.add("is-error"); label.textContent = "This form is not connected yet"; setTimeout(() => { btn.classList.remove("is-error"); label.textContent = "Submit"; }, 3000); }, 900);
    });
  };

  /* ---- footer newsletter: same idea, no network ---- */
  const newsletter = () => {
    const f = $("footer form.form"); if (!f) return;
    const btn = $("button[type=submit]", f), txt = $("p", btn), msg = txt.textContent;
    f.addEventListener("submit", (e) => { e.preventDefault(); if (!f.checkValidity()) return; txt.textContent = "Not connected yet"; setTimeout(() => { txt.textContent = msg; }, 2500); });
  };

  hero(); create(); timeline(); parallax(); bob(); video(); lightbox(); ticker(); faq(); form(); newsletter();
  requestAnimationFrame(loop);
})();
