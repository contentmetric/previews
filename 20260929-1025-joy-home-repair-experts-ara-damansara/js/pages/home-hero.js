/* HERO scroll-linked motion ("Hero - Center - Girl").
   Scroll-linked transforms: progress runs linearly over
   [refTop - 1 - threshold * vh, same + refHeight], then the output follows a spring
   (stiffness 500, damping 60, mass 1). Every target in one range is linear in its progress,
   so we spring the progress itself and hand it to CSS:
     --p  ref = the heading block, threshold 0  (cards fly in, dashboard untilts, girl fades)
     --q  ref = the About section (next section), threshold .5 (dashboard block fades + y 460) */
(() => {
  const M = window.__makro;
  const sec = document.querySelector(".s-hero");
  if (!sec || !M) return;
  const head = sec.querySelector(".hero__head");
  const about = sec.nextElementSibling;
  const pageTop = (el) => { let t = 0; for (; el; el = el.offsetParent) t += el.offsetTop; return t; };   // layout position, ignores transforms

  let r1 = [0, 1], r2 = null;
  const measure = () => {
    r1 = [pageTop(head) - 1, head.offsetHeight || 1];
    r2 = about ? [pageTop(about) - 1 - innerHeight * 0.5, about.offsetHeight || 1] : null;
  };
  const prog = (r, y) => (r ? Math.min(1, Math.max(0, (y - r[0]) / r[1])) : 0);

  // one spring per progress value: x'' = -500 (x - target) - 60 x'
  const sp = [{ x: 0, v: 0, t: 0, name: "--p" }, { x: 0, v: 0, t: 0, name: "--q" }];
  const write = () => { for (const s of sp) sec.style.setProperty(s.name, s.x.toFixed(4)); };
  let raf = 0, last = 0;
  const step = (now) => {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;   // real elapsed time (long frames too); substeps keep it stable
    let moving = false;
    for (const s of sp) {
      for (let i = 0, n = Math.ceil(dt / 0.004), h = dt / n; i < n; i++) {
        s.v += (-500 * (s.x - s.t) - 60 * s.v) * h; s.x += s.v * h;
      }
      if (Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-3) { s.x = s.t; s.v = 0; } else moving = true;
    }
    write();
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const update = (y) => {
    sp[0].t = prog(r1, y); sp[1].t = prog(r2, y);
    if (M.reduce) { for (const s of sp) s.x = s.t; write(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  };

  measure();
  // start at rest where the page is (no spring on first paint)
  sp[0].x = sp[0].t = prog(r1, scrollY); sp[1].x = sp[1].t = prog(r2, scrollY); write();
  M.onScrollFns.push(update);
  addEventListener("resize", () => { measure(); update(scrollY); });
  addEventListener("load", () => { measure(); update(scrollY); });
})();
