/* Enquiry form: markup only. Submitting sends nothing and says so. */
document.querySelectorAll("[data-form-stub]").forEach((form) => {
  const note = form.querySelector(".ct-form__note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (note) { note.textContent = "This form is not connected yet."; note.hidden = false; }
  });
});
