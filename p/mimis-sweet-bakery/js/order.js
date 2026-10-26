/* Mimi's Sweet Bakery order builder. A port of the lead's own builder (mimissweetbakery.com.sg): same items, prices,
   first-order and code discounts, delivery fee, presale state and the same WhatsApp message. Nothing is posted anywhere;
   the button only opens wa.me/6591045582 with the order written out. Copy-order fallback included. */
(function () {
  "use strict";
  var WA_NUMBER = "6591045582";
  var DELIVERY_FEE = 8;
  var FIRST_ORDER_PCT = 10;
  var CODES = {
    "MIMIFAM25": { pct: 25, label: "Family & friends" },
    "MIMICORP20": { pct: 20, label: "Corporate order" }
  };
  var LAUNCH = { y: 2026, m: 12 };
  var PRESALE_END_DAY = 14;
  var DELIVERY_OVERRIDE = { "2026-12": [21, 24] };
  var ITEMS = [
    { id: "cf12", name: "Original Classic", pack: "Box of 12 regular", price: 36 },
    { id: "cc12", name: "Cream Cheese", pack: "Box of 12 regular", price: 36 },
    { id: "mx12", name: "Half & Half", pack: "Box of 12 regular (6 + 6)", price: 36 },
    { id: "cfb", name: "Original Classic", pack: "Tub of 10 bites", price: 8 },
    { id: "ccb", name: "Cream Cheese", pack: "Tub of 10 bites", price: 8 },
    { id: "mxb", name: "Half & Half", pack: "Tub of 10 bites (5 + 5)", price: 8 }
  ];
  var SOON = [
    { name: "Cookies", shape: "mm-ck", note: "Next out of the oven. Flavours and prices to be announced." },
    { name: "Mini cakes", shape: "mm-mc", note: "Little cakes for small celebrations. Details to be announced." }
  ];
  var SECRET = [
    { name: "Salted Caramel", note: "Fudge brownie with a ribbon of salted caramel.", bg: "radial-gradient(circle at 35% 40%,#c98a3c 0 22%,transparent 23%),radial-gradient(circle at 68% 70%,#c98a3c 0 14%,transparent 15%),linear-gradient(135deg,#6b4028,#4a2c1c 60%)" },
    { name: "Matcha White Chocolate", note: "A green tea blondie with white chocolate chunks.", bg: "radial-gradient(circle at 30% 30%,#f4ecd8 0 12%,transparent 13%),radial-gradient(circle at 66% 62%,#f4ecd8 0 15%,transparent 16%),linear-gradient(135deg,#8fa863,#6f8a4a 60%)" },
    { name: "Biscoff", note: "Fudge brownie swirled with cookie butter.", bg: "radial-gradient(circle at 60% 35%,#b9763a 0 20%,transparent 21%),radial-gradient(circle at 32% 70%,#b9763a 0 13%,transparent 14%),linear-gradient(135deg,#6b4028,#4a2c1c 60%)" }
  ];

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var $ = function (id) { return document.getElementById(id); };
  if (!$("orderForm")) return;

  function sgToday() {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
    var g = function (t) { return +p.find(function (x) { return x.type === t; }).value; };
    return { y: g("year"), m: g("month"), d: g("day") };
  }
  function cycle(y, m) {
    var last = new Date(y, m, 0).getDate();
    var ov = DELIVERY_OVERRIDE[y + "-" + String(m).padStart(2, "0")];
    var del = ov || [last - 6, last];
    return { y: y, m: m, name: MONTHS[m - 1], pre: "1 to " + PRESALE_END_DAY + " " + MONTHS[m - 1], del: del[0] + " to " + del[1] + " " + MONTHS[m - 1] };
  }
  function getState() {
    var t = sgToday();
    var beforeLaunch = t.y < LAUNCH.y || (t.y === LAUNCH.y && t.m < LAUNCH.m);
    if (beforeLaunch) return { mode: "soon", c: cycle(LAUNCH.y, LAUNCH.m) };
    if (t.d <= PRESALE_END_DAY) return { mode: "open", c: cycle(t.y, t.m), left: PRESALE_END_DAY - t.d };
    var ny = t.m === 12 ? t.y + 1 : t.y, nm = t.m === 12 ? 1 : t.m + 1;
    return { mode: "closed", c: cycle(ny, nm), cur: cycle(t.y, t.m) };
  }
  var state = getState();
  var isOpen = state.mode === "open";

  (function renderStatus() {
    var c = state.c;
    $("stPre").textContent = c.pre; $("stDel").textContent = c.del;
    if (state.mode === "open") {
      $("stEyebrow").textContent = "Presale is open";
      $("stHead").textContent = c.name + " preorders are open";
      $("stText").textContent = state.left === 0 ? "Last day to order." : state.left + " day" + (state.left === 1 ? "" : "s") + " left to order.";
      $("ordSub").textContent = "Ordering for " + c.name + ". Delivery and collection " + c.del + ".";
      $("ordEyebrow").textContent = "Preorder";
      $("ordHead").textContent = "Build your order";
      $("heroPill").textContent = c.name + " preorders are open";
      $("heroBtnT").textContent = "Preorder now";
      $("waBtn").textContent = "Send order on WhatsApp";
    } else {
      var soon = state.mode === "soon";
      $("stEyebrow").textContent = soon ? "Relaunching soon" : "Presale is closed";
      $("stHead").textContent = "Presale opens 1 " + c.name;
      $("stText").textContent = soon ? "Mimi's is back, starting with brownies." : state.cur.name + " orders are being baked. " + state.cur.name + " deliveries: " + state.cur.del + ".";
      $("heroPill").textContent = "Presale opens 1 " + c.name;
      $("heroBtnT").textContent = "Get a reminder";
      $("ordEyebrow").textContent = "Reminder";
      $("ordHead").textContent = "Tell us what you'd like";
      $("ordSub").textContent = "Presale opens 1 " + c.name + ". Pick what you're interested in and we'll message you the day it opens.";
      $("waBtn").textContent = "Get a reminder on WhatsApp";
    }
  })();

  var qty = {}; ITEMS.forEach(function (i) { qty[i.id] = 0; });
  $("feeLbl").textContent = DELIVERY_FEE;
  var catOf = function (i) { return i.cat || "Brownies"; };
  var rowHtml = function (i) {
    return '<div class="mm-row"><div class="what"><b>' + i.name + '</b><span>' + i.pack + ' · $' + i.price + '</span></div>' +
      '<div class="mm-qty"><button type="button" data-id="' + i.id + '" data-d="-1" aria-label="Remove one ' + i.name + ' ' + i.pack + '">−</button>' +
      '<output id="q-' + i.id + '">0</output>' +
      '<button type="button" data-id="' + i.id + '" data-d="1" aria-label="Add one ' + i.name + ' ' + i.pack + '">+</button></div></div>';
  };
  var cats = []; ITEMS.forEach(function (i) { if (cats.indexOf(catOf(i)) < 0) cats.push(catOf(i)); });
  $("rows").innerHTML = cats.map(function (c) {
    return '<h3 class="mm-cathead">' + c + '</h3>' + ITEMS.filter(function (i) { return catOf(i) === c; }).map(rowHtml).join("");
  }).join("");
  $("soonGrid").innerHTML = SOON.map(function (s) {
    return '<article class="mm-card"><div class="mm-pic"><div class="' + s.shape + '"></div><div class="' + s.shape + ' sm"></div></div>' +
      '<div class="mm-cat"><h3 class="mm-h3">' + s.name + '</h3><span class="mm-badge quiet">Coming soon</span></div>' +
      '<p class="mm-p">' + s.note + '</p>' +
      '<a target="_blank" rel="noopener" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent("Hi Mimi! Please tell me when " + s.name.toLowerCase() + " launch.") + '">Tell me when they launch</a></article>';
  }).join("");
  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]"); if (!b) return;
    qty[b.dataset.id] = Math.max(0, Math.min(20, qty[b.dataset.id] + +b.dataset.d));
    $("q-" + b.dataset.id).textContent = qty[b.dataset.id]; update();
  });

  function money(n) { return Number.isInteger(n) ? String(n) : n.toFixed(2); }
  function build() {
    var lines = ITEMS.filter(function (i) { return qty[i.id] > 0; });
    var delivery = $("fDel").checked;
    var sub = lines.reduce(function (s, i) { return s + i.price * qty[i.id]; }, 0);
    var fee = delivery && sub > 0 ? DELIVERY_FEE : 0;
    var code = $("promo").value.trim().toUpperCase();
    var pct = 0, why = "";
    if ($("firstOrder").checked) { pct = FIRST_ORDER_PCT; why = "First order"; }
    if (CODES[code] && CODES[code].pct > pct) { pct = CODES[code].pct; why = CODES[code].label; }
    var disc = Math.round(sub * pct) / 100, total = sub - disc + fee;
    var name = $("custName").value.trim(), addr = $("custAddr").value.trim(), note = $("custNote").value.trim();
    var c = state.c;
    var items = lines.map(function (i) { return "• " + qty[i.id] + " × " + i.name + ", " + i.pack.toLowerCase() + " ($" + i.price * qty[i.id] + ")"; }).join("\n");
    var m = isOpen ? "Hi Mimi! I'd like to preorder for " + c.name + ":\n" + items
      : "Hi Mimi! Please remind me when the " + c.name + " presale opens." + (items ? "\n\nI'm interested in:\n" + items : "");
    if (isOpen) {
      m += "\n\n" + (delivery ? "Delivery (+$" + fee + ")" : "Self-collection");
      if (disc) m += "\nDiscount: " + why + " " + pct + "% off (-$" + money(disc) + ")" + (CODES[code] && why === CODES[code].label ? " [code " + code + "]" : "");
      m += "\nTotal: $" + money(total);
      m += "\nName: " + name;
      if (delivery) m += "\nAddress: " + addr;
    } else if (name) { m += "\n\nName: " + name; }
    if (note) m += "\nNote: " + note;
    return { lines: lines, sub: sub, fee: fee, delivery: delivery, name: name, addr: addr, msg: m, disc: disc, pct: pct, why: why, total: total, code: code, codeOk: !!CODES[code] };
  }
  function problem(o) {
    if (!o.lines.length) return "Add at least one box or tub first.";
    if (isOpen && !o.name) return "Please add your name.";
    if (isOpen && o.delivery && !o.addr) return "Please add your delivery address.";
    return "";
  }
  function update() {
    var o = build();
    $("addrWrap").hidden = !o.delivery;
    $("sumList").innerHTML = o.lines.length
      ? o.lines.map(function (i) { return "<li><span>" + qty[i.id] + " × " + i.name + ", " + i.pack.toLowerCase() + "</span><span>$" + i.price * qty[i.id] + "</span></li>"; }).join("") +
        (o.disc ? "<li><span>" + o.why + ", " + o.pct + "% off</span><span>−$" + money(o.disc) + "</span></li>" : "") +
        (o.fee ? "<li><span>Delivery</span><span>$" + o.fee + "</span></li>" : "")
      : '<li class="mm-empty">Nothing added yet</li>';
    $("sumTotal").textContent = "$" + money(o.total);
    var pm = $("promoMsg"); pm.hidden = !o.code;
    pm.textContent = o.codeOk ? "Code applied: " + CODES[o.code].pct + "% off your bakes." : "That code isn't recognised. Check the spelling.";
    $("waBtn").href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(o.msg);
    $("msgbox").value = o.msg;
    if (!$("err").hidden && !problem(o)) $("err").hidden = true;
  }
  $("orderForm").addEventListener("input", update);
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

  $("secretGrid").innerHTML = SECRET.map(function (s) {
    return '<article class="mm-card"><div class="mm-b" style="background:' + s.bg + '"></div>' +
      '<h3 class="mm-h3">' + s.name + '</h3><p class="mm-p">' + s.note + '</p>' +
      '<a target="_blank" rel="noopener" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent("Hi Mimi! From the secret menu, I'd love to try " + s.name + " first.") + '">Vote for this one</a></article>';
  }).join("");
  function showSecret(scroll) {
    $("secret").hidden = false; $("psst").setAttribute("aria-expanded", "true");
    if (scroll) {
      if (window.lenis) window.lenis.scrollTo($("secret"), { offset: -72 });
      else $("secret").scrollIntoView({ behavior: "smooth" });
    }
  }
  $("psst").addEventListener("click", function () { showSecret(true); });
  if (location.hash === "#secret") showSecret(true);
  window.addEventListener("hashchange", function () { if (location.hash === "#secret") showSecret(true); });
})();
