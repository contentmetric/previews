// Site JS: phone menu toggle and the three image tickers (35 px/s, measured on the original).
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hdr = document.querySelector(".site-header");
  var burger = document.querySelector(".logo-hamburger-logo-hamburger-div");
  var nav = document.querySelector(".site-header .navigation");
  if (hdr && burger && nav) {
    var open = false;
    var set = function (v) {
      open = v;
      hdr.style.height = v ? "100vh" : "";
      nav.style.right = v ? "0px" : "";
      burger.classList.toggle("is-open", v);
    };
    burger.addEventListener("click", function () { set(!open); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
  }
  // phone slideshows: the template hard-codes a 390px layout; land on the first slide at any width
  var fit = function () {
    document.querySelectorAll("ul").forEach(function (u) {
      if (u.children.length === 24 && getComputedStyle(u).display === "flex") u.style.transform = "translateX(" + (-6 * (u.parentElement.clientWidth + 20)) + "px)";
    });
  };
  fit(); addEventListener("resize", fit); addEventListener("load", fit);
  var f = document.querySelector("form");
  if (f) f.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { var i = f.elements[n]; return i && i.value ? i.value.trim() : ""; };
    var t = "Hi BlindXpert, I'd like some advice on blinds and curtains for my home.";
    if (g("name")) t += " My name is " + g("name") + ".";
    if (g("note")) t += " " + g("note");
    if (g("phone")) t += " My number: " + g("phone");
    window.open("https://wa.me/" + f.getAttribute("data-wa") + "?text=" + encodeURIComponent(t), "_blank", "noopener");
  });
  if (reduce) return;
  var lists = [["about-desktop-div-ul", 0], ["testimonials-desktop-div-ul", 0], ["testimonials-testimonials-desktop-ul", 1]];
  lists.forEach(function (d) {
    var ul = document.querySelector("ul." + d[0]);
    if (!ul) return;
    var host = ul.parentElement, off = 0, last = 0, on = false;
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; last = 0; }).observe(host);
    var tick = function (t) {
      var li = ul.children;
      if (on && li.length > 6) {
        var set = li[6].offsetLeft - li[0].offsetLeft;
        if (last && set > 0) {
          off = (off + 0.035 * (t - last)) % set;
          ul.style.transform = "translateX(" + (d[1] ? off : -off) + "px)";
        }
        last = t;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();
