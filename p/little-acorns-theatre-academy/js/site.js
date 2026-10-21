/* Little Acorns demo: mobile menu + contact form that opens the visitor's own email app. No network calls. */
(function () {
  "use strict";
  var t = document.querySelector(".nav-toggle"), nav = document.querySelector(".la-nav");
  if (t && nav) {
    t.addEventListener("click", function () {
      var o = nav.classList.toggle("nav-open");
      t.setAttribute("aria-expanded", o ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("nav-open")) { nav.classList.remove("nav-open"); t.setAttribute("aria-expanded", "false"); t.focus(); }
    });
  }
  var form = document.querySelector("form.trial-form");
  if (form) {
    var note = form.querySelector("[data-note]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var req = form.querySelectorAll("[required]"), bad = null;
      req.forEach(function (f) { if (!bad && !f.value.trim()) bad = f; });
      if (bad) { bad.focus(); if (note) note.textContent = "Please fill in the required details first."; return; }
      var lines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (f) { if (f.name && f.value.trim()) lines.push(f.name + ": " + f.value.trim()); });
      var subject = "Trial class enquiry: " + form.querySelector("[name='Student name']").value.trim();
      var body = "Hello Little Acorns,\n\nI would like to enquire about a trial class.\n\n" + lines.join("\n") + "\n";
      window.location.href = "mailto:" + form.getAttribute("data-mailto") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (note) note.textContent = "Your email app should now be open with these details. Nothing is sent until you press send there.";
    });
  }
})();
