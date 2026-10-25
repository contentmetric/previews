/* Singa Educational Services preview: the two things Beam's static export leaves dead.

   Beam's FAQ boxes are drawn with their answers already open, and its phone burger has no menu behind it.
   Both are wired here; the CSS that folds the answers away is scoped to html.js, so a browser without
   scripting still shows every answer. */
(function () {
  "use strict";

  /* --- the FAQs: tap a question to open it, tap it again to close ------------------------- */
  var items = document.querySelectorAll(".n1-div");

  function setOpen(item, row, open) {
    item.classList.toggle("is-open", open);
    if (row) row.setAttribute("aria-expanded", open ? "true" : "false");
  }

  Array.prototype.forEach.call(items, function (item) {
    var box = item.firstElementChild;               /* .opened / .closed / .faqs-closed ... */
    var row = box && box.firstElementChild;         /* the line holding the question and the + / - */
    if (!row) return;

    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    setOpen(item, row, item.classList.contains("is-open"));

    function toggle() {
      setOpen(item, row, !item.classList.contains("is-open"));
    }

    row.addEventListener("click", toggle);
    row.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  /* --- the phone header: one burger, one panel -------------------------------------------- */
  var burger = document.querySelector(".navigation-div");
  var phoneHeader = burger && burger.closest(".mobile-closed");

  if (burger && phoneHeader) {
    var menu = phoneHeader.querySelector(".lg-menu");

    function setMenu(open) {
      phoneHeader.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    }

    burger.addEventListener("click", function () {
      setMenu(!phoneHeader.classList.contains("is-open"));
    });
    burger.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setMenu(!phoneHeader.classList.contains("is-open"));
      }
    });

    /* a tap on any link in the panel closes it again */
    if (menu) {
      Array.prototype.forEach.call(menu.querySelectorAll("a"), function (link) {
        link.addEventListener("click", function () {
          setMenu(false);
        });
      });
    }
  }
})();
