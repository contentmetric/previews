(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPRING = "linear(0, 0.011, 0.0399, 0.0811, 0.1305, 0.1849, 0.2418, 0.2993, 0.3561, 0.4111, 0.4637, 0.5134, 0.56, 0.6032, 0.6432, 0.6799, 0.7135, 0.7441, 0.7718, 0.7969, 0.8194, 0.8397, 0.858, 0.8743, 0.8888, 0.9018, 0.9133, 0.9236, 0.9327, 0.9408, 0.9479, 0.9543, 0.9598, 0.9648, 0.9691, 0.9729, 0.9763, 0.9792, 0.9818, 0.9841, 0.9861, 0.9879, 0.9894, 0.9908, 0.9919, 0.993, 0.9939, 0.9947, 0.9953, 0.9959, 0.9965, 0.9969, 0.9973, 0.9977, 0.998, 0.9982, 0.9985, 0.9987, 0.9988, 1)";

  // ---------- Current page link underlined ----------
  const here = location.pathname.replace(/\/?$/, "/");
  $$("footer a, .site-header .links a, section a").forEach((a) => {
    if (!/desktop-desktop-text-3-a|text-a/.test(a.className)) return;
    if (new URL(a.href, location.href).pathname.replace(/\/?$/, "/") === here) a.classList.add("is-current");
  });

  // ---------- FAQ accordion: instant open/close ----------
  $$("[data-faq]").forEach((row) => {
    row.setAttribute("role", "button"); row.tabIndex = 0; row.setAttribute("aria-expanded", "false");
    const toggle = () => { const o = row.classList.toggle("is-open"); row.setAttribute("aria-expanded", o); };
    row.addEventListener("click", toggle);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });

  // ---------- Phone menu ----------
  const ov = $("#menu-overlay"), burger = $(".site-header .menu");
  if (ov && burger) {
    let timer = 0;
    const items = $$(".menu-link-item", ov);
    const open = () => {
      clearTimeout(timer); ov.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      ov.classList.remove("is-closing"); ov.classList.add("is-open"); ov.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
      if (reduced) return;
      ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
      items.forEach((li, i) => li.animate([{ opacity: 0, transform: "translateY(50px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 100 * i, easing: SPRING, fill: "backwards" }));
    };
    const close = () => {
      ov.classList.add("is-closing"); ov.classList.remove("is-open"); document.documentElement.style.overflow = "";
      const done = () => { ov.classList.remove("is-closing"); ov.setAttribute("aria-hidden", "true"); ov.getAnimations({ subtree: true }).forEach((a) => a.cancel()); };
      if (reduced) { done(); return; }
      ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: "ease-in", fill: "forwards" });
      items.forEach((li, i) => li.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(50px)" }], { duration: 800, delay: 100 * (items.length - 1 - i), easing: SPRING, fill: "forwards" }));
      timer = setTimeout(done, 1200);
    };
    burger.addEventListener("click", open);
    burger.style.cursor = "pointer";
    $(".menu-close", ov).addEventListener("click", close);
    $$("a", ov).forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ov.classList.contains("is-open")) close(); });
  }

  if (reduced) return;

  // ---------- Smooth scroll ----------
  if (window.Lenis) window.lenis = new Lenis({ smoothWheel: true, autoRaf: true, anchors: true });

  // ---------- Load entrance: opacity .001 -> 1, spring bounce 0, .8 s, ~0.3 s after DOM ready ----------
  const play = (el, from, delay, dur = 800) => {
    if (!el) return;
    el.animate([{ opacity: 0.001, transform: from }, { opacity: 1, transform: "none" }], { duration: dur, delay, easing: SPRING, fill: "backwards" });
  };
  const T = 300;
  play($(".site-header .logo"), "translateX(-25px)", T);
  $$(".site-header .links-div").forEach((e, i) => play(e, "translateY(25px)", T + 100 * i));
  play($(".site-header .actions"), "translateX(25px)", T);
  if ($(".hero-heading")) {
    play($(".gradient-glow"), "translateY(-50px)", T + 400);
    play($(".hero-heading-div"), "translateY(50px)", T);
    play($(".hero-hero-hero-heading-div"), "translateY(25px)", T + 400);
    $$(".hero-actions .image-stack figure, .hero-actions .achievement-div, .hero-actions .text-cta-div").forEach((e) => play(e, "translateY(25px)", T + 400));
  }

  // ---------- Marquees: -60 px/s, loop by one set ----------
  const marquees = $$("ul").filter((u) => u.children.length > 1 && /trusted-by|desktop-desktop-div-ul|banner-.*ul/.test(u.className)).map((ul) => {
    const li = [...ul.children], h0 = li[0].innerHTML;
    let k = li.findIndex((x, i) => i > 0 && x.innerHTML === h0); if (k < 1) k = 1;
    return { ul, set: li[k].offsetLeft - li[0].offsetLeft };
  });

  // ---------- Scroll-linked effects ----------
  const float = $(".floating-image");
  const bannerEl = $$("[class*=banner-]").find((e) => /perspective/.test(e.className ? getComputedStyle(e).transform + "" : "") || getComputedStyle(e).transform.startsWith("matrix3d"));
  const bannerBase = bannerEl ? getComputedStyle(bannerEl).transform : "";
  const video = $(".scroll-video .video-container"), trig = $(".scroll-trigger");
  const cover = $$("figure").find((f) => /project-cover-div-figure/.test(f.className));
  const docY = (e) => e.getBoundingClientRect().top + scrollY;
  const reveal = $$(".image-container-div-figure, .announcement-image-container-figure");
  const seen = new WeakSet();
  const t0 = performance.now();
  let cs = 1, last = t0;
  const frame = (now) => {
    const y = scrollY, dt = (now - t0) / 1000;
    marquees.forEach((m) => { m.ul.style.transform = `translateX(${-((dt * 60) % m.set)}px)`; });
    if (float) float.style.transform = `translateY(${-0.3 * y}px) rotate(15deg)`;
    if (bannerEl) bannerEl.style.transform = `translateY(${-0.3 * y}px) ${bannerBase}`;
    if (video && trig) {
      const vh = innerHeight, h = trig.offsetHeight, start = docY(trig) - 0.5 * vh;
      const p = Math.min(1, Math.max(0, (y - start) / h));
      video.style.transform = `scale(${1 - 0.3 * p})`;
    }
    if (cover) {
      const max = document.documentElement.scrollHeight - innerHeight;
      const target = 1 + 0.4 * (max > 0 ? y / max : 0);
      const dts = Math.min(0.05, (now - last) / 1000);
      cs += (target - cs) * (1 - Math.exp(-dts * 9.23 / 0.8));
      cover.style.transform = `scale(${cs})`;
    }
    last = now;
    reveal.forEach((f) => {
      if (seen.has(f)) return;
      const r = f.parentElement.getBoundingClientRect();
      if (r.top < innerHeight - 0.5 * Math.min(r.height, innerHeight) && r.bottom > 0) {
        seen.add(f);
        f.style.transform = "none";
        f.animate([{ transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 800, easing: SPRING });
      }
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // ---------- Words blur in (service card titles): blur 10, y 10, spring .6, .05 s per word ----------
  $$("[class*=service-][class*=title-div] h3").forEach((h) => {
    if (!$(".what-we-offer-span", h)) {
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="what-we-offer-span">${w.replace(/&/g, "&amp;")}</span>`).join(" ");
    }
    const spans = $$(".what-we-offer-span", h);
    let done = false;
    const check = () => {
      if (done) return;
      const r = h.getBoundingClientRect();
      if (r.top < innerHeight - 0.5 * Math.min(r.height, innerHeight) && r.bottom > 0) {
        done = true; removeEventListener("scroll", check);
        spans.forEach((s, i) => {
          s.animate([{ opacity: 0.001, filter: "blur(10px)", transform: "translateY(10px)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: 600, delay: 50 * i, easing: SPRING, fill: "backwards" });
          s.style.cssText += ";opacity:1;filter:none;transform:none";
        });
      }
    };
    addEventListener("scroll", check, { passive: true }); check();
  });
})();
