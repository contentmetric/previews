// Open/close for the "What we do" rows and the FAQ: a click gives the row the classes of its list's open (or closed)
// variant, element by element, and closes the other rows of that list. The converted base shipped without a handler.
(function () {
  var SETS = [['.faqs-open', '.faqs-closed'], ['.open[name]', '.services-closed'], ['.services-open', '.services-closed-2']];
  var classesOf = function (row) {
    return [row].concat([].slice.call(row.querySelectorAll('*'))).map(function (e) { return e.getAttribute('class') || ''; });
  };
  var apply = function (row, C) {
    var els = [row].concat([].slice.call(row.querySelectorAll('*')));
    if (els.length !== C.length) return false; // shortcut: rows must share one structure; a row with extra markup stays as it is
    els.forEach(function (e, i) { if (C[i]) e.setAttribute('class', C[i]); else e.removeAttribute('class'); });
    return true;
  };
  SETS.forEach(function (s) {
    var open = document.querySelector(s[0]), shut = document.querySelector(s[1]);
    if (!open || !shut) return;
    var A = classesOf(open), B = classesOf(shut);
    document.addEventListener('click', function (ev) {
      var row = ev.target.closest(s[0] + ',' + s[1]);
      if (!row) return;
      var wasOpen = row.matches(s[0]), list = row.parentElement.parentElement;
      [].forEach.call(list.querySelectorAll(s[0]), function (r) { if (r !== row) apply(r, B); });
      apply(row, wasOpen ? B : A);
    });
  });
})();
