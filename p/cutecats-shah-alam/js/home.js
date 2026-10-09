/* Home page: hero, statement, moods slider, pinned story, roster wall, standards tilt, invitation paw prints. */
(function () {
  "use strict";
  var kit = window.fetchKit, W = window, D = document, clamp = kit.clamp, reduced = kit.reduced, fine = kit.fine;
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var isVisible = function (el) { var v = { on: false }; new IntersectionObserver(function (e) { v.on = e[0].isIntersecting; }, { threshold: 0 }).observe(el); return v; };

  /* ---------- hero ---------- */
  (function () {
    var sec = $(".fxp"); if (!sec) return;
    var big = $(".fxw-big", sec), mask = $(".fxw-h1mask", sec), ring = $(".fxw-ring", sec), toggle = $("[data-hero-toggle]", sec);
    var cuts = { dog: $(".fxw-cut-empty", sec), cat: $(".fxw-cut-cat", sec) }, toys = $$(".fxw-toy", sec), row = $(".fxw-tickrow", sec);
    var target = "dog", busy = false, interacted = false, timers = [];
    function phase(p) {
      sec.classList.toggle("is-out", p === "out");
      big.classList.remove("fxw-out", "fxw-inx"); mask.classList.remove("fxw-out2", "fxw-inx2");
      if (p === "out") { big.classList.add("fxw-out"); mask.classList.add("fxw-out2"); }
      if (p === "in") { big.classList.add("fxw-inx"); mask.classList.add("fxw-inx2"); }
    }
    function paint(m) { sec.setAttribute("data-hero", m); toggle.setAttribute("aria-checked", m === "cat" ? "true" : "false"); }
    function flip(byUser) {
      if (busy) return;
      var next = target === "dog" ? "cat" : "dog";
      if (byUser) { interacted = true; sec.classList.remove("fxp-pulse"); }
      target = next;
      if (reduced) { paint(next); kit.setMode(next); return; }
      busy = true;
      ring.classList.remove("fxw-go"); void ring.offsetWidth; ring.classList.add("fxw-go");
      phase("out");
      timers.push(W.setTimeout(function () { paint(next); phase("in"); W.setTimeout(function () { kit.setMode(next); }, 120); }, 250));
      timers.push(W.setTimeout(function () { phase("idle"); busy = false; }, 1100));
    }
    toggle.addEventListener("click", function () { flip(true); });
    kit.hero = { sync: function (m) { interacted = true; (function go() { if (target === m) return; if (busy) { W.setTimeout(go, 300); return; } flip(false); })(); } };
    if (kit.mode === "cat") { interacted = true; W.setTimeout(function () { kit.hero.sync("cat"); }, 280); }
    // the switch flips once by itself so a first-time visitor discovers it, then flips back
    var vis = isVisible(sec);
    if (!reduced) W.setTimeout(function () { if (!interacted && vis.on) { flip(false); W.setTimeout(function () { if (!interacted) flip(false); }, 3000); } }, 4200);
    if (reduced) return;
    var t = 0, mx = 0.5, my = 0.5, sx = 0.5, sy = 0.5, off = 0;
    if (fine) W.addEventListener("pointermove", function (e) { mx = e.clientX / W.innerWidth; my = e.clientY / W.innerHeight; }, { passive: true });
    kit.addTick(function (now, dt) {
      if (!vis.on) return;
      t += dt; sx += (mx - sx) * clamp(dt * 3, 0, 1); sy += (my - sy) * clamp(dt * 3, 0, 1);
      big.style.transform = "translate(calc(-50% + " + ((sx - 0.5) * -18 + Math.sin(t * 0.16) * 8).toFixed(1) + "px), calc(-50% + " + ((sy - 0.5) * -8).toFixed(1) + "px))";
      var s = 1 + Math.sin(t * 0.9) * 0.008, a = (sx - 0.5) * 16, m = (sy - 0.5) * 8;
      cuts[target].style.transform = "translate3d(" + a.toFixed(1) + "px," + m.toFixed(1) + "px,0) scale(" + s.toFixed(4) + ")";
      toys.forEach(function (el, i) {
        el.style.transform = "translate3d(" + (Math.sin(t * 0.5 + i * 2.4) * 12 + (sx - 0.5) * 24).toFixed(1) + "px," + (Math.cos(t * 0.42 + i * 1.8) * 9 + (sy - 0.5) * 12).toFixed(1) + "px,0) rotate(" + (Math.sin(t * 0.35 + i) * 8).toFixed(1) + "deg)";
      });
      off -= dt * 42; var half = row.scrollWidth / 2; if (half > 0 && off <= -half) off += half;
      row.style.transform = "translate3d(" + off.toFixed(1) + "px,0,0)";
    });
  })();

  /* ---------- statement: words light up with scroll, floating toys, spinning badge ---------- */
  (function () {
    var sec = $(".fst"); if (!sec) return;
    var ghost = $(".fst-ghost", sec), spin = $(".fst-badge-spin", sec), floats = $$(".fst-float", sec), trail = $(".fst-trail", sec);
    var steps = $$(".fst-step", sec), state = { words: -1, steps: -1 };
    var activeH = function () { return $(".fst-h.m-" + kit.mode, sec); };
    var reset = function () { state.words = -1; state.steps = -1; $$(".fst-h", sec).forEach(function (h) { h.classList.remove("fst-loopon"); }); };
    kit.subs.push(reset);
    if (reduced) { $$(".fst-w,.fst-paw", sec).forEach(function (e) { e.classList.add("fst-onw"); }); steps.forEach(function (e) { e.classList.add("fst-on"); }); $$(".fst-h", sec).forEach(function (h) { h.classList.add("fst-loopon"); }); return; }
    var vis = isVisible(sec), time = Math.random() * 10, ang = 0, lastY = W.scrollY, vel = 0, mx = 0.5, my = 0.5, sx = 0.5, sy = 0.5;
    if (fine) W.addEventListener("pointermove", function (e) { mx = e.clientX / W.innerWidth; my = e.clientY / W.innerHeight; }, { passive: true });
    kit.addTick(function (now, dt) {
      if (!vis.on) return;
      time += dt; var y = W.scrollY;
      vel += (Math.min(Math.abs(y - lastY) * 1.6, 220) - vel) * clamp(dt * 4, 0, 1); lastY = y;
      sx += (mx - sx) * clamp(dt * 3, 0, 1); sy += (my - sy) * clamp(dt * 3, 0, 1);
      var r = sec.getBoundingClientRect(), vh = W.innerHeight, h = activeH();
      if (h) {
        var hr = h.getBoundingClientRect(), p = clamp((vh * 0.88 - hr.top) / (vh * 0.55), 0, 1), words = $$(".fst-w", h), n = words.length, lit = Math.floor(p * (n + 1));
        if (lit !== state.words) {
          words.forEach(function (w, i) { w.classList.toggle("fst-onw", i < lit); });
          $(".fst-paw", h).classList.toggle("fst-onw", lit > n - 1);
          state.words = lit; if (lit > 6) h.classList.add("fst-loopon");
        }
        var q = clamp((vh - r.top) / (r.height + vh * 0.2), 0, 1), k = Math.floor(q * (steps.length + 2));
        if (k !== state.steps) { steps.forEach(function (s, i) { s.classList.toggle("fst-on", i < k); }); state.steps = k; }
        var g = clamp((vh - r.top) / (vh + r.height), 0, 1);
        ghost.style.transform = "translate3d(" + ((g - 0.5) * -70).toFixed(1) + "px," + ((g - 0.5) * 120).toFixed(1) + "px,0) rotate(-3deg)";
      }
      ang += dt * (16 + vel * 0.5); spin.style.transform = "rotate(" + (ang % 360).toFixed(2) + "deg)";
      floats.forEach(function (el) {
        var depth = +el.dataset.depth, amp = +el.dataset.amp, sp = +el.dataset.speed, ph = +el.dataset.phase;
        var px = fine ? (sx - 0.5) * 34 * depth : 0, py = fine ? (sy - 0.5) * 22 * depth : 0;
        el.style.transform = "translate3d(" + (Math.sin(time * sp + ph) * amp + px).toFixed(1) + "px," + (Math.cos(time * sp * 0.8 + ph) * amp * 0.7 + py).toFixed(1) + "px,0) rotate(" + (Math.sin(time * 0.4 + ph) * 9).toFixed(1) + "deg)";
      });
    });
  })();

  /* ---------- bilingual: the divider drifts by itself, follows the pointer when it is over the section ---------- */
  (function () {
    var sec = $(".fmm"); if (!sec) return;
    var catw = $(".fmm-catw", sec), div = $(".fmm-div", sec), handle = $(".fmm-handle", sec);
    if (reduced) { catw.style.clipPath = "inset(0 0 0 50%)"; div.style.transform = "translateX(50vw)"; handle.style.transform = "translate(calc(50vw - 27px), -50%)"; return; }
    var pos = 50, goal = 50, over = false, ptr = 0, vis = isVisible(sec), time = 0;
    W.addEventListener("pointermove", function (e) {
      var r = sec.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right) { over = true; ptr = (e.clientX - r.left) / r.width * 100; } else over = false;
    }, { passive: true });
    kit.addTick(function (now, dt) {
      if (!vis.on) return;
      time += dt; var rest = (kit.mode === "dog" ? 61 : 39) + Math.sin(time * 0.7) * 3;
      goal = over ? clamp(ptr, 16, 84) : rest; pos += (goal - pos) * clamp(dt * 5, 0, 1);
      var px = pos / 100 * sec.getBoundingClientRect().width;
      catw.style.clipPath = "inset(0 0 0 " + pos.toFixed(2) + "%)";
      div.style.transform = "translateX(" + px.toFixed(1) + "px)";
      handle.style.transform = "translate(" + (px - 27).toFixed(1) + "px, -50%)";
    });
  })();

  /* ---------- story: three panels stack up while the section stays pinned ---------- */
  (function () {
    var sec = $(".fsy"); if (!sec) return;
    var pin = $(".fsy-pin", sec), panels = $$(".fsy-panel", sec), dims = $$(".fsy-dim", sec);
    if (W.matchMedia("(max-width: 809px)").matches || reduced) { $(".fsy-tall", sec).classList.remove("fsy-tall"); return; }
    var vis = isVisible(sec), last = "";
    var ease = function (e) { return e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2; };
    var span = function (e, a, b) { return clamp((e - a) / (b - a), 0, 1); };
    kit.addTick(function () {
      if (!vis.on) return;
      var r = sec.getBoundingClientRect(), vh = W.innerHeight, run = r.height - vh, s = "mid";
      if (r.top > 0) s = "pre"; else if (r.bottom < vh) s = "post";
      if (s !== last) {
        last = s;
        if (s === "pre") { pin.style.position = "absolute"; pin.style.top = "0"; pin.style.bottom = "auto"; }
        else if (s === "post") { pin.style.position = "absolute"; pin.style.top = "auto"; pin.style.bottom = "0"; }
        else { pin.style.position = "fixed"; pin.style.top = "0"; pin.style.bottom = "auto"; }
      }
      var p = clamp(-r.top / run, 0, 1), m = ease(span(p, 0.04, 0.5)), h = ease(span(p, 0.54, 1));
      panels[0].style.transform = "scale(" + (1 - m * 0.05).toFixed(4) + ")";
      panels[1].style.transform = "translate3d(0," + ((1 - m) * 100).toFixed(2) + "%,0) scale(" + (1 - h * 0.05).toFixed(4) + ")";
      panels[2].style.transform = "translate3d(0," + ((1 - h) * 100).toFixed(2) + "%,0)";
      dims[0].style.opacity = (m * 0.3).toFixed(3); dims[1].style.opacity = (h * 0.3).toFixed(3);
    });
  })();

  /* ---------- patient wall: two rows drift in opposite directions, faster while scrolling ---------- */
  (function () {
    var sec = $(".fpt"); if (!sec) return;
    var walls = $$(".fpt-wall", sec);
    kit.subs.push(function () { var w = $(".fpt-wall.m-" + kit.mode, sec); if (!w) return; w.style.opacity = "0"; W.setTimeout(function () { w.style.opacity = "1"; }, 60); });
    if (reduced) return;
    var vis = isVisible(sec), a = 0, b = 0, lastY = W.scrollY, vel = 0;
    kit.addTick(function (now, dt) {
      if (!vis.on) return;
      var y = W.scrollY; vel += (Math.min(Math.abs(y - lastY) * 2.2, 260) - vel) * clamp(dt * 4, 0, 1); lastY = y;
      var speed = 32 + vel, wall = $(".fpt-wall.m-" + kit.mode, sec), rows = $$(".fpt-row", wall);
      var ha = rows[0].scrollWidth / 2, hb = rows[1].scrollWidth / 2;
      a -= speed * dt; b += speed * 0.86 * dt;
      if (a <= -ha) a += ha; if (b >= 0) b -= hb;
      rows[0].style.transform = "translate3d(" + a.toFixed(1) + "px,0,0)"; rows[1].style.transform = "translate3d(" + b.toFixed(1) + "px,0,0)";
    });
  })();

  /* ---------- team: path draws as you scroll, cards bob and tilt towards the pointer ---------- */
  (function () {
    var sec = $(".ftm"); if (!sec) return;
    var path = $(".ftm-route path", sec), paw = $(".ftm-routepaw", sec), cards = $$(".ftm-3d", sec), wraps = $$(".ftm-3dw", sec);
    if (reduced) { path.style.strokeDashoffset = "0"; paw.classList.add("ftm-on"); return; }
    var vis = isVisible(sec), hover = -1, px = 0, py = 0, t = 0, tilt = cards.map(function () { return { rx: 0, ry: 0, b: Math.random() * 6 }; });
    wraps.forEach(function (w, i) { w.addEventListener("pointerenter", function () { hover = i; }); w.addEventListener("pointerleave", function () { if (hover === i) hover = -1; }); });
    W.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    kit.addTick(function (now, dt) {
      if (!vis.on) return;
      t += dt; var r = sec.getBoundingClientRect(), u = clamp((W.innerHeight * 0.92 - r.top) / (r.height * 0.85), 0, 1);
      path.style.strokeDashoffset = String(1 - u); paw.classList.toggle("ftm-on", u > 0.93);
      cards.forEach(function (el, i) {
        var k = tilt[i], rx = 0, ry = 0;
        if (hover === i) { var b = el.getBoundingClientRect(); ry = clamp(((px - b.left) / b.width - 0.5) * 14, -8, 8); rx = clamp(-((py - b.top) / b.height - 0.5) * 12, -7, 7); }
        k.rx += (rx - k.rx) * clamp(dt * 7, 0, 1); k.ry += (ry - k.ry) * clamp(dt * 7, 0, 1);
        el.style.transform = "translate3d(0," + (Math.sin(t * 0.7 + k.b) * 4).toFixed(1) + "px,0) rotateX(" + k.rx.toFixed(2) + "deg) rotateY(" + k.ry.toFixed(2) + "deg)";
      });
    });
  })();

  /* ---------- invitation: click anywhere to leave a paw print ---------- */
  (function () {
    var sec = $(".fiv"); if (!sec || reduced) return;
    var stamps = $$(".fiv-stamp", sec), n = 0, sign = 1;
    sec.addEventListener("click", function (e) {
      if (e.target.closest("a,button")) return;
      var r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (y < 0 || y > r.height) return;
      var s = stamps[n++ % stamps.length]; sign = -sign;
      s.style.left = x - 17 + "px"; s.style.top = y - 17 + "px"; s.style.transform = "rotate(" + sign * (8 + Math.random() * 20) + "deg)";
      s.classList.remove("fiv-go"); void s.offsetWidth; s.classList.add("fiv-go");
    });
  })();
})();
