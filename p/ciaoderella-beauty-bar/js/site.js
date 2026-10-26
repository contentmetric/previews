(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // Header scroll state: on once the page's header-trigger element has reached the top of the viewport.
  const trigger = document.querySelector('[class*="header-trigger"]');
  const headerState = () => root.classList.toggle('is-scrolled', trigger ? trigger.getBoundingClientRect().top <= 0 : scrollY > 0);
  addEventListener('scroll', headerState, { passive: true });
  addEventListener('resize', headerState);
  headerState();

  // Appear on view: in view once the visible part reaches amount x min(height, viewport) (amount .5 default, 0 = any pixel)
  const thresholds = Array.from({ length: 100 }, (_, i) => i / 99);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target, amount = parseFloat(el.getAttribute('data-appear-amount') ?? '0.5');
      const r = e.boundingClientRect;
      if (r.height && amount > 0 && e.intersectionRect.height / Math.min(r.height, innerHeight) < amount) continue;
      el.style.transitionDelay = (el.getAttribute('data-appear') || '0') + 's';
      el.classList.add('in');
      io.unobserve(el);
    }
  }, { threshold: thresholds });
  document.querySelectorAll('[data-appear]').forEach((el) => io.observe(el));

  // Parallax: translate = -scrollY * (speed/100 - 1), via the translate property
  const par = [...document.querySelectorAll('[data-parallax]')];
  if (!reduced && par.length) {
    let q = false;
    const upd = () => { q = false; for (const el of par) { const r = el.parentElement.getBoundingClientRect(); el.style.translate = '0 ' + (-scrollY * (parseFloat(el.dataset.parallax) / 100 - 1)) + 'px'; } };
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // Logo ticker and any marquee: translate the list left at 30 px/s, wrapping after half its width (the list is doubled)
  if (!reduced) document.querySelectorAll('section > ul').forEach((ul) => {
    if (ul.children.length < 8) return;
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    let x = 0, last = performance.now();
    const loop = (t) => { const half = (ul.scrollWidth + gap) / 2; x -= 30 * (t - last) / 1000; last = t; if (-x >= half) x += half; ul.style.transform = 'translateX(' + x + 'px)'; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });

  // Counters: count from 0 to the target when scrolled into view (reference counts for ~2 s)
  document.querySelectorAll('.title-div-div-span').forEach((sp) => {
    const m = /^(\d+)(.*)$/.exec(sp.textContent.trim()); if (!m) return;
    const end = +m[1], suffix = m[2]; sp.dataset.end = m[1];
    const cio = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; cio.disconnect(); if (reduced) { sp.textContent = end + suffix; return; }
      const t0 = performance.now(), D = 2000;
      const step = (t) => { const k = Math.min(1, (t - t0) / D); sp.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); }, { threshold: 0.5 });
    cio.observe(sp);
  });

  // Explore dropdown: hover the nav item (or the panel) to show it; it hides when the pointer leaves both.
  const exploreItem = document.getElementById('undefined-7cn8yr'), dd = exploreItem && exploreItem.querySelector('.explore-dd');
  if (dd) {
    document.body.appendChild(dd); // out of the header: its backdrop-filter would become the fixed panel's containing block
    dd.addEventListener('mouseenter', () => clearTimeout(dd._t)); dd.addEventListener('mouseleave', () => { dd._t = setTimeout(() => dd.classList.remove('is-open'), 80); });
    let t;
    const show = () => { clearTimeout(t); clearTimeout(dd._t); const r = exploreItem.getBoundingClientRect(), hb = exploreItem.closest('section').getBoundingClientRect(); dd.style.left = (r.left - 4) + 'px'; dd.style.top = (hb.bottom - 10) + 'px'; dd.classList.add('is-open'); };
    const hide = () => { t = setTimeout(() => dd.classList.remove('is-open'), 80); };
    exploreItem.addEventListener('mouseenter', show); exploreItem.addEventListener('mouseleave', hide);
    addEventListener('scroll', () => dd.classList.remove('is-open'), { passive: true });
  }

  // Mobile / tablet menu: the "Menu" button toggles the drawer (html.menu-open); a link click or Escape closes it.
  const menuBtn = document.querySelector('section.tablet .close');
  if (menuBtn) {
    const set = (on) => { root.classList.toggle('menu-open', on); };
    menuBtn.style.cursor = 'pointer';
    menuBtn.addEventListener('click', () => set(!root.classList.contains('menu-open')));
    document.querySelectorAll('.drawer a').forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    addEventListener('resize', () => { if (innerWidth > 1199) set(false); });
  }

  // Scroll-linked backgrounds (.bg-image): translateY runs from -420 px to 0 while the page scrolls through the
  // section, from (section top at 0.5 x viewport height) over the section's height. Measured: 2203 -> 2833 on a 630 px section.
  const bgs = [...document.querySelectorAll('.bg-image')];
  if (bgs.length) {
    const upd = () => bgs.forEach((el) => {
      const sec = el.closest('section') || el.parentElement, top = sec.getBoundingClientRect().top + scrollY;
      const start = top - 0.5 * innerHeight - 1, p = Math.min(1, Math.max(0, (scrollY - start) / sec.offsetHeight));
      el.style.transform = 'translateY(' + (-420 * (1 - p)) + 'px)';
    });
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }
})();
