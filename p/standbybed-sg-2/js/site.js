(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Hero load entrance (decoded from the template, see BUILD.md) ---- */
  function heroIntro() {
    var inner = $('.hero-inner');
    if (!inner || reduce) return;
    var wide = innerWidth > 809;
    inner.animate([{ opacity: 0, transform: 'translateY(140px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: 40, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
    if (wide) {
      // frame grows from 56% to full size, bottom-anchored and centred
      inner.animate([
        { width: '56%', height: '56%', left: '22%', top: '44%' },
        { width: '100%', height: '100%', left: '0%', top: '0%' }],
        { duration: 1450, delay: 560, easing: EASE, fill: 'backwards' });
    }
    var img = $('.hero-inner .image');
    if (img) img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }],
      { duration: 12000, delay: 200, easing: 'cubic-bezier(.55,.085,.68,.53)', fill: 'both' });
    var chars = $$('.hero-heading span:not(:has(span))');
    var tops = [];
    chars.forEach(function (c) {
      var t = Math.round(c.getBoundingClientRect().top / 10);
      if (tops.indexOf(t) < 0) tops.push(t);
      var line = tops.indexOf(t);
      c.style.display = c.style.display || 'inline-block';
      c.animate([{ opacity: 0, transform: 'translateY(42px)' }, { opacity: 1, transform: 'none' }],
        { duration: 760, delay: 1300 + line * 130, easing: EASE, fill: 'backwards' });
    });
    var rating = $('.hero-inner .rating');
    if (rating) rating.animate([{ transform: 'translateY(-80px)' }, { transform: 'none' }],
      { duration: 1000, delay: 1500, easing: EASE, fill: 'backwards' });
    var btn = $('.hero-inner .card-mask-div');
    if (btn) btn.animate([{ transform: 'translateY(172px)' }, { transform: 'none' }],
      { duration: 1000, delay: 1450, easing: EASE, fill: 'backwards' });
  }

  /* ---- Appear on view, once ---- */
  function appear() {
    var els = $$('[data-appear]');
    els.forEach(function (el) {
      if (reduce) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(' + (el.getAttribute('data-appear-y') || 60) + 'px)';
    });
    function check() {
      var vh = innerHeight;
      els = els.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.height) return true;
        var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        var need = Math.min(r.height * (parseFloat(el.getAttribute('data-appear-amount')) || 0.15), vh * 0.5);
        if (vis < need) return true;
        var dur = el.classList.contains('card') ? 1300 : 1200;
        el.style.transition = 'opacity ' + dur + 'ms ' + EASE + ' ' + (parseFloat(el.getAttribute('data-appear')) || 0) + 's, transform ' + dur + 'ms ' + EASE + ' ' + (parseFloat(el.getAttribute('data-appear')) || 0) + 's';
        el.style.opacity = '1';
        el.style.transform = 'none';
        return false;
      });
      if (!els.length) removeEventListener('scroll', check);
    }
    if (reduce) return;
    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    check();
  }

  /* ---- Stats numbers: characters rise inside their mask ---- */
  function stats() {
    if (reduce) return;
    var sec = $('.stats');
    if (!sec) return;
    var chars = $$('.block-heading-6-span > span, .heading-span > span', sec);
    var all = $$('[class*="heading"] span span', sec);
    chars = all.length ? all : chars;
    chars.forEach(function (c) { c.style.display = 'inline-block'; c.style.opacity = '0'; c.style.transform = 'translateY(40px)'; });
    function go() {
      var r = sec.getBoundingClientRect();
      if (r.top > innerHeight * 0.75 || r.bottom < 0) return;
      chars.forEach(function (c, i) {
        c.style.transition = 'opacity .8s ' + EASE + ' ' + (i * 0.05) + 's, transform .8s ' + EASE + ' ' + (i * 0.05) + 's';
        c.style.opacity = '1'; c.style.transform = 'none';
      });
      removeEventListener('scroll', go);
    }
    addEventListener('scroll', go, { passive: true });
    go();
  }

  /* ---- Photo ticker: constant 40px/s to the left ---- */
  function ticker() {
    $$('.photo-ticker-ul').forEach(function (ul) {
      var items = $$(':scope > li', ul);
      if (!items.length || ul.offsetParent === null) return;
      var gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
      var w = items.reduce(function (a, li) { return a + li.getBoundingClientRect().width + gap; }, 0);
      items.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c); });
      ul.style.width = 'max-content'; ul.style.maxWidth = 'none';
      if (reduce) return;
      ul.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-w) + 'px)' }],
        { duration: w / 40.3 * 1000, iterations: Infinity, easing: 'linear' });
    });
  }

  /* ---- FAQ: each question opens on its own ---- */
  function faq() {
    $$('[class*="closed"]').forEach(function (card) {
      if (!card.querySelector('[class*="answer"]')) return;
      card.setAttribute('role', 'button');
      card.addEventListener('click', function () {
        var from = card.getBoundingClientRect().height;
        card.classList.toggle('is-open');
        var to = card.getBoundingClientRect().height;
        if (reduce) return;
        card.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 400, easing: EASE });
      });
    });
  }

  /* ---- Phone menu ---- */
  function menu() {
    var btn = $('.menu-button'), panel = $('.panel');
    if (!btn || !panel) return;
    var open = false, bars = btn.querySelector('svg g'), barsHtml = bars.innerHTML;
    var x = '<path d="M 12 0 L 0 12" stroke="#171614" stroke-width="2" stroke-linecap="round" transform="translate(6 6)" fill="transparent"/><path d="M 0 0 L 12 12" stroke="#171614" stroke-width="2" stroke-linecap="round" transform="translate(6 6)" fill="transparent"/>';
    function set(o) {
      open = o;
      bars.innerHTML = o ? x : barsHtml;
      var to = o ? innerHeight : 1, from = panel.getBoundingClientRect().height;
      panel.style.height = to + 'px';
      if (!reduce) panel.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 550, easing: 'cubic-bezier(.65,0,.35,1)' });
    }
    btn.addEventListener('click', function () { set(!open); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  }

  heroIntro(); appear(); stats(); ticker(); faq(); menu();
})();
