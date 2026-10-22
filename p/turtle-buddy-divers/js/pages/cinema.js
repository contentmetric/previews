/* Home page: the scroll-driven dive film (hero, gear check, entry, dive sites, surface).
   Vanilla port of the template's own cinema component; same maths, same thresholds, same video scrubber. */
(() => {
  "use strict";
  const root = document.querySelector(".dc-cinema");
  if (!root) return;
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  const H = 0.28;
  const MEDIA = {
    boat: "media/boat.mp4", entry: "media/entry-optimized.mp4", sardines: "media/sardines.mp4", reef: "media/reef.mp4",
    wreck: "media/wreck.mp4", "surface-return": "media/surface-return-optimized.mp4",
  };
  const IMG = (n) => "media/" + (n === "entry" ? "surface-start" : n) + ".webp";
  const MODEL = "models/scuba-kit.glb";
  const RENDERER = "../gear-renderer.js";
  const SITES = [
    { id: "reef", number: "01", name: "PULAU HANTU", location: "SINGAPORE", max: 18.4, d1: "FIVE DIVE SITES ON ONE ISLAND", d2: "HOME OF SINGAPORE DIVERS", label: "Different critters and nudibranchs at each site. Puffer fishes, stingrays and sea horses are common here.", encounter: "", spotted: "", x: "68%", y: "39%" },
    { id: "wreck", number: "02", name: "PULAU JONG", location: "SINGAPORE", max: 28.2, d1: "DOWN TO 70 M", d2: "TEC DIVERS’ PLAYGROUND", label: "Tec divers explore the wreck that guides you to the deep end of the island.", encounter: "", spotted: "", x: "64%", y: "47%" },
    { id: "sardines", number: "03", name: "ST JOHN ISLAND", location: "SINGAPORE", max: 22.6, d1: "30 TO 35 M", d2: "UNTOUCHED CORALS", label: "Sharks and beautiful untouched corals, down to 35 m.", encounter: "", spotted: "", x: "67%", y: "45%" },
  ];
  const GEAR_FOCUS = ["BC fit and straps", "Regulator and connections", "Mask fit", "Fins and straps", "Tank pressure"];

  const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const shortMQ = matchMedia("(max-height:480px) and (min-aspect-ratio:4/3)");
  let reduced = reducedMQ.matches;
  let simple = shortMQ.matches;
  let paused = false;

  // ---------------------------------------------------------------- scroll progress of a tall section
  function track(el, cb, enabled = () => true) {
    let raf = 0, last = -1;
    const run = () => {
      raf = 0;
      if (!enabled()) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, el.offsetHeight - innerHeight)));
      if (Math.abs(last - p) < 1e-5) return;
      last = p; cb(p);
    };
    const kick = () => { raf ||= requestAnimationFrame(run); };
    new ResizeObserver(kick).observe(el);
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    kick();
    return { kick, force() { last = -1; kick(); } };
  }

  // ---------------------------------------------------------------- video frame player (scrub)
  class FramePlayer {
    constructor(video, fps = 24, onFrame = () => {}) {
      this.video = video; this.fps = fps; this.onFrame = onFrame;
      this.presentedTime = 0; this.seeks = 0; this.lastTarget = 0; this.lastUpdate = 0; this.velocity = 0;
      this.pendingPlay = false; this.running = false; this.blockedUntil = 0; this.requestedFrame = -1;
      this.frameCallback = 0; this.disposed = false; this.lastPresentedAt = performance.now();
      this.pendingFrame = false; this.requestedAt = 0; this.seekingSince = 0; this.abort = new AbortController();
      const r = () => { !video.seeking && video.readyState >= 2 && !video.requestVideoFrameCallback && this.present(video.currentTime); };
      for (const t of ["seeked", "loadeddata", "pause"]) video.addEventListener(t, r, { signal: this.abort.signal });
      if (video.requestVideoFrameCallback) {
        const t = (n, m) => {
          if (this.disposed) return;
          video.seeking || this.present(m.mediaTime);
          this.frameCallback = video.requestVideoFrameCallback(t);
        };
        this.frameCallback = video.requestVideoFrameCallback(t);
      }
    }
    present(e) {
      if (this.disposed) return;
      this.presentedTime = e;
      if (Math.abs(e * this.fps - this.requestedFrame) < 0.5) this.pendingFrame = false;
      this.lastPresentedAt = performance.now();
      this.onFrame(e);
    }
    unlock() {
      this.blockedUntil = 0;
      if (!(this.disposed || this.pendingPlay || this.video.readyState < 1)) this.play(true);
    }
    play(e = false) {
      if (this.pendingPlay) return;
      this.pendingPlay = true;
      this.video.play()
        .then(() => { if (this.disposed || (e && !this.running)) this.video.pause(); })
        .catch(() => { this.blockedUntil = performance.now() + 750; })
        .finally(() => { this.pendingPlay = false; });
    }
    update(e, t = performance.now()) {
      if (this.disposed || !Number.isFinite(e)) return this.presentedTime;
      const n = this.video;
      const r = Number.isFinite(n.duration) ? Math.max(0, n.duration - 1 / this.fps) : e;
      const i = Math.max(0, Math.min(r, e));
      const a = this.lastUpdate ? Math.max(0.008, Math.min(0.15, (t - this.lastUpdate) / 1e3)) : 0;
      const o = a ? (i - this.lastTarget) / a : 0;
      this.velocity += (o - this.velocity) * 0.5;
      this.lastTarget = i; this.lastUpdate = t;
      if (document.hidden || n.readyState < 1) { this.pause(); return this.presentedTime; }
      if (n.seeking) {
        this.seekingSince ||= t;
        if (t - this.seekingSince > 750) {
          this.pause(); this.seekingSince = t; this.requestedAt = t;
          this.requestedFrame = Math.floor(i * this.fps); this.pendingFrame = true; this.seeks++;
          n.currentTime = this.requestedFrame / this.fps;
        }
        return this.presentedTime;
      }
      this.seekingSince = 0;
      if (this.pendingFrame) {
        if (t - this.requestedAt < 100) return this.presentedTime;
        if (n.readyState >= 2) this.present(n.currentTime); else return this.presentedTime;
      }
      if (n.readyState >= 2 && !n.paused && t - this.lastPresentedAt > 80) this.present(Math.floor(n.currentTime * this.fps) / this.fps);
      const s = Math.floor((i + 0.001) * this.fps);
      const c = Math.min(r, s / this.fps);
      const l = i - n.currentTime;
      const u = this.running && l > 1 / this.fps + 0.005;
      if ((this.velocity > 0.08 || u) && o >= -0.001 && t >= this.blockedUntil && n.readyState >= 2) {
        if (l < -1 / this.fps) { this.pause(); return this.presentedTime; }
        this.running = true;
        const rate = Math.max(0.25, Math.min(3, this.velocity + l * 6));
        if (Math.abs(n.playbackRate - rate) > 0.08) n.playbackRate = rate;
        if (n.paused) this.play();
        return this.presentedTime;
      }
      this.pause();
      const d = Math.floor((this.presentedTime + 0.001) * this.fps);
      if ((n.readyState < 2 || s !== d) && (this.requestedFrame !== s || Math.abs(n.currentTime - c) > 1 / this.fps)) {
        this.requestedFrame = s; this.pendingFrame = true; this.requestedAt = t; this.seeks++;
        n.currentTime = n.readyState === 1 && c === 0 ? 0.001 : c;
      }
      return this.presentedTime;
    }
    pause() { this.running = false; this.video.paused || this.video.pause(); }
    reset() {
      this.pause(); this.lastUpdate = 0; this.velocity = 0; this.requestedFrame = -1;
      this.pendingFrame = false; this.seekingSince = 0; this.presentedTime = 0;
    }
    dispose() {
      this.disposed = true; this.pause(); this.abort.abort();
      this.frameCallback && this.video.cancelVideoFrameCallback?.(this.frameCallback);
    }
  }

  // ---------------------------------------------------------------- a film: poster image + video (loop or scrubbed)
  const films = [];
  function Film(el, { name, scrub = false, progress = () => 0, enabled = () => true, onProgress = null }) {
    const video = el.querySelector("video");
    const srcUrl = MEDIA[name];
    let lastPresented = 0;
    let teardown = null;
    let activeKey = null;
    let errBox = null;

    function showError(on) {
      el.dataset.filmFailed = on && !reduced ? "true" : "false";
      if (on && !reduced) {
        el.removeAttribute("aria-hidden");
        if (!errBox) {
          errBox = document.createElement("div");
          errBox.className = "film-error"; errBox.setAttribute("role", "status");
          errBox.innerHTML = "<span>The video couldn’t load.</span><button type=\"button\">Retry video</button>";
          errBox.querySelector("button").addEventListener("click", () => self.retry());
          el.appendChild(errBox);
        }
      } else {
        el.setAttribute("aria-hidden", "true");
        errBox?.remove(); errBox = null;
      }
    }

    function setup(on) {
      el.dataset.mode = reduced ? "poster" : "video";
      if (reduced) return null;
      const e = video;
      e.defaultMuted = true; e.muted = true; e.playsInline = true; e.disableRemotePlayback = true;
      e.setAttribute("muted", ""); e.setAttribute("playsinline", "");
      let visible = false, srcSet = false, disposed = false, failed = false, raf = 0, loadTimer = 0, lastBuf = 0, lastRS = 0;
      let _ = lastPresented, v = 0, b = false;
      const clearT = () => { clearTimeout(loadTimer); loadTimer = 0; };
      const armT = () => {
        clearT();
        if (disposed || !srcSet || e.readyState >= 2) return;
        loadTimer = setTimeout(() => { loadTimer = 0; if (!disposed && srcSet && e.readyState < 2) fail(); }, 15e3);
      };
      const prog = () => {
        if (e.readyState >= 2) { clearT(); return; }
        const t = e.buffered.length ? e.buffered.end(e.buffered.length - 1) : 0;
        if (e.readyState > lastRS || t > lastBuf + 0.01) { lastRS = e.readyState; lastBuf = t; armT(); }
      };
      const player = new FramePlayer(e, 24, () => {
        if (disposed || failed || (scrub && !b && Math.abs(player.presentedTime - _) > 0.25)) return;
        b = true; lastPresented = player.presentedTime; markReady();
        if (scrub && Number.isFinite(e.duration) && e.duration > 0) onProgress?.(Math.min(1, player.presentedTime / e.duration));
      });
      const tick = (n) => {
        raf = 0;
        if (!visible || !on || document.hidden || failed) return;
        if (scrub && e.readyState >= 1 && Number.isFinite(e.duration)) {
          const t = Math.min(progress() * e.duration, e.duration - 0.05);
          const r = v ? Math.min(0.064, (n - v) / 1e3) : 1 / 60;
          v = n;
          _ = t > _ ? Math.min(t, _ + 3 * r, Math.max(_, player.presentedTime + 0.25)) : t;
          player.update(_, n);
        }
        if (scrub) raf = requestAnimationFrame(tick);
      };
      const kick = () => {
        if (!visible || !on || document.hidden || failed) { player.pause(); cancelAnimationFrame(raf); raf = 0; v = 0; return; }
        if (!srcSet) { e.preload = "auto"; e.src = srcUrl; e.load(); srcSet = true; lastRS = 0; lastBuf = 0; armT(); }
        if (scrub) raf ||= requestAnimationFrame(tick); else if (e.paused) e.play().catch(() => {});
      };
      const unlock = () => {
        kick();
        if (!scrub || !visible || !on || !srcSet || failed) return;
        player.unlock();
        if (!disposed && visible && !raf) raf = requestAnimationFrame(tick);
      };
      const loadedData = () => {
        prog();
        if (scrub && progress() > 0.004 && Number.isFinite(e.duration)) { raf ||= requestAnimationFrame(tick); return; }
        markReady();
      };
      function markReady() {
        prog();
        if (disposed || failed) return;
        if (scrub && !b && (typeof e.requestVideoFrameCallback == "function" || Math.abs(e.currentTime - _) > 0.25)) return;
        if (el.isConnected && e.readyState >= 2 && !e.seeking) { el.dataset.ready = "true"; showError(false); }
      }
      const canplay = () => { markReady(); kick(); };
      function fail() {
        clearT(); failed = true; player.pause(); cancelAnimationFrame(raf); raf = 0;
        el.dataset.ready = "false"; showError(true);
      }
      self.retry = () => {
        if (disposed) return;
        srcSet = false; failed = false; b = false; _ = lastPresented; v = 0; player.reset(); showError(false); kick(); unlock();
      };
      const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; kick(); }, { rootMargin: "250px" });
      io.observe(el);
      const gestures = ["pointerdown", "pointerup", "touchend", "keydown"];
      for (const g of gestures) document.addEventListener(g, unlock, { passive: true });
      document.addEventListener("visibilitychange", kick);
      e.addEventListener("canplay", canplay); e.addEventListener("playing", markReady); e.addEventListener("loadeddata", loadedData);
      e.addEventListener("seeked", markReady); e.addEventListener("error", fail); e.addEventListener("progress", prog); e.addEventListener("loadedmetadata", prog);
      return () => {
        disposed = true; clearT(); io.disconnect();
        for (const g of gestures) document.removeEventListener(g, unlock);
        document.removeEventListener("visibilitychange", kick);
        e.removeEventListener("canplay", canplay); e.removeEventListener("playing", markReady); e.removeEventListener("loadeddata", loadedData);
        e.removeEventListener("seeked", markReady); e.removeEventListener("error", fail); e.removeEventListener("progress", prog); e.removeEventListener("loadedmetadata", prog);
        cancelAnimationFrame(raf); player.dispose();
        el.dataset.ready = "false";
        e.removeAttribute("src"); e.load();
      };
    }

    // re-run the setup when the enabled flag or the reduced-motion flag changes (the original's effect dependencies)
    function sync() {
      const on = enabled() && !paused;
      const key = on + "|" + reduced;
      if (key === activeKey) return;
      activeKey = key;
      teardown?.();
      teardown = setup(on);
    }
    function dispose() { teardown?.(); teardown = null; activeKey = null; }
    const self = { sync, dispose, retry() {}, el };
    films.push(self);
    sync();
    return self;
  }

  // ---------------------------------------------------------------- audio (a soft water bed)
  class Audio {
    constructor() { this.context = null; this.gain = null; this.source = null; this.suspendTimer = null; this.disposed = false; this.timer = null; }
    async start() {
      if (this.disposed) return;
      this.suspendTimer && clearTimeout(this.suspendTimer); this.suspendTimer = null;
      if (!this.context) {
        this.context = new AudioContext();
        const e = this.context;
        this.gain = e.createGain(); this.gain.gain.value = 0; this.gain.connect(e.destination);
        const t = e.createBuffer(1, e.sampleRate * 4, e.sampleRate);
        const n = t.getChannelData(0);
        let r = 0;
        for (let i = 0; i < n.length; i++) { r = (r + (Math.random() * 2 - 1) * 0.025) / 1.025; n[i] = r * 2; }
        const f = e.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
        this.source = e.createBufferSource(); this.source.buffer = t; this.source.loop = true;
        this.source.connect(f); f.connect(this.gain); this.source.start();
      }
      await this.context.resume();
      if (this.disposed) return;
      const swell = () => {
        if (!this.context || !this.gain) return;
        const e = this.context.currentTime;
        this.gain.gain.cancelScheduledValues(e);
        this.gain.gain.setValueAtTime(0.03, e);
        this.gain.gain.linearRampToValueAtTime(0.3, e + 1.5);
        this.gain.gain.linearRampToValueAtTime(0.04, e + 3.8);
      };
      swell();
      this.timer && clearInterval(this.timer);
      this.timer = setInterval(swell, 4500);
    }
    stop() {
      if (this.disposed) return;
      this.timer && clearInterval(this.timer); this.timer = null;
      if (this.context && this.gain) {
        const e = this.context.currentTime;
        this.gain.gain.cancelScheduledValues(e);
        this.gain.gain.setTargetAtTime(0, e, 0.1);
        this.suspendTimer && clearTimeout(this.suspendTimer);
        const t = this.context;
        this.suspendTimer = setTimeout(() => { this.suspendTimer = null; t.suspend().catch(() => {}); }, 400);
      }
    }
  }

  // ---------------------------------------------------------------- utility buttons (pause film, sound)
  const utility = $(".dc-utility");
  if (utility) {
    const [pauseBtn, soundBtn] = $$("button", utility);
    let audio = null, audioWanted = false, audioOn = false;
    if (reduced && pauseBtn) pauseBtn.remove();
    pauseBtn?.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.setAttribute("aria-pressed", String(paused));
      pauseBtn.textContent = paused ? "RESUME FILM" : "PAUSE FILM";
      if (paused) { audio?.stop(); audioWanted = false; setSound(false); }
      films.forEach((f) => f.sync());
    });
    const setSound = (on) => {
      audioOn = on;
      if (!soundBtn) return;
      soundBtn.dataset.audioState = on ? "playing" : "off";
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.setAttribute("aria-label", on ? "Turn dive sound off" : "Turn dive sound on");
      soundBtn.textContent = "SOUND " + (on ? "ON" : "OFF");
    };
    soundBtn?.addEventListener("click", async () => {
      if (audioWanted) { audioWanted = false; audio?.stop(); setSound(false); return; }
      audioWanted = true; audio ||= new Audio();
      try {
        await audio.start();
        if (!audioWanted) { audio.stop(); return; }
        setSound(true);
      } catch { audioWanted = false; setSound(false); }
    });
    addEventListener("pagehide", () => { audio && (audio.disposed = true, audio.source?.stop(), audio.context?.close().catch(() => {})); });
  }

  // ---------------------------------------------------------------- hero
  Film($(".hero .motion-film"), { name: "boat" });

  // ---------------------------------------------------------------- gear check (3D kit, images as the fallback)
  const gearSection = $("#gear");
  const gearVisual = $(".gear-visual");
  const gearParts = $$(".gear-part", gearVisual);
  const checks = $$(".gear-check");
  let gearIndex = -1;
  let gearCtl = null;
  let gearProgress = 0;
  function gearFrame(p) {
    gearVisual.style.setProperty("--gear-progress", String(p));
    gearParts.forEach((el, i) => el.style.setProperty("--part", String(Math.min(1, Math.max(0, p * 6 - i + 0.6)))));
    const s = Math.min(5, Math.floor(p * 6));
    if (gearIndex === s) return;
    gearIndex = s;
    $(".status-light").className = s === 5 ? "status-light ready" : "status-light";
    $(".gear-status").lastChild.textContent = s === 5 ? "SYSTEM READY" : "PRE-DIVE CHECK";
    $(".gear-focus span").textContent = "0" + Math.min(s + 1, 5) + " / 05";
    $(".gear-focus strong").textContent = s === 5 ? "ALL SYSTEMS GO" : GEAR_FOCUS[s];
    checks.forEach((c, n) => {
      c.className = "gear-check " + (n <= s ? "checked" : "") + " " + (n === s ? "current" : "");
      c.querySelector(".check-symbol").textContent = n <= s ? "✓" : "+";
    });
  }
  gearFrame(0);
  track(gearSection, (p) => {
    gearProgress = p;
    gearCtl && gearVisual.dataset.gearMode === "3d" ? gearCtl.update(p) : gearFrame(p);
  });
  (function gearScene() {
    const canvas = $(".gear-canvas");
    if (reduced) { gearVisual.dataset.gearMode = "fallback"; gearFrame(gearProgress); return; }
    let disposed = false, loading = false, visible = false, lost = false, ctl = null;
    const abort = new AbortController();
    const fallback = () => { gearVisual.dataset.gearMode = "fallback"; gearFrame(gearProgress); };
    const load = async () => {
      if (loading || disposed) return;
      loading = true;
      try {
        const mod = await import(RENDERER);
        if (disposed) return;
        ctl = await mod.createGearScene(canvas, gearProgress, gearFrame, abort.signal, MODEL);
        if (disposed) { ctl.dispose(); return; }
        gearCtl = ctl;
        ctl.update(gearProgress);
        ctl.setActive(visible && !document.hidden);
        gearVisual.dataset.gearMode = "3d";
      } catch (err) {
        if (!disposed) { fallback(); console.warn("Gear 3D unavailable; using equipment images.", err); }
      }
    };
    const io1 = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io1.disconnect(); load(); } }, { rootMargin: "800px" });
    const io2 = new IntersectionObserver(([e]) => { visible = e.isIntersecting; ctl?.setActive(visible && !lost && !document.hidden); });
    io1.observe(gearSection); io2.observe(gearSection);
    document.addEventListener("visibilitychange", () => ctl?.setActive(visible && !lost && !document.hidden));
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; ctl?.setActive(false); fallback(); });
    canvas.addEventListener("webglcontextrestored", () => { if (disposed) return; lost = false; ctl?.dispose(); ctl = null; gearCtl = null; loading = false; load(); });
  })();

  // ---------------------------------------------------------------- dive session (entry film + dive sites)
  const session = $("#dive-session");
  const sessionEntry = $(".session-entry");
  const sessionWorld = $(".session-world");
  const sessionWater = $(".session-water");
  const entrySticky = $(".entry-sticky");
  const entryDepth = $(".entry-depth");
  let sessionProgress = 0;     // r
  let entryPresented = 0;      // a
  let entryShown = 0;          // l: the entry film's presented progress
  let entryOwn = 0;            // s: own track in simple mode
  let mix = 0;                 // u
  let siteIndex = 0;
  let encounterOpen = false;
  let logged = [];
  let loggedReady = false;
  try {
    const v = JSON.parse(localStorage.getItem("tbd-x") || "[]");
    if (Array.isArray(v)) logged = v.filter((x) => typeof x == "string" && SITES.some((s) => s.id === x));
  } catch {}
  loggedReady = true;

  const entryInput = () => (simple ? entryOwn : Math.min(1, sessionProgress / H));
  const entryFilm = Film($(".motion-film", entrySticky), {
    name: "entry", scrub: true,
    progress: () => (reduced ? entryInput() : entryInput()),
    enabled: () => simple || entryPresented < 0.99 || sessionProgress < H,
    onProgress: (p) => { entryShown = p; entryPresented = p; renderSession(); },
  });
  // the poster of the entry film is the boat frame, as in the original
  $("img", entrySticky).src = "media/boat.webp";
  const entryEl = $("#entry");
  track(entryEl, (p) => { entryOwn = p; renderSession(); }, () => simple);

  // dive sites
  const diveSticky = $(".dive-sticky");
  const siteFilms = $$(".site-film", diveSticky);
  const captionBox = $(".site-caption");
  const encounterBtn = $(".encounter");
  const tabBtns = $$(".site-tabs button");
  const hud = { depth: $(".hud-depth b"), time: $(".dive-computer > div:nth-child(2) strong"), air: $(".dive-computer > div:nth-child(3) b"), fill: $(".depth-fill") };
  const bottomRight = $(".dive-bottom span:last-child");
  let activeSiteFilm = null;

  function siteFilmHTML(i) {
    return `<img src="${IMG(SITES[i].id)}" sizes="100vw" alt="" loading="lazy">`;
  }
  function renderSiteFilms() {
    activeSiteFilm?.dispose();
    const k = films.indexOf(activeSiteFilm); if (k >= 0) films.splice(k, 1);
    activeSiteFilm = null;
    siteFilms.forEach((box, i) => {
      if (i === siteIndex) {
        box.className = "site-film active"; box.removeAttribute("aria-hidden");
        const s = SITES[i];
        box.innerHTML = `<div class="motion-film" data-film-failed="false" data-mode="video" aria-hidden="true"><img src="${IMG(s.id)}" sizes="100vw" alt="" loading="lazy" fetchpriority="auto"><video autoplay playsinline loop preload="none" disablepictureinpicture muted></video></div>`;
        activeSiteFilm = Film($(".motion-film", box), { name: s.id, enabled: () => simple || mix > 0.4 });
      } else {
        box.className = "site-film"; box.setAttribute("aria-hidden", "true");
        box.innerHTML = siteFilmHTML(i);
      }
    });
  }
  function renderCaption() {
    const s = SITES[siteIndex];
    captionBox.innerHTML = `<span class="eyebrow"><span class="accent">${s.number}</span> / ${s.location}</span><h2 id="dive-title">${s.name}</h2><p>${s.label}</p><div class="site-details"><span>${s.d1}</span><span>${s.d2}</span></div>`;
    
    
    
    tabBtns.forEach((b, i) => { b.className = i === siteIndex ? "active" : ""; b.setAttribute("aria-pressed", String(i === siteIndex)); });
  }
  function renderEncounter() {
    const s = SITES[siteIndex];
    encounterBtn.classList.toggle("open", encounterOpen);
    encounterBtn.setAttribute("aria-expanded", String(encounterOpen));
    $(".encounter-popup")?.remove();
    if (encounterOpen) {
      const d = document.createElement("div");
      d.id = "encounter-details"; d.className = "encounter-popup"; d.style.left = s.x; d.style.top = s.y;
      d.innerHTML = `<button class="encounter-dismiss" aria-label="Close observation">×</button><span class="eyebrow">ENCOUNTERS</span><strong>${s.encounter}</strong><span>SPOTTED AT ${s.spotted}</span><button class="text-button">${logged.includes(s.id) ? "✓ ADDED TO YOUR LOG" : "ADD TO YOUR LOG +"} </button>`;
      $(".encounter-dismiss", d).addEventListener("click", () => { setEncounter(false); encounterBtn.focus({ preventScroll: true }); });
      $(".text-button", d).addEventListener("click", () => { if (!logged.includes(s.id)) logged = [...logged, s.id]; saveLogged(); renderEncounter(); renderLogged(); });
      encounterBtn.after(d);
    }
  }
  function setEncounter(on) { encounterOpen = false; renderEncounter(); }
  function saveLogged() { if (loggedReady) try { localStorage.setItem("tbd-x", JSON.stringify(logged)); } catch {} }
  function renderLogged() {
    
  }
  function setSite(i) { siteIndex = i; encounterOpen = false; renderSiteFilms(); renderCaption(); renderEncounter(); }
  siteFilms.forEach(() => {});
  renderSiteFilms(); renderCaption(); renderLogged();

  encounterBtn.addEventListener("click", () => setEncounter(!encounterOpen));
  $("#sites").addEventListener("keydown", (e) => { if (e.key === "Escape" && encounterOpen) { setEncounter(false); encounterBtn.focus({ preventScroll: true }); } });

  function gotoSite(e) {
    encounterOpen = false; renderEncounter();
    if (simple) {
      setSite(e); siteIndex = e;
      hud.depth.textContent = SITES[e].max.toFixed(1); hud.air.textContent = "142"; hud.time.textContent = "21:43";
      return;
    }
    scrollToSite(e);
  }
  function scrollToSite(e = 0) {
    const n = $("#dive-session");
    if (!n) return;
    if (shortMQ.matches) { $("#sites")?.scrollIntoView({ behavior: "auto" }); return; }
    const r = n.getBoundingClientRect().top + scrollY;
    scrollTo({ top: r + (n.offsetHeight - innerHeight) * (H + (1 - H) * ((e + 0.12) / 3)), behavior: reducedMQ.matches ? "auto" : "smooth" });
  }
  // tab buttons (touch taps resolve on pointerup so a scroll gesture never triggers one)
  let touchTap = null, lastTouchTap = null;
  tabBtns.forEach((btn, t) => {
    btn.addEventListener("pointerdown", (e) => { lastTouchTap = null; touchTap = e.pointerType === "touch" && e.isPrimary ? { id: e.pointerId, index: t, x: e.clientX, y: e.clientY } : null; });
    btn.addEventListener("pointermove", (e) => { if (touchTap && Math.hypot(e.clientX - touchTap.x, e.clientY - touchTap.y) > 8) touchTap = null; });
    btn.addEventListener("pointercancel", () => { touchTap = null; });
    btn.addEventListener("pointerup", (e) => {
      const n = touchTap; touchTap = null;
      if (!n || n.id !== e.pointerId || n.index !== t || Math.hypot(e.clientX - n.x, e.clientY - n.y) > 8) return;
      lastTouchTap = { index: t, at: performance.now() }; gotoSite(t);
    });
    btn.addEventListener("click", (e) => {
      const n = lastTouchTap; lastTouchTap = null;
      if (e.detail > 0 && n?.index === t && performance.now() - n.at < 500) return;
      gotoSite(t);
    });
  });
  $(".entry-bottom .text-button").addEventListener("click", (e) => { e.preventDefault(); scrollToSite(0); });

  function updateHud(p) {
    if (simple) return;
    const n = Math.min(2, Math.floor(p * 3));
    if (n !== siteIndex) setSite(n);
    const r = p * 3 - n;
    hud.depth.textContent = (n === 0 && p < 0.1 ? 6 + p * 106 : SITES[n].max - 1.8 + r * 1.8).toFixed(1);
    hud.air.textContent = String(Math.round(200 - p * 82));
    const t = Math.floor(p * 45 * 60);
    hud.time.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    hud.fill.style.transform = `scaleY(${0.24 + p * 0.68})`;
  }

  function renderSession() {
    const c = reduced ? sessionProgress : sessionProgress < H || entryPresented < 0.99 ? entryPresented * H : sessionProgress;
    const l = clamp01((c - 0.21) / 0.07);
    mix = l * l * (3 - 2 * l);
    session.style.setProperty("--dive-mix", String(mix));
    sessionWater.style.opacity = String(Math.sin(l * Math.PI) * 0.18);
    sessionEntry.inert = !simple && mix >= 0.4;
    sessionWorld.inert = !simple && mix <= 0.4;
    sessionWorld.dataset.entry = String(mix < 1);
    // entry section
    const e = reduced ? entryInput() : entryShown;
    entrySticky.style.setProperty("--entry", String(e));
    entrySticky.style.setProperty("--splash", String(Math.max(0, 1 - Math.abs(e - 0.47) * 9)));
    entryDepth.querySelector("strong").firstChild.textContent = (Math.max(0, e - 0.5) * 12).toFixed(1).padStart(4, "0");
    entryDepth.lastElementChild.textContent = e > 0.54 ? "WELCOME BELOW" : "READY FOR ENTRY";
    entryFilm.sync(); activeSiteFilm?.sync();
    updateHud(Math.max(0, (c - H) / (1 - H)));
  }
  track(session, (p) => { sessionProgress = p; renderSession(); });
  renderSession();

  // ---------------------------------------------------------------- surface
  const surface = $("#surface");
  const surfaceFilmEl = $(".motion-film", surface);
  let surfaceInput = 0, surfaceShown = 0, surfaceDone = null;
  const surfaceFilm = Film(surfaceFilmEl, {
    name: "surface-return", scrub: true,
    progress: () => surfaceInput,
    onProgress: (p) => { surfaceShown = p; renderSurface(); },
  });
  function renderSurface() {
    const c = (reduced ? surfaceInput : surfaceShown) >= 0.82;
    if (c === surfaceDone) return;
    surfaceDone = c;
    $("img", surfaceFilmEl).src = c ? "media/surface-return.webp" : "media/surface-start.webp";
    $(".surface-top .eyebrow").textContent = c ? "↑ 00.0 M / AT THE SURFACE" : "↑ TOWARD THE SURFACE";
    const copy = $(".surface-copy");
    copy.innerHTML = `<span class="surface-complete ${c ? "complete" : "ascending"}"><i></i>${c ? "DIVE COMPLETE" : "RETURNING TO THE SURFACE"}</span><h2 id="surface-title">${c ? "BACK AT<br>THE SURFACE." : "RETURNING<br>TO THE SURFACE."}</h2>` +
      (c ? `<p class="surface-next">READY FOR ANOTHER ONE?</p><button class="button button-accent">INQUIRE<svg class="arrow-icon " viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" fill="none" stroke="currentColor" stroke-width="1.6"></path></svg></button><a class="surface-replay" href="#top">REPLAY THE DIVE ↑</a>` : "");
    $(".surface-copy .button")?.addEventListener("click", () => location.assign("/inquiry"));
  }
  track(surface, (p) => { surfaceInput = p; renderSurface(); });
  renderSurface();

  // ---------------------------------------------------------------- media-query changes
  const onMQ = () => {
    const was = reduced + "|" + simple;
    reduced = reducedMQ.matches; simple = shortMQ.matches;
    if (was === reduced + "|" + simple) return;
    films.forEach((f) => f.sync()); renderSession();
  };
  reducedMQ.addEventListener("change", onMQ); shortMQ.addEventListener("change", onMQ);
  addEventListener("dc-browse-without-film", () => { reduced = true; films.forEach((f) => f.sync()); renderSession(); });
})();
