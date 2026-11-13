(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- appear on view: in view once half of the element (or of the viewport, if taller) is visible ---- */
  const setVars = (el) => {
    const y = el.getAttribute('data-appear-y'), x = el.getAttribute('data-appear-x');
    const e = el.getAttribute('data-appear-ease'), d = el.getAttribute('data-appear-dur');
    if (y !== null) el.style.setProperty('--ay', y + 'px');
    if (x !== null) el.style.setProperty('--ax', x + 'px');
    if (e) el.style.setProperty('--ae', 'cubic-bezier(' + e + ')');
    if (d) el.style.setProperty('--ad', d + 's');
    el.style.transitionDelay = (el.getAttribute('data-appear') || '0') + 's';
  };
  if (!reduced && 'IntersectionObserver' in window) {
    const thresholds = Array.from({ length: 100 }, (_, i) => i / 100);
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const r = en.boundingClientRect;
        if (r.height && en.intersectionRect.height / Math.min(r.height, innerHeight) < 0.5) continue;
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    }, { threshold: thresholds });
    $$('[data-appear]').forEach((el) => { setVars(el); io.observe(el); });
  } else {
    $$('[data-appear]').forEach((el) => el.classList.add('in'));
  }

  /* ---- header: hide on scroll down, show on scroll up (4px dead zone, anchor resets on direction change) ---- */
  const hdr = document.querySelector('.site-header');
  if (hdr) {
    let last = scrollY, anchor = scrollY, dir = 1;
    addEventListener('scroll', () => {
      hdr.classList.toggle('scrolled', scrollY > 230);
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (y < 0 || y > max) return;
      const d = y < last ? -1 : 1;
      last = y;
      if (d !== dir) { dir = d; anchor = y; return; }
      if (Math.abs(y - anchor) < 4) return;
      if (hdr.classList.contains('menu-open')) return;
      hdr.classList.toggle('is-hidden', d > 0);
    }, { passive: true });

    /* mobile / tablet menu */
    $$('.burger, .block-burger').forEach((b) => {
      b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Menu'); b.tabIndex = 0;
      const tog = () => { const o = hdr.classList.toggle('menu-open'); b.setAttribute('aria-expanded', o); };
      b.addEventListener('click', tog);
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
    });
    $$('.header-main-menu a').forEach((a) => a.addEventListener('click', () => hdr.classList.remove('menu-open')));
  }

  /* ---- hover springs: tag the elements by what they are ---- */
  const tag = () => {
    $$('a, button').forEach((el) => {
      const c = getComputedStyle(el);
      if (c.backgroundColor === 'rgb(3, 115, 206)') el.classList.add('hv-btn');
      if (el.tagName === 'A' && c.boxShadow.indexOf('rgba(39, 56, 81, 0.1)') > -1) el.classList.add('hv-card');
      if (el.tagName === 'A' && el.querySelector('img') && el.querySelector('[class*="overlay"]')) el.classList.add('hv-blog');
      if (el.matches('a.tablet-small, a.destop-primary')) el.classList.add('hv-social');
      if (el.matches('a.primary-small, a.contact-section-primary')) el.classList.add('hv-contact');
    });
  };
  tag();


  /* ---- testimonial ticker: 60px/s to the left, pauses on hover, runs only in view ---- */
  $$('ul[class$="-ul"]').forEach((ul) => {
    const lis = ul.children;
    if (lis.length < 3 || !ul.closest('section')) return;
    if (!/testimonial/.test(ul.className)) return;
    let x = 0, last = 0, hover = false, visible = false, raf = 0;
    const dist = () => { const n = lis.length / 3; return lis[n].offsetLeft - lis[0].offsetLeft; };
    const step = (t) => {
      if (!last) last = t;
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (!hover) { const d = dist(); x = (x + 60 * dt) % d; ul.style.transform = 'translateX(' + (-x).toFixed(2) + 'px)'; }
      raf = visible ? requestAnimationFrame(step) : 0;
    };
    const sec = ul.closest('section');
    sec.addEventListener('mouseenter', () => { hover = true; });
    sec.addEventListener('mouseleave', () => { hover = false; });
    if (reduced) return;
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(step); }
    }).observe(sec);
  });

  /* ---- FAQ accordion: one open at a time, first open by default ---- */
  const items = $$('.faq-item');
  if (items.length) {
    const open = (n) => items.forEach((it) => it.classList.toggle('is-open', it.dataset.faq === n));
    items.forEach((it) => {
      $$('.accordion-open, .accordion-close, .accordion-open-mobile, .accordion-close-mobile, [class*="accordion-open-secondary"], [class*="accordion-close-secondary"]', it).forEach((v) => {
        v.addEventListener('click', () => open(it.classList.contains('is-open') ? '-1' : it.dataset.faq));
      });
    });
  }
  /* ---- About accordion: items open and close independently ---- */
  const OPEN_ICO = 'img/content-section-icon-div-strzb.svg', CLOSE_ICO = 'img/content-section-icon-div-nvscf.svg';
  $$('.acc-v').forEach((v) => v.addEventListener('click', () => {
    const on = !v.classList.contains('is-open');
    $$('.acc-v[data-acc="' + v.dataset.acc + '"]').forEach((w) => {
      w.classList.toggle('is-open', on);
      const im = w.querySelector('img[data-ico]'); if (im) im.setAttribute('src', on ? OPEN_ICO : CLOSE_ICO);
    });
  }));

})();
