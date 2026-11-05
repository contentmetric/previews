/* phone menu: open and close */
(function () {
  "use strict";
  var btn = document.getElementById("menuBtn"), menu = document.getElementById("dkMenu");
  if (!btn || !menu) return;
  function set(open) { menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); }
  btn.addEventListener("click", function () { set(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 809) set(false); });
})();
