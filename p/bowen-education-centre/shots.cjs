// shots.cjs — screenshots and layout numbers for the Bowen Education Centre preview.
//
//   node shots.cjs
//
// Serves nothing: the page is opened as a file:/// URL. Writes the full-page shots to previews/shots-bowen/
// and the phone card to previews/assets/p/bowen-education-centre.png, and prints, per width: JS errors,
// failed requests, broken images, sideways scroll, anything sticking out past the window, anything whose
// content overflows its own box, the header row's three boxes, the one stat that is a word, and whether the
// FAQ rows and the phone menu actually open. No image is ever opened here.
const puppeteer = require('../../../_mirror-kit/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const HERE = __dirname;
const PAGE = 'file:///' + path.join(HERE, 'index.html').replace(/\\/g, '/');
const SHOTS = path.join(HERE, '..', '..', 'shots-bowen');
const ASSETS = path.join(HERE, '..', '..', 'assets', 'p');
const SLUG = 'bowen-education-centre';
const WIDTHS = [1440, 1024, 768, 375];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// walk the page in 400px steps so anything that reveals on scroll has fired before the shot, then back to the top
async function walk(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((t) => {
      if (window.__lenis) window.__lenis.scrollTo(t, { immediate: true });
      else window.scrollTo(0, t);
    }, y);
    await sleep(120);
  }
  await page.evaluate(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  });
  await sleep(900);
}

