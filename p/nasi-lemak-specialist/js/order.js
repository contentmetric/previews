/* Nasi Lemak Specialist order builder. Items and prices are the ones on the stall's own ordering page.
   Nothing is posted anywhere: the button only opens wa.me/6580337204 with the order written out. Copy-order fallback included. */
(function () {
  "use strict";
  var WA_NUMBER = "6580337204";
  var ITEMS = [
    { id: "nlc", cat: "Nasi lemak kukus (pre-order)", name: "Packed Nasi Lemak Chicken", pack: "10 packets", price: 42.9 },
    { id: "nlf", cat: "Nasi lemak kukus (pre-order)", name: "Packed Nasi Lemak Fish", pack: "10 packets", price: 42.9 },
    { id: "cr5", cat: "Weekly specials (ask if on)", name: "Chicken Rice Set", pack: "5 pax", price: 31.9 },
    { id: "cr3", cat: "Weekly specials (ask if on)", name: "Chicken Rice Set", pack: "3 pax", price: 19.3 },
    { id: "cr1", cat: "Weekly specials (ask if on)", name: "Chicken Rice Set", pack: "1 pax", price: 6.5 },
    { id: "chp", cat: "Weekly specials (ask if on)", name: "Chap Chai (Fried Mixed Vege)", pack: "3 pax", price: 5.5 },
    { id: "frc", cat: "Weekly specials (ask if on)", name: "Fragrant Chicken Rice", pack: "1 bowl", price: 1.1 }
  ];
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var $ = function (id) { return document.getElementById(id); };
  if (!$("orderForm")) return;

  function money(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function sgToday() {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return p;
  }
  function dayOf(iso) { var a = iso.split("-"); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function pretty(iso) { var d = dayOf(iso); return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }

  // time slots: every 30 minutes from 6:30 am to 1:30 pm (the stall closes at 2 pm)
  var slots = [];
  for (var m = 6 * 60 + 30; m <= 13 * 60 + 30; m += 30) {
    var hh = Math.floor(m / 60), mm = m % 60, ap = hh >= 12 ? "pm" : "am", h12 = hh > 12 ? hh - 12 : hh;
    slots.push(h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap);
  }
  $("ordTime").innerHTML = '<option value="">Choose a time</option>' + slots.map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("");
  $("ordDate").min = sgToday();

  var qty = {}; ITEMS.forEach(function (i) { qty[i.id] = 0; });
  var cats = []; ITEMS.forEach(function (i) { if (cats.indexOf(i.cat) < 0) cats.push(i.cat); });
  var rowHtml = function (i) {
    return '<div class="nl-row"><div class="what"><b>' + i.name + '</b><span>' + i.pack + " · $" + money(i.price) + "</span></div>" +
      '<div class="nl-qty"><button type="button" data-id="' + i.id + '" data-d="-1" aria-label="Remove one ' + i.name + " " + i.pack + '">−</button>' +
      '<output id="q-' + i.id + '">0</output>' +
      '<button type="button" data-id="' + i.id + '" data-d="1" aria-label="Add one ' + i.name + " " + i.pack + '">+</button></div></div>';
  };
  $("rows").innerHTML = cats.map(function (c) {
    return '<h3 class="nl-cathead">' + c + "</h3>" + ITEMS.filter(function (i) { return i.cat === c; }).map(rowHtml).join("");
  }).join("");
  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]"); if (!b) return;
    qty[b.dataset.id] = Math.max(0, Math.min(20, qty[b.dataset.id] + +b.dataset.d));
    $("q-" + b.dataset.id).textContent = qty[b.dataset.id]; update();
  });

  function build() {
    var lines = ITEMS.filter(function (i) { return qty[i.id] > 0; });
    var delivery = $("fDel").checked;
    var total = lines.reduce(function (s, i) { return s + i.price * qty[i.id]; }, 0);
    var name = $("custName").value.trim(), addr = $("custAddr").value.trim(), note = $("custNote").value.trim();
    var date = $("ordDate").value, time = $("ordTime").value;
    var items = lines.map(function (i) { return "• " + qty[i.id] + " × " + i.name + ", " + i.pack + " ($" + money(i.price * qty[i.id]) + ")"; }).join("\n");
    var m = "Hi Nasi Lemak Specialist, we'd like to order:\n" + items;
    m += "\n\nFor: " + (date ? pretty(date) : "(day to confirm)") + (time ? ", " + time : "");
    m += "\n" + (delivery ? "Delivery (please confirm the fee)" : "Pick up");
    m += "\nTotal: $" + money(total) + (delivery ? " (before delivery)" : "");
    if (name) m += "\nName: " + name;
    if (delivery && addr) m += "\nAddress: " + addr;
    if (note) m += "\nNote: " + note;
    m += "\n\nPlease confirm availability. Thank you!";
    return { lines: lines, total: total, delivery: delivery, name: name, addr: addr, date: date, time: time, msg: m };
  }
  function problem(o) {
    if (!o.lines.length) return "Add at least one item first.";
    if (!o.name) return "Please add your name.";
    if (!o.date) return "Please choose a day.";
    if (dayOf(o.date).getUTCDay() === 5) return "The stall is closed on Fridays. Please choose another day.";
    if (!o.time) return "Please choose a time.";
    if (o.delivery && !o.addr) return "Please add your delivery address.";
    return "";
  }
  function update() {
    var o = build();
    $("addrWrap").hidden = !o.delivery;
    $("feeNote").hidden = !(o.delivery && o.lines.length);
    $("sumList").innerHTML = o.lines.length
      ? o.lines.map(function (i) { return "<li><span>" + qty[i.id] + " × " + i.name + ", " + i.pack + "</span><span>$" + money(i.price * qty[i.id]) + "</span></li>"; }).join("")
      : '<li class="nl-empty">Nothing added yet</li>';
    $("sumTotal").textContent = "$" + money(o.total);
    $("waBtn").href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(o.msg);
    $("msgbox").value = o.msg;
    if (!$("err").hidden && !problem(o)) $("err").hidden = true;
  }
  $("orderForm").addEventListener("input", update);
  $("orderForm").addEventListener("change", update);
  $("orderForm").addEventListener("submit", function (e) { e.preventDefault(); });
  $("waBtn").addEventListener("click", function (e) {
    var p = problem(build());
    if (p) { e.preventDefault(); $("err").textContent = p; $("err").hidden = false; }
  });
  $("copyBtn").addEventListener("click", function () {
    var o = build(), p = problem(o);
    if (p) { $("err").textContent = p; $("err").hidden = false; return; }
    var box = $("msgbox"); box.hidden = false;
    var done = function () { $("copyBtn").textContent = "Copied. Paste it into WhatsApp."; };
    var fallback = function () { box.focus(); box.select(); $("copyBtn").textContent = "Select the text below and copy it"; };
    try { navigator.clipboard.writeText(o.msg).then(done, fallback); } catch (_) { fallback(); }
  });
  update();
})();
