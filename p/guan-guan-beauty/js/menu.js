/* Full-screen menu for tablet and phone. The overlay lives directly on <body> (a backdrop-filter on the header would trap a
   fixed child), shows while <html> has the template's "menu-open" class, and is built from the template's own drawer links. */
(function () {
  "use strict";
  var root = document.documentElement;
  var drawer = document.querySelector(".drawer");
  if (!drawer) return;
  var m = document.createElement("div");
  m.className = "cp-menu";
  m.id = "cp-menu";
  m.setAttribute("role", "dialog");
  var ZH = root.lang.indexOf("zh") === 0;
  m.setAttribute("aria-label", ZH ? "菜单" : "Menu");
  var links = Array.prototype.map.call(drawer.querySelectorAll(".drawer-item a"), function (a) {
    return '<a href="' + a.getAttribute("href") + '">' + a.textContent.trim() + "</a>";
  }).join("");
  var cta = drawer.querySelector(".drawer-cta");
  var logo = document.querySelector('#main a[href="#top"] img');
  m.innerHTML =
    '<div class="cp-menu-top"><span class="cp-menu-lockup">' + (logo ? '<img class="cp-menu-logo" src="' + logo.src + '" alt="" width="46" height="35">' : "") + '<span class="cp-menu-brand">GG Beauty<small>Guan Guan Beauty</small></span></span>' +
    '<button type="button" class="cp-menu-x" aria-label="' + (ZH ? "关闭菜单" : "Close menu") + '"><span></span><span></span></button></div>' +
    '<nav class="cp-menu-links">' + links + "</nav>" +
    '<a class="cp-menu-cta" href="' + (cta ? cta.getAttribute("href") : "#") + '" target="_blank" rel="noopener">' + (cta ? cta.textContent.trim() : "WhatsApp") + "</a>";
  document.body.appendChild(m);
  var close = function () { root.classList.remove("menu-open"); };
  m.querySelector(".cp-menu-x").addEventListener("click", close);
  m.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
})();
