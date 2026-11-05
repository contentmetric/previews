/* J & Q Bakery Xperts: order form -> one tidy WhatsApp message. Nothing is posted anywhere: the green button is a plain wa.me link
   whose text is rewritten on every tap. Put the bakery's own number in NUMBER (digits only, e.g. "6591234567").
   Left empty in this example, so WhatsApp lets the visitor choose a chat. */
(function () {
  "use strict";
  var NUMBER = "6590620540";
  var BAKERY = "J & Q Bakery Xperts";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("order");
  if (!form) return;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  $("fDate").min = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  function vals(name) {
    return [].map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function one(name) { var v = vals(name); return v.length ? v[0] : ""; }
  function fmtDate(v) {
    var d = new Date(v + "T00:00:00Z");
    return DAYS[d.getUTCDay()] + ", " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }
  function data() {
    var theme = [one("theme"), $("fTheme").value.trim()].filter(Boolean).join(", ");
    var how = one("how");
    var addr = $("fAddr").value.trim();
    return {
      name: $("fName").value.trim(),
      date: $("fDate").value ? fmtDate($("fDate").value) : "",
      items: vals("item").join(", "),
      serve: one("serve"),
      theme: theme,
      flavour: $("fFlavour").value.trim(),
      how: how === "Delivery" ? "Delivery" + (addr ? ", " + addr : "") : how,
      allergy: vals("allergy").join(", "),
      needAddr: how === "Delivery" && !addr
    };
  }
  function message(d) {
    var L = ["Hi " + BAKERY + ", I'd like to place an order.", ""];
    if (d.name) L.push("Name: " + d.name);
    if (d.date) L.push("Date needed: " + d.date);
    if (d.items) L.push("Bakes: " + d.items + (d.flavour ? " (" + d.flavour + ")" : ""));
    if (d.serve) L.push("Serving: " + d.serve + (d.serve === "More than 40" ? "" : " people"));
    if (d.theme) L.push("Occasion / notes: " + d.theme);
    if (d.how) L.push("Collect or delivery: " + d.how);
    if (d.allergy) L.push("Allergies: " + d.allergy);
    return L.join("\n").replace(/\n+$/, "");
  }
  function problem(d) {
    if (!d.name) return "Please add your name.";
    if (!d.date) return "Please pick the date you need it.";
    if (!d.items) return "Please tap at least one bake.";
    if (!d.serve) return "Please tap how many people you are serving.";
    if (d.needAddr) return "Please add the delivery address, or switch to Collect.";
    return "";
  }

  var go = $("waBtn"), box = $("msg"), err = $("err");
  function update() {
    $("fAddr").hidden = one("how") !== "Delivery";
    var d = data(), m = message(d);
    box.textContent = m;
    go.href = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(m);
    if (!err.hidden && !problem(d)) err.hidden = true;
  }

  // tapping a chosen radio chip again un-picks it
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

  // the bakes list picks that bake in the form
  [].forEach.call(document.querySelectorAll("[data-pick]"), function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var v = a.getAttribute("data-pick").replace(/&amp;/g, "&");
      [].forEach.call(form.querySelectorAll('input[name="item"]'), function (i) { if (i.value.replace(/&amp;/g, "&") === v) i.checked = true; });
      update();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  update();
})();
