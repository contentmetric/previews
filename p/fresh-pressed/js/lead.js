/* Booking form -> WhatsApp. Builds the message in the browser and opens wa.me in a new tab; nothing else is sent. */
(function () {
  var f = document.getElementById("book-form");
  if (!f) return;
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (n) { return ((f.elements[n] && f.elements[n].value) || "").trim(); };
    var text = "Hi Fresh Pressed, I'd like to book " + (v("Service") ? "this: " + v("Service") : "an appointment") + "." +
      (v("Name") ? " My name is " + v("Name") + "." : "") +
      " My preferred date and time: " + [v("Date"), v("Time")].filter(Boolean).join(" ");
    window.open("https://wa.me/6589496881?text=" + encodeURIComponent(text), "_blank");
  });
})();
