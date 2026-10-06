/* Page script: smooth scroll, header state, phone menu, FAQ accordion. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ duration: 1.5 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  }

  // header: turns into the blurred dark bar once the page's [data-nav-trigger] element has reached mid-screen
  const header = document.querySelector(".site-header");
  const trigger = document.querySelector("[data-nav-trigger]");
  if (header) {
    const check = () => {
      const top = trigger ? trigger.getBoundingClientRect().top : 1;
      header.classList.toggle("is-scrolled", trigger ? top <= innerHeight * 0.5 + 1 : scrollY > 0);
    };
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    check();

    // phone / tablet menu
    const burger = header.querySelector(".humberger-block");
    if (burger) {
      burger.setAttribute("role", "button");
      burger.setAttribute("aria-label", "Menu");
      burger.setAttribute("aria-expanded", "false");
      burger.addEventListener("click", () => {
        const open = header.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("is-open")) burger.click(); });
    }
  }

  // FAQ accordion: one open at a time, click again closes
  document.querySelectorAll(".faq-card").forEach((card) => {
    const toggle = () => {
      const item = card.parentElement, open = !item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item.is-open").forEach((o) => { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); });
      item.classList.toggle("is-open", open);
      card.setAttribute("aria-expanded", String(open));
    };
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
})();
