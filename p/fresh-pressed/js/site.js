/* Studio site JS. Numbers decoded from the template (see BUILD.md "Motion contract"). */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t0 = performance.now();

  // Top ticker: 70 px/s to the left, forever (3 identical sets, wraps by one set width).
  var ul = document.querySelector(".ticker ul");
  // Dotted page background drifts right 3.9 px/s (the 78 px pattern repeats every 20 s).
  var dots = document.getElementById("dots");
  // "Book now" badge in the header turns 36 deg/s, clockwise.
  var spin = document.querySelectorAll(".block-block-desktop-2-div");

  if (reduced) return;
  var setW = 0;
  function measure() {
    if (!ul) return;
    var items = ul.children, n = items.length / 3, w = 0, gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    for (var i = 0; i < n; i++) w += items[i].getBoundingClientRect().width + gap;
    setW = w;
  }
  measure();
  addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  function frame(now) {
    var s = (now - t0) / 1000;
    if (ul && setW) ul.style.transform = "translateX(" + (-((s * 70) % setW)).toFixed(2) + "px)";
    if (dots) dots.setAttribute("patternTransform", "translate(" + ((s * 3.9) % 78).toFixed(3) + " 0)");
    for (var i = 0; i < spin.length; i++) spin[i].style.transform = "rotate(" + ((s * 36) % 360).toFixed(2) + "deg)";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
