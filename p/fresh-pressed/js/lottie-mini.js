/* Minimal Lottie canvas player for the falling-candy animation (shape layers only: paths, ellipses, fills, strokes,
   animated layer position and rotation). Looping, 'contain' fit, centred. Written for data/falling-candy.json. */
(function () {
  "use strict";
  var host = document.querySelector("[data-lottie]");
  if (!host) return;
  var canvas = host.querySelector("canvas"), ctx = canvas.getContext("2d");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function bez(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var d = 3 * x1 * (1 - t) * (1 - t) - 6 * x1 * t * (1 - t) + 6 * x2 * t * (1 - t) - 3 * x2 * t * t + 3 * t * t;
        if (Math.abs(cx) < 1e-5 || Math.abs(d) < 1e-6) break;
        t -= cx / d;
      }
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  function val(p, f) {
    if (!p.a) return p.k;
    var k = p.k, i = 0;
    if (f <= k[0].t) return k[0].s;
    for (; i < k.length - 1; i++) if (f < k[i + 1].t) break;
    var a = k[i], b = k[i + 1];
    if (!b) return a.s;
    if (a.h) return a.s;
    var e = a.__e || (a.__e = bez(a.o.x[0], a.o.y[0], a.i.x[0], a.i.y[0]));
    var u = e((f - a.t) / (b.t - a.t)), out = [];
    for (var j = 0; j < a.s.length; j++) out.push(a.s[j] + (b.s[j] - a.s[j]) * u);
    return out;
  }
  function path(c, sh) {
    var v = sh.v, n = v.length; if (!n) return;
    c.moveTo(v[0][0], v[0][1]);
    for (var i = 1; i < n; i++) c.bezierCurveTo(v[i - 1][0] + sh.o[i - 1][0], v[i - 1][1] + sh.o[i - 1][1], v[i][0] + sh.i[i][0], v[i][1] + sh.i[i][1], v[i][0], v[i][1]);
    if (sh.c) { c.bezierCurveTo(v[n - 1][0] + sh.o[n - 1][0], v[n - 1][1] + sh.o[n - 1][1], v[0][0] + sh.i[0][0], v[0][1] + sh.i[0][1], v[0][0], v[0][1]); c.closePath(); }
  }
  var rgb = function (c, o) { return "rgba(" + Math.round(c[0] * 255) + "," + Math.round(c[1] * 255) + "," + Math.round(c[2] * 255) + "," + (c[3] === undefined ? 1 : c[3]) * o / 100 + ")"; };
  function group(c, items, f) {
    var tr = items.filter(function (x) { return x.ty === "tr"; })[0];
    c.save();
    if (tr) {
      var p = val(tr.p, f), a = val(tr.a, f), s = val(tr.s, f), r = val(tr.r, f);
      c.translate(p[0], p[1]); c.rotate(r * Math.PI / 180); c.scale(s[0] / 100, s[1] / 100); c.translate(-a[0], -a[1]);
    }
    c.beginPath();
    items.forEach(function (it) {
      if (it.ty === "sh") path(c, val(it.ks, f));
      else if (it.ty === "el") { var p2 = val(it.p, f), s2 = val(it.s, f); c.moveTo(p2[0] + s2[0] / 2, p2[1]); c.ellipse(p2[0], p2[1], s2[0] / 2, s2[1] / 2, 0, 0, Math.PI * 2); }
    });
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      if (it.ty === "fl") { c.fillStyle = rgb(val(it.c, f), val(it.o, f)); c.fill(); }
      else if (it.ty === "st") {
        c.strokeStyle = rgb(val(it.c, f), val(it.o, f)); c.lineWidth = val(it.w, f);
        c.lineCap = ["butt", "butt", "round", "square"][it.lc] || "butt"; c.lineJoin = ["miter", "miter", "round", "bevel"][it.lj] || "miter"; c.miterLimit = it.ml || 4; c.stroke();
      }
    }
    items.forEach(function (it) { if (it.ty === "gr") group(c, it.it, f); });
    c.restore();
  }
  fetch(host.getAttribute("data-lottie")).then(function (r) { return r.json(); }).then(function (d) {
    var fr = d.fr, total = d.op - d.ip, t0 = performance.now(), visible = true, raf = 0, done = false;
    function size() {
      var dpr = window.devicePixelRatio || 1, w = host.clientWidth, h = host.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    function draw(f) {
      var dpr = canvas.width / host.clientWidth, sc = Math.min(canvas.width / d.w, canvas.height / d.h);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(sc, 0, 0, sc, (canvas.width - d.w * sc) / 2, (canvas.height - d.h * sc) / 2);
      for (var i = d.layers.length - 1; i >= 0; i--) {
        var L = d.layers[i]; if (f < L.ip || f >= L.op) continue;
        var p = val(L.ks.p, f), r = val(L.ks.r, f), s = val(L.ks.s, f), a = val(L.ks.a, f), o = val(L.ks.o, f);
        ctx.save(); ctx.globalAlpha = o / 100;
        ctx.translate(p[0], p[1]); ctx.rotate(r * Math.PI / 180); ctx.scale(s[0] / 100, s[1] / 100); ctx.translate(-a[0], -a[1]);
        L.shapes.slice().reverse().forEach(function (g) { if (g.ty === "gr") group(ctx, g.it, f); });
        ctx.restore();
      }
    }
    function tick(now) { raf = 0; draw(d.ip + (((now - t0) / 1000) * fr) % total); if (visible) raf = requestAnimationFrame(tick); }
    size(); draw(0);
    if (reduced) return;
    new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; if (visible && !raf) { raf = requestAnimationFrame(tick); } }, { threshold: 0 }).observe(host);
    new ResizeObserver(function () { size(); }).observe(host);
  }).catch(function () {});
})();