const PROBE = () => {
  const desc = (el) => {
    const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const clipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return true;
    }
    return false;
  };
  const shown = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
  };
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right),
             scrollW: el.scrollWidth, clientW: el.clientWidth, text: el.textContent.trim().slice(0, 24) };
  };
  const vw = document.documentElement.clientWidth;
  const past = [];
  const over = [];
  const big = [];
  const tight = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
      past.push({ el: desc(el), left: Math.round(r.left), right: Math.round(r.right) });
    }
    const s = getComputedStyle(el);
    const dx = el.scrollWidth - el.clientWidth;
    const dy = el.scrollHeight - el.clientHeight;
    if (!el.clientWidth || !el.clientHeight) continue;
    // #main and main are the template's own clip boxes: the hero's stickers and the brush strokes deliberately
    // hang outside their parents, and the shells clip them. What matters is nothing escaping the window, which
    // the `past` and sideways checks above already cover.
    if (el.id === 'main' || el.tagName === 'MAIN' || el.tagName === 'BODY' || el.tagName === 'HTML') continue;
    if ((s.overflowX !== 'visible' && dx > 2) || (s.overflowY !== 'visible' && dy > 2)) {
      over.push({ el: desc(el), dx, dy, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 45) });
    }
    // a text line wider than the box it sits in, even where nothing clips: this is the "P3–PSLE" risk
    if (el.children.length === 0 && el.textContent.trim() && dx > 3) {
      tight.push({ el: desc(el), dx, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) });
    }
    if (r.width > vw + 1 && !clipped(el)) big.push({ el: desc(el), w: Math.round(r.width) });
  }
  const desktopHead = [".block-black", ".nav-menu", ".block-container-div-div"].map((s) => box(".block-desktop " + s));
  const phoneHead = [".black", ".navigation-div"].map((s) => box(".mobile-closed " + s));
  // a card that has been squeezed to nothing is the failure mode this page is most exposed to: Beam's grids are
  // sized for three cards and ours hold six, one and two
  const cards = [".tracks-card", ".tracks-tracks-card", ".review-card", ".testimonials-review-card",
                 ".our-teachers-desktop-2", ".features-features-wrapper-div-div"].map((s) => box(s));
  const head = (desktopHead[0] && desktopHead[0].w) ? desktopHead : phoneHead;
  const isPhoneHead = head === phoneHead;
  return {
    docScroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    pageHeight: document.documentElement.scrollHeight,
    past: past.slice(0, 12),
    over: over.slice(0, 12),
    big: big.slice(0, 12),
    tight: tight.slice(0, 12),
    broken: [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.getAttribute('src')),
    notLoaded: [...document.images].filter((i) => !i.complete).map((i) => i.getAttribute('src')),
    imgs: [...document.images].length,
    header: { logo: head[0], nav: head[1], cta: head[2] },
    phoneHead: isPhoneHead,
    cards,
    // what the repaint actually produced, read back rather than assumed
    paint: (() => {
      const cs = (sel, prop) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : 'MISSING'; };
      return {
        cta: cs('.tracks-colored', 'backgroundColor'),
        faqOpen: cs('.opened', 'backgroundColor'),
        faqClosed: cs('.faqs-closed', 'backgroundColor'),
        headlineBrush: cs('.hero-header-heading-span-span', 'backgroundColor'),
        statColour: cs('.number-counter-div-span', 'color'),
        inkOutline: cs('.buttons-div-div', 'borderTopColor'),
        logoH: (() => { const els = [...document.querySelectorAll('.lg-logo')].filter((e) => e.getBoundingClientRect().height > 0); return els.length ? Math.round(els[0].getBoundingClientRect().height) : 0; })(),
        nameFont: cs('.bw-name b', 'fontFamily'),
        mask: String(cs('.tracks-tracks-heading-span-span', 'webkitMaskImage') || '').split('/').pop(),
      };
    })(),
    stat: box('.stats-number-counter-div-2'),
    fonts: document.fonts ? document.fonts.status + ' / ' + document.fonts.size : 'n/a',
  };
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(ASSETS, { recursive: true });
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  let problems = 0;

  for (const w of WIDTHS) {
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push('JS ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    p.on('requestfailed', (r) => errs.push('FAILED ' + r.url().split('/').slice(-1)[0]));
    p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().split('/').slice(-1)[0]); });
    await p.setViewport({ width: w, height: w < 500 ? 812 : 900, isMobile: w < 500, hasTouch: w < 500 });
    await p.goto(PAGE, { waitUntil: 'load', timeout: 60000 });
    await sleep(1200);
    await walk(p);
    const out = path.join(SHOTS, `${SLUG}-${w}.png`);
    await p.screenshot({ path: out, fullPage: true });
    const info = await p.evaluate(PROBE);
    const bad = errs.length + info.broken.length + info.notLoaded.length +
      info.past.length + info.over.length + info.big.length + info.tight.length +
      Math.max(0, info.docScroll - info.client);
    problems += bad;
    console.log(`\n=== ${w}px  ${out}`);
    console.log(`    page ${info.pageHeight}px tall, doc scrollWidth ${info.docScroll} vs window ${info.client}` +
      ` (sideways ${Math.max(0, info.docScroll - info.client)}px), ${info.imgs} images, fonts ${info.fonts}`);
    console.log(`    ${bad ? '!!' : 'ok'}  js/network errors ${errs.length}, broken images ${info.broken.length}, ` +
      `unloaded images ${info.notLoaded.length}, past the window ${info.past.length}, overflowing a box ${info.over.length}, ` +
      `wider than the window ${info.big.length}, text wider than its box ${info.tight.length}`);
    const H = info.header;
    if (H.logo && H.nav && H.logo.w) {
      const gap1 = H.nav.l - H.logo.r, gap2 = H.cta ? H.cta.l - H.nav.r : null;
      const tight = gap1 < 8 || (gap2 !== null && gap2 < 8);
      console.log(`    header: logo ${H.logo.w}x${H.logo.h} at ${H.logo.l}..${H.logo.r} "${H.logo.text}"` +
        ` | nav ${H.nav.w} at ${H.nav.l}..${H.nav.r} | cta ${H.cta ? H.cta.w : '-'}` +
        ` | gaps ${gap1}${gap2 === null ? '' : ' / ' + gap2}` + (tight ? '  !! TIGHT' : ''));
      if (tight) problems++;
    } else if (H.logo && H.logo.w) {
      const gap = H.nav ? H.nav.l - H.logo.r : null;
      const tight = gap !== null && gap < 8;
      console.log(`    header (phone): logo ${H.logo.w}x${H.logo.h} at ${H.logo.l}..${H.logo.r} | burger ${H.nav ? H.nav.w : '-'}` +
        ` | gap ${gap}` + (tight ? '  !! TIGHT' : ''));
      if (tight) problems++;
    }
    const thin = info.cards.filter((c) => c && c.w < 200);
    console.log(`    cards: ${info.cards.map((c) => (c ? c.w + 'px' : '-')).join(' / ')}` +
      `  (tracks x2 / review / green review / teacher / feature)` + (thin.length ? '  !! SQUEEZED' : ''));
    problems += thin.length;
    const P = info.paint;
    console.log(`    paint: cta ${P.cta}, faq open ${P.faqOpen} / closed ${P.faqClosed}, headline brush ${P.headlineBrush},` +
      ` stat numeral ${P.statColour}, ink outline ${P.inkOutline}, header logo height ${P.logoH}px, name font ${P.nameFont}, mask ${P.mask}`);
    const paintOk = P.cta === 'rgb(47, 49, 146)' && P.inkOutline === 'rgb(37, 30, 33)' && P.headlineBrush === 'rgb(236, 29, 40)' &&
      P.statColour === 'rgb(236, 29, 40)' && /Space Grotesk/.test(P.nameFont) && /mask-/.test(P.mask) &&
      P.logoH === (w < 810 ? 38 : 44);
    if (!paintOk) { console.log('        !! the brand colours did not all land'); problems++; }
    if (info.stat) {
      const s = info.stat;
      console.log(`    stat "K1-Sec 4": ${s.w}x${s.h}, text ${s.scrollW} vs box ${s.clientW}` +
        (s.scrollW > s.clientW + 2 ? '  !! OVERFLOWS' : ''));
      if (s.scrollW > s.clientW + 2) problems++;
    }
    for (const e of errs) console.log('        ERR ' + e);
    for (const s of info.broken) console.log('        BROKEN IMG ' + s);
    for (const s of info.notLoaded) console.log('        NOT LOADED ' + s);
    for (const o of info.past) console.log(`        PAST left ${o.left} right ${o.right}  ${o.el}`);
    for (const o of info.big) console.log(`        WIDE ${o.w}px  ${o.el}`);
    for (const o of info.over) console.log(`        OVERFLOW dx ${o.dx} dy ${o.dy}  ${o.el}  "${o.text}"`);
    for (const o of info.tight) console.log(`        TEXT WIDER THAN BOX by ${o.dx}  ${o.el}  "${o.text}"`);

    // the FAQs: the second question starts closed, so tapping it has to open it
    const faq = await p.evaluate(async () => {
      const item = document.querySelectorAll('.n1-div')[1];
      if (!item) return 'no second FAQ item';
      const row = item.firstElementChild.firstElementChild;
      const ans = item.querySelector('.faqs-opened-div');
      const before = { open: item.classList.contains('is-open'), h: Math.round(ans.getBoundingClientRect().height) };
      row.click();
      await new Promise((r) => setTimeout(r, 250));
      const after = { open: item.classList.contains('is-open'), h: Math.round(ans.getBoundingClientRect().height) };
      row.click();
      await new Promise((r) => setTimeout(r, 250));
      const closed = { open: item.classList.contains('is-open'), h: Math.round(ans.getBoundingClientRect().height) };
      return { before, after, closed };
    });
    const faqOk = faq.after && faq.after.open && faq.after.h > 20 && !faq.closed.open && faq.closed.h === 0;
    console.log(`    faq tap: closed ${JSON.stringify(faq.before)} -> open ${JSON.stringify(faq.after)} -> closed ${JSON.stringify(faq.closed)}  ${faqOk ? 'ok' : '!!'}`);
    if (!faqOk) problems++;

    if (w < 500) {
      const menu = await p.evaluate(async () => {
        const burger = document.querySelector('.navigation-div');
        const panel = document.querySelector('.lg-menu');
        if (!burger || !panel) return 'no burger or panel';
        burger.click();
        await new Promise((r) => setTimeout(r, 250));
        const open = { cls: document.querySelector('.mobile-closed').classList.contains('is-open'),
                       h: Math.round(panel.getBoundingClientRect().height),
                       aria: burger.getAttribute('aria-expanded') };
        document.querySelector('.lg-menu a').click();
        await new Promise((r) => setTimeout(r, 250));
        const shut = { cls: document.querySelector('.mobile-closed').classList.contains('is-open'),
                       h: Math.round(panel.getBoundingClientRect().height) };
        return { open, shut };
      });
      const menuOk = menu.open && menu.open.cls && menu.open.h > 150 && !menu.shut.cls;
      console.log(`    phone menu: open ${JSON.stringify(menu.open)} -> closed ${JSON.stringify(menu.shut)}  ${menuOk ? 'ok' : '!!'}`);
      if (!menuOk) problems++;
    }
    await p.close();
  }

  // the phone card: first screen only, 390x844 at 2x
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(PAGE, { waitUntil: 'load', timeout: 60000 });
  await sleep(2500);
  const phone = path.join(ASSETS, `${SLUG}.png`);
  await p.screenshot({ path: phone });
  const st = fs.statSync(phone);
  const first = await p.evaluate(() => ({
    text: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 90),
    fonts: document.fonts.status,
  }));
  console.log(`\n=== 390x844 @2x first screen  ${phone}  (${st.size} bytes)`);
  console.log(`    fonts ${first.fonts}; first line reads: "${first.text}"`);
  if (st.size < 20000) { console.log('    !! the phone shot looks empty'); problems++; }
  await p.close();

  await b.close();
  console.log(problems ? `\n${problems} problem(s)` : '\nALL CLEAN');
  process.exit(problems ? 1 : 0);
})();
