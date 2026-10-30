/* Booking picker: builds a WhatsApp message from service, date and time. Nothing is posted anywhere;
   the button is a plain link to wa.me/6589019398 whose text is rewritten whenever a field changes. */
(function () {
  "use strict";
  var NUMBER = "6589019398";
  var form = document.getElementById("bookForm");
  if (!form) return;
  var svc = document.getElementById("bkService"), date = document.getElementById("bkDate"), time = document.getElementById("bkTime");
  var go = document.getElementById("bookGo"), prev = document.getElementById("bkPreview");
  var WEEK = ["日", "一", "二", "三", "四", "五", "六"];

  for (var h = 10; h < 20; h++) {
    [":00", ":30"].forEach(function (m) {
      var v = (h < 10 ? "0" : "") + h + m, o = document.createElement("option");
      o.value = v; o.textContent = v; time.appendChild(o);
    });
  }
  time.value = "14:00";

  function sgDate(offsetDays) {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    var d = new Date(p + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
  date.min = sgDate(0);
  date.value = sgDate(1);

  function build() {
    var lines = ["你好 GG Beauty，我想预约：", "护理：" + svc.value];
    if (date.value) {
      var d = new Date(date.value + "T00:00:00Z");
      lines.push("日期：" + (d.getUTCMonth() + 1) + "月" + d.getUTCDate() + "日（周" + WEEK[d.getUTCDay()] + "）");
    }
    if (time.value) lines.push("时间：" + time.value);
    lines.push("请问有位吗？谢谢！");
    var text = lines.join("\n");
    go.href = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(text);
    prev.textContent = text;
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  [svc, date, time].forEach(function (el) { el.addEventListener("change", build); el.addEventListener("input", build); });
  build();
})();
