(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TWEEN = 'cubic-bezier(.42,0,.58,1)';      // the template's default tween curve
  var SMOOTH = 'cubic-bezier(.44,0,.56,1)';     // header, menu and hover curve (measured)

  /* A spring (duration d seconds, bounce b) as a CSS linear() easing. Settles inside 1.6 d. */
  function spring(d, b) {
    var w = 2 * Math.PI / d, z = 1 - b, wd = w * Math.sqrt(1 - z * z), T = d * 1.6, n = 28, pts = [];
    for (var i = 0; i <= n; i++) {
      var t = T * i / n;
      pts.push(+(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t))).toFixed(4));
    }
    pts[n] = 1;
    return { ms: T * 1000, ease: 'linear(' + pts.join(',') + ')' };
  }

  /* ---- Hero load entrance (measured on the template: both start almost at once, the picture settles in 1.4 s and the text in 0.7 s) ---- */
  function heroIntro() {
    if (reduce) return;
    var bg = $('.hero .background-image'), content = $('.hero .content');
    if (bg) bg.animate([{ opacity: .001, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }],
      { duration: 1400, delay: 30, easing: 'cubic-bezier(.25,0,.2,1)', fill: 'backwards' });
    if (content) content.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: 30, easing: TWEEN, fill: 'backwards' });
  }

  /* ---- Appear on view. Replays: hidden again when it leaves the view (same transition both ways). ----
     selector, visible fraction needed, x, y, kind (t = tween .6 s, s = spring .85 s bounce .28) */
  var APPEAR = [
    ['.watermark', .3, 0, 24, 't'], ['.signature-intro-content', .3, 0, 24, 't'], ['.text-panel', .1, 30, 0, 's'],
    ['.header', .3, 0, 24, 't'], ['.meta-row', .3, 0, 20, 't'], ['.category-cards', .25, 0, 24, 't'],
    ['.guest-reviews-header', .3, 0, 24, 't'], ['.reviews-layout', .2, 0, 24, 't'], ['.closing-booking-content', .1, 0, 28, 's']
  ];
  function appear() {
    if (reduce) return;
    var sp = spring(.85, .28);
    APPEAR.forEach(function (a) {
      var el = $(a[0]);
      if (!el || el.hasAttribute('data-appear')) return;
      var thr = a[1], hidden = 'translate(' + a[2] + 'px,' + a[3] + 'px)';
      var dur = a[4] === 's' ? sp.ms : 600, ease = a[4] === 's' ? sp.ease : TWEEN;
      el.style.opacity = '0'; el.style.transform = hidden;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        el.style.transition = 'opacity ' + dur + 'ms ' + ease + ', transform ' + dur + 'ms ' + ease;
      }); });
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1], on = e.intersectionRatio >= thr;
        el.style.opacity = on ? '1' : '0';
        el.style.transform = on ? 'none' : hidden;
      }, { threshold: thr }).observe(el);
    });
  }

  /* ---- Text effects, once: big watermark characters (blur 10 -> 0, scale 1.12 -> 1, spring 1.2 s bounce .3)
     and the closing headline word by word (blur 4, rise 18px, 0.3 s start, 0.05 s apart, spring .65 s bounce .32) ---- */
  function textFx() {
    if (reduce) return;
    function run(box, parts, from, startDelay, d, b, thr) {
      if (!box || !parts.length) return;
      var sp = spring(d, b);
      parts.forEach(function (p) { p.style.display = 'inline-block'; p.style.opacity = '.001'; p.style.filter = from.filter; p.style.transform = from.transform; });
      var io = new IntersectionObserver(function (es) {
        if (es[es.length - 1].intersectionRatio < thr) return;
        io.disconnect();
        parts.forEach(function (p, i) {
          p.style.opacity = ''; p.style.filter = ''; p.style.transform = '';
          p.animate([{ opacity: .001, filter: from.filter, transform: from.transform }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }],
            { duration: sp.ms, delay: (startDelay + .05 * i) * 1000, easing: sp.ease, fill: 'backwards' });
        });
      }, { threshold: thr });
      io.observe(box);
    }
    ['.yum-cha-teaser-watermark', '.guest-reviews-div'].forEach(function (s) {
      var box = $(s);
      if (box) run(box, $$('span span', box), { filter: 'blur(10px)', transform: 'scale(1.12)' }, 0, 1.2, .3, .2);
    });
    var h = $('.closing-booking-heading');
    if (h) run(h, $$('.closing-booking-heading-span', h), { filter: 'blur(4px)', transform: 'translateY(18px)' }, .3, .65, .32, .1);
  }

  /* ---- Parallax: the Peking Duck picture panel moves down at 0.1 x scroll (measured at 1440, 1024 and 390) ---- */
  function parallax() {
    var el = $('.media-panel');
    if (!el || reduce || el.hasAttribute('data-parallax')) return;
    var ticking = false;
    function set() { el.style.transform = 'translateY(' + (scrollY * .1) + 'px)'; ticking = false; }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  /* ---- Header: past 150px of scroll (desktop width only) it gets the frosted bar ---- */
  function header() {
    var nav = $('nav.desktop'), wide = matchMedia('(min-width:1200px)');
    if (!nav) return;
    function set() { nav.classList.toggle('is-scrolled', wide.matches && scrollY > 154); }
    addEventListener('scroll', set, { passive: true });
    addEventListener('resize', set);
    set();
  }

  /* ---- Tablet / phone menu: the bar grows from 70px to fit the links, 0.3 s; the icon turns into a cross ---- */
  function menu() {
    var nav = $('nav.desktop'), btn = $('.menu-icon');
    if (!nav || !btn) return;
    var open = false;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menu');
    function set(o) {
      if (o === open) return;
      var from = nav.getBoundingClientRect().height;
      open = o;
      nav.classList.toggle('is-open', o);
      btn.classList.toggle('is-open', o);
      btn.setAttribute('aria-expanded', String(o));
      var to = nav.getBoundingClientRect().height;
      if (!reduce) nav.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 300, easing: SMOOTH });
    }
    btn.addEventListener('click', function () { set(!open); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    matchMedia('(min-width:1200px)').addEventListener('change', function (e) { if (e.matches) set(false); });
  }

  /* ---- Tickers: the hero strip (50 px/s) and the page marquees (40 px/s) run left forever; clones fill the row.
     One set = the shortest repeating run of the items, so a list that already holds two sets loops by one. ---- */
  function ticker() {
    [['.bottom-strip-ul', 50], ['.marquee ul', 40]].forEach(function (t) {
      var ul = $(t[0]);
      if (!ul) return;
      var all = $$(':scope > li', ul), txt = all.map(function (li) { return li.textContent.trim(); }), k = all.length;
      for (var n = 1; n < all.length; n++) { if (all.length % n === 0 && txt.every(function (x, i) { return x === txt[i % n]; })) { k = n; break; } }
      var items = all.slice(0, k);
      var gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
      var w = items.reduce(function (a, li) { return a + li.getBoundingClientRect().width + gap; }, 0);
      if (!w || reduce) return;
      var have = all.length / k;
      for (var j = have; j < Math.ceil(innerWidth / w) + 1; j++) {
        items.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c); });
      }
      ul.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-w) + 'px)' }],
        { duration: w / t[1] * 1000, delay: 530, iterations: Infinity, easing: 'linear' });
    });
  }

  /* ---- Seal: floats 9px up and back (2.8 s each way), paused while off screen ---- */
  function seal() {
    if (reduce) return;
    /* menu hero scroll cue: the circle bobs 5 px down and back, about 1.75 s a round (sampled) */
    $$('.cue-circle').forEach(function (el) {
      el.animate([{ translate: '0 0' }, { translate: '0 5px' }],
        { duration: 875, easing: 'cubic-bezier(.45,0,.55,1)', iterations: Infinity, direction: 'alternate' });
    });
    $$('.seal, [data-seal]').forEach(function (el) {
      var an = el.animate([{ translate: '0 0' }, { translate: '0 -9px' }],
        { duration: 2800, easing: 'cubic-bezier(.45,0,.55,1)', iterations: Infinity, direction: 'alternate' });
      new IntersectionObserver(function (es) { if (es[es.length - 1].isIntersecting) an.play(); else an.pause(); }).observe(el);
    });
  }


  /* ---- Other pages: elements tagged in the markup ----
     data-appear=<delay s> + data-appear-y/-x/-scale/-amount (fraction of min(height, viewport) that must show) and
     data-appear-dur (tween, .42,0,.58,1) or data-appear-spring="<s>,<bounce>". Replays: hidden again when it leaves the view. */
  function appearTagged() {
    if (reduce) return;
    $$('[data-appear]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-appear')) || 0, y = +el.getAttribute('data-appear-y') || 0, x = +el.getAttribute('data-appear-x') || 0;
      var sc = el.hasAttribute('data-appear-scale') ? +el.getAttribute('data-appear-scale') : 1, thr = +el.getAttribute('data-appear-amount') || 0;
      var sp = el.getAttribute('data-appear-spring'), dur, ease;
      if (sp) { var q = sp.split(','), a = spring(+q[0], +q[1]); dur = a.ms; ease = a.ease; } else { dur = (+el.getAttribute('data-appear-dur') || .6) * 1000; ease = TWEEN; }
      var hidden = 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')';
      function tr(delay) { return 'opacity ' + dur + 'ms ' + ease + ' ' + delay + 'ms, transform ' + dur + 'ms ' + ease + ' ' + delay + 'ms'; }
      el.style.opacity = '0'; el.style.transform = hidden;
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.transition = tr(0); }); });
      var on = false;
      /* the other pages play once and stay (measured: the copy keeps them shown after they scroll out) */
      var io = new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        var vis = e.isIntersecting && e.intersectionRect.height >= thr * Math.min(e.boundingClientRect.height, innerHeight) - .5;
        if (vis === on || !vis) return;
        on = vis;
        io.disconnect();
        el.style.transition = tr(d * 1000);
        el.style.opacity = '1';
        el.style.transform = 'none';
      },{ threshold: Array.from({ length: 101 }, function (_, i) { return i / 100; }) });
      io.observe(el);
    });
  }

  /* data-tfx="unit|blur px|y px|scale|start s|amount|spring s|bounce|stagger s": text effect once, on view.
     unit line = per visual line (all letters of a line together), char = every letter, word = every word. */
  function tfxTagged() {
    if (reduce) return;
    $$('[data-tfx]').forEach(function (box) {
      var c = box.getAttribute('data-tfx').split('|'), unit = c[0], blur = c[1], y = c[2], sc = c[3], sd = +c[4], thr = +c[5], sp = spring(+c[6], +c[7]), st = +c[8];
      var parts = unit === 'word' ? $$(':scope > span', box) : $$('span span', box);
      if (!parts.length) return;
      var from = { filter: 'blur(' + blur + 'px)', transform: 'translateY(' + y + 'px) scale(' + sc + ')' };
      parts.forEach(function (p) { p.style.display = 'inline-block'; p.style.opacity = '.001'; p.style.filter = from.filter; p.style.transform = from.transform; });
      var io = new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        if (!e.isIntersecting || e.intersectionRect.height < thr * Math.min(e.boundingClientRect.height, innerHeight) - .5) return;
        io.disconnect();
        var tops = [];
        parts.forEach(function (p) { var t = Math.round(p.offsetTop / 8); if (tops.indexOf(t) < 0) tops.push(t); });
        tops.sort(function (a, b) { return a - b; });
        parts.forEach(function (p, i) {
          var k = unit === 'line' ? tops.indexOf(Math.round(p.offsetTop / 8)) : unit === 'word' ? i : 0;
          p.style.opacity = ''; p.style.filter = ''; p.style.transform = '';
          p.animate([{ opacity: .001, filter: from.filter, transform: from.transform }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }],
            { duration: sp.ms, delay: (sd + st * k) * 1000, easing: sp.ease, fill: 'backwards' });
        });
      }, { threshold: Array.from({ length: 101 }, function (_, i) { return i / 100; }) });
      io.observe(box);
    });
  }

  /* data-parallax=<speed>: speed 100 = none; the element moves down by (100 - speed)% of the page scroll (measured). */
  function parallaxTagged() {
    var els = $$('[data-parallax]');
    if (!els.length || reduce) return;
    var ticking = false;
    function set() { els.forEach(function (e) { e.style.transform = 'translateY(' + (scrollY * (100 - +e.getAttribute('data-parallax')) / 100) + 'px)'; }); ticking = false; }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  /* Pages with a tablet/phone copy of a block: the m- id belongs to that copy; scroll to whichever one is showing. */
  function anchorGo() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    var el = [document.getElementById(h), document.getElementById('m-' + h)].filter(function (e) { return e && e.offsetHeight; })[0];
    if (el) el.scrollIntoView();
  }
  addEventListener('hashchange', anchorGo);
  addEventListener('load', anchorGo);

  /* forms: submit sends nothing */
  $$('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });

  heroIntro(); appear(); textFx(); parallax(); header(); menu(); ticker(); seal();
  appearTagged(); tfxTagged(); parallaxTagged();
})();
