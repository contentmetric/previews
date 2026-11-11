/* iHandyman Builders preview: closes the phone menu after a menu link is tapped. */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  header.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || !header.classList.contains('is-open')) return;
    var burger = header.querySelector('.humberger-block');
    if (burger) burger.click();
  });
})();
