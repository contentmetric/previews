/* Home: About section.
   1. Statement text effect (per-word appear): wrap each word in a span with its
      index; the stagger / spring live in home-about.css, site.js adds .is-in (data-appear, th .5).
   2. Card contents appear when their card's top passes the middle of the window
      (threshold .5: measured at 390px, fires between card top 434 and 414 with a 844px window). Once. */
(() => {
  const M = window.__makro;
  const sec = document.querySelector(".s-about");
  if (!sec || !M) return;

  const h = sec.querySelector(".s-about__statement strong");
  if (h) {
    let i = 0;
    h.innerHTML = h.textContent.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="s-about__w" style="--i:${i++}">${w}</span>` : w)).join("");
  }

  let cards = [...sec.querySelectorAll(".s-about__card")].map((c) => [c, c.querySelectorAll("[data-card-in]")]);
  const show = (items) => items.forEach((el) => el.classList.add("is-in"));
  if (M.reduce) { cards.forEach(([, items]) => show(items)); return; }
  const check = () => {
    if (!cards.length) return;
    const line = innerHeight * 0.5;
    cards = cards.filter(([c, items]) => (c.getBoundingClientRect().top <= line ? (show(items), false) : true));
  };
  M.onScrollFns.push(check);
  check();
})();
