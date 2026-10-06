/* Fabric Lab Interiors preview: EN | عربي switch, WhatsApp prefills per language, direction-aware fabric ticker, phone menu close. */
(function () {
  'use strict';
  var root = document.documentElement;
  var NUMBER = '971508338219';               // the lead's WhatsApp number: the only one on the page
  var T = window.FLT || { en: document.title, ar: document.title };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(l) { try { localStorage.setItem('fl-lang', l); } catch (e) {} }

  /* ---- fabric ticker: clones the list to fill twice the width and slides it; flips with the page direction ---- */
  function ticker() {
    document.querySelectorAll('.fl-ticker-list').forEach(function (ul) {
      if (ul._anim) { ul._anim.cancel(); ul._anim = null; }
      ul.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });
      ul.style.transform = '';
      if (reduce) return;
      var items = Array.prototype.slice.call(ul.children);
      var setW = items.reduce(function (w, li) { return w + li.getBoundingClientRect().width; }, 0);
      var view = ul.parentElement.clientWidth;
      if (!setW || !view) return;
      for (var w = setW; w < view + setW; w += setW) {
        items.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-clone', ''); ul.appendChild(c); });
      }
      var sign = root.dir === 'rtl' ? 1 : -1;      // LTR slides left, RTL slides right
      ul._anim = ul.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (sign * setW) + 'px)' }],
        { duration: (setW / 45) * 1000, iterations: Infinity });
    });
  }

  /* ---- language ---- */
  function apply(lang, persist) {
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = T[lang] || document.title;
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang)); });
    document.querySelectorAll('a[data-wa-en]').forEach(function (a) {
      var txt = a.getAttribute('data-wa-' + lang) || a.getAttribute('data-wa-en');
      a.href = 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(txt);
    });
    document.querySelectorAll('img[data-alt-en]').forEach(function (i) { i.alt = i.getAttribute('data-alt-' + lang) || i.getAttribute('data-alt-en'); });
    document.querySelectorAll('[data-label-en]').forEach(function (e) { e.setAttribute('aria-label', e.getAttribute('data-label-' + lang) || e.getAttribute('data-label-en')); });
    var burger = document.querySelector('.humberger-block');
    if (burger) burger.setAttribute('aria-label', lang === 'ar' ? 'القائمة' : 'Menu');
    if (persist) store(lang);
    (window.requestAnimationFrame || setTimeout)(function () { ticker(); window.dispatchEvent(new Event('resize')); });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set-lang]');
    if (!b) return;
    e.preventDefault();
    apply(b.getAttribute('data-set-lang'), true);
  });

  /* ---- phone menu: close after choosing a link ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    header.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.header-menu-block a, .header-button-block a');
      if (a && header.classList.contains('is-open')) {
        var burger = header.querySelector('.humberger-block');
        if (burger) burger.click();
      }
    });
  }

  /* ---- start ---- */
  apply(root.lang === 'ar' ? 'ar' : 'en', false);
  var tmr;
  window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(function () { if (!document.hidden) ticker(); }, 250); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ticker);
})();
