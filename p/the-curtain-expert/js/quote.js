/* The Curtain Expert quote builder. Nothing is posted anywhere: the green button is a plain link to
   wa.me/6588288138 whose text is rewritten whenever a field changes. The lines follow the shop's own WhatsApp
   quote template (Name, Contact Number, Address, Curtains/Blinds, Key Collection Date, How did you hear about us). */
(function () {
  "use strict";
  var NUMBER = "6588288138";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("quoteForm");
  if (!form) return;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function sgToday() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  $("fTDate").min = sgToday();

  function vals(name) {
    return [].map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function one(name) { var v = vals(name); return v.length ? v[0] : ""; }
  function fmtDate(v, year) {
    if (!v) return "";
    var d = new Date(v + "T00:00:00Z");
    return DAYS[d.getUTCDay()] + ", " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + (year ? " " + d.getUTCFullYear() : "");
  }
  function fmtTime(v) {
    if (!v) return "";
    var p = v.split(":"), h = +p[0], ap = h >= 12 ? "pm" : "am";
    return ((h + 11) % 12 + 1) + ":" + p[1] + " " + ap;
  }

  function data() {
    var kinds = vals("kind"), parts = [];
    if (kinds.indexOf("Curtains") > -1) { var c = vals("ctype"); parts.push("Curtains" + (c.length ? " (" + c.join(", ") + ")" : "")); }
    if (kinds.indexOf("Blinds") > -1) { var b = vals("btype"); parts.push("Blinds" + (b.length ? " (" + b.join(", ") + ")" : "")); }
    var key = $("fKey").value ? fmtDate($("fKey").value, true) : one("keyq");
    var tour = "";
    if ($("fTour").checked && $("fTDate").value) {
      tour = fmtDate($("fTDate").value, false) + ($("fTTime").value ? ", " + fmtTime($("fTTime").value) : "") + " (please confirm)";
    }
    return {
      name: $("fName").value.trim(), phone: $("fPhone").value.trim(), addr: $("fAddr").value.trim(),
      kind: parts.join(", "), key: key, hear: one("hear"), tour: tour, tourOn: $("fTour").checked, tourDate: $("fTDate").value
    };
  }
  function message(d) {
    var L = ["Hi The Curtain Expert, I'd like a quote.", ""];
    L.push("Name: " + d.name);
    L.push("Contact Number: " + d.phone);
    if (d.addr) L.push("Address: " + d.addr);
    if (d.kind) L.push("Curtains/Blinds: " + d.kind);
    if (d.key) L.push("Key Collection Date: " + d.key);
    if (d.hear) L.push("How did you hear about us: " + d.hear);
    if (d.tour) L.push("Showroom tour: " + d.tour);
    return L.join("\n");
  }
  function problem(d) {
    if (!d.name) return "Please add your name.";
    if (d.phone.replace(/\D/g, "").length < 8) return "Please add a contact number we can reach you on.";
    if (!d.kind) return "Please tap Curtains, Blinds or both.";
    if (d.tourOn && !d.tourDate) return "Please pick a date for the showroom tour, or switch it off.";
    return "";
  }

  var go = $("waBtn"), box = $("msg"), err = $("err");
  function update() {
    var kinds = vals("kind");
    $("subCurtain").hidden = kinds.indexOf("Curtains") < 0;
    $("subBlind").hidden = kinds.indexOf("Blinds") < 0;
    $("tourF").hidden = !$("fTour").checked;
    var d = data(), m = message(d);
    box.textContent = m;
    go.href = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(m);
    if (!err.hidden && !problem(d)) err.hidden = true;
  }

  // a date and the "already collected / not sure" chips replace each other
  $("fKey").addEventListener("input", function () {
    if (this.value) [].forEach.call(form.querySelectorAll('input[name="keyq"]'), function (i) { i.checked = false; });
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "keyq" && e.target.checked) $("fKey").value = "";
  });
  // tapping a checked radio chip clears it, so a choice can be undone
  form.addEventListener("click", function (e) {
    var t = e.target;
    if (t.type === "radio") {
      if (t.dataset.was === "1") { t.checked = false; t.dataset.was = ""; update(); return; }
      [].forEach.call(form.querySelectorAll('input[name="' + t.name + '"]'), function (i) { i.dataset.was = ""; });
      t.dataset.was = "1";
    }
  });
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  go.addEventListener("click", function (e) {
    var p = problem(data());
    if (p) { e.preventDefault(); err.textContent = p; err.hidden = false; }
  });
  $("copyBtn").addEventListener("click", function () {
    var d = data(), p = problem(d);
    if (p) { err.textContent = p; err.hidden = false; return; }
    var btn = this, m = message(d);
    var done = function () { btn.textContent = "Copied. Paste it into WhatsApp."; };
    var fallback = function () { var r = document.createRange(); r.selectNodeContents(box); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Select the text above and copy it"; };
    try { navigator.clipboard.writeText(m).then(done, fallback); } catch (_) { fallback(); }
  });

  // product tiles start the quote with that type
  [].forEach.call(document.querySelectorAll(".pick"), function (b) {
    b.addEventListener("click", function () {
      var k = form.querySelector('input[name="kind"][value="' + b.dataset.kind + '"]');
      k.checked = true;
      var n = b.dataset.kind === "Curtains" ? "ctype" : "btype";
      [].forEach.call(form.querySelectorAll('input[name="' + n + '"]'), function (i) { i.checked = i.value === b.dataset.type; });
      update();
      var t = $("quote");
      if (t.scrollIntoView) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  var bar = $("bar");
  function s() { bar.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", s, { passive: true });
  s();
  update();
})();
