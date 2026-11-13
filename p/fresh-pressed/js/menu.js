/* Phone menu. The header panel (.desktop) is 96px closed and 417px open; the copy animates it
   with a spring (open: critically damped, fitted w=9.1/s; close: damping ratio 0.76, w=8.6/s, 1.5% overshoot).
   Panel fill, shadow and the button tilt follow the open fraction. Menu stays open after a link tap. */
(function () {
  var panel = document.querySelector(".div .desktop"), btn = document.querySelector(".mobile-open-button .block-desktop");
  if (!panel || !btn) return;
  var label = btn.querySelector(".text"), mq = matchMedia("(max-width: 809.98px)");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var H0 = 96, H1 = 417, x = 0, v = 0, target = 0, last = 0, raf = 0;
  function paint() {
    if (!mq.matches) { panel.style.removeProperty("height"); panel.style.removeProperty("--mp"); return; }
    panel.style.height = (H0 + (H1 - H0) * x).toFixed(2) + "px";
    panel.style.setProperty("--mp", Math.max(0, Math.min(1, x)).toFixed(3));
  }
  function step(now) {
    var dt = Math.min((now - last) / 1000, 0.032); last = now;
    var w = target ? 9.1 : 8.6, z = target ? 1 : 0.76, n = Math.max(1, Math.round(dt / 0.004)), h = dt / n;
    for (var i = 0; i < n; i++) { v += (-w * w * (x - target) - 2 * z * w * v) * h; x += v * h; }
    if (Math.abs(x - target) < 0.0005 && Math.abs(v) < 0.005) { x = target; v = 0; paint(); raf = 0; return; }
    paint(); raf = requestAnimationFrame(step);
  }
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    var open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", open);
    if (label) label.textContent = open ? "Close x" : "Menu";
    target = open ? 1 : 0;
    if (reduced) { x = target; v = 0; paint(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  });
  mq.addEventListener("change", paint);
})();
