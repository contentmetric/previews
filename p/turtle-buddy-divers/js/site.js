/* Site script: phone menu, FAQ accordion, image loading fix. */
(() => {
  const btn = document.querySelector(".open-navigation"), nav = document.getElementById("phone-navigation");
  if (btn && nav) {
    const set = (open) => {
      nav.hidden = !open; btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };
    btn.addEventListener("click", () => set(nav.hidden));
    addEventListener("resize", () => { if (innerWidth > 809 && !nav.hidden) set(false); });
  }

  document.querySelectorAll(".question-button").forEach((b) => b.addEventListener("click", () => {
    const q = b.closest(".question"), ans = q.querySelector(".faq-answer"), open = ans.hidden;
    ans.hidden = !open; q.classList.toggle("is-open", open); b.setAttribute("aria-expanded", String(open));
  }));
})();
