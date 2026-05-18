const themeToggle = document.querySelector("#theme-toggle");

function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  if (themeToggle) themeToggle.setAttribute("aria-pressed", String(next === "light"));
  try { localStorage.setItem("theme", next); } catch (_) {}
}

const storedTheme = (() => {
  try { return localStorage.getItem("theme"); } catch (_) { return null; }
})();
applyTheme(storedTheme || "dark");

let audioCtx = null;
let userHasInteracted = false;

function ensureAudio() {
  if (!userHasInteracted) return null;
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

["pointerdown", "keydown", "touchstart"].forEach((evt) => {
  window.addEventListener(evt, () => { userHasInteracted = true; }, { once: true, capture: true });
});

function playToggleSound(toLight) {
  try {
    if (!ensureAudio()) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    const startFreq = toLight ? 520 : 720;
    const endFreq = toLight ? 880 : 360;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (_) {}
}

let lastHoverSound = 0;
function playOpenSound() {
  if (!ensureAudio()) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(960, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  } catch (_) {}
}

function playCloseSound() {
  if (!ensureAudio()) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  } catch (_) {}
}

function playExpandSound(opening) {
  if (!ensureAudio()) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    const startFreq = opening ? 420 : 760;
    const endFreq = opening ? 760 : 320;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  } catch (_) {}
}

function playHoverSound() {
  if (!ensureAudio()) return;
  const now = performance.now();
  if (now - lastHoverSound < 70) return;
  lastHoverSound = now;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1180, t);
    osc.frequency.exponentialRampToValueAtTime(1480, t + 0.04);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.04, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch (_) {}
}

document.querySelectorAll(".list-section li").forEach((li) => {
  li.addEventListener("pointerenter", playHoverSound);
  const link = li.querySelector("a");
  if (!link) return;
  li.style.cursor = "pointer";
  li.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    link.click();
  });
});

(function initCursorTooltip() {
  const items = document.querySelectorAll(".list-section li[data-role], [data-tooltip]");
  if (!items.length) return;
  const tip = document.createElement("div");
  tip.className = "role-tooltip";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);

  let active = null;
  let x = 0;
  let y = 0;
  let raf = null;

  function placeTip() {
    raf = null;
    tip.style.transform = "translate3d(" + (x + 16) + "px, " + (y + 18) + "px, 0)";
  }

  function textFor(el) {
    return el.dataset.tooltip || el.dataset.role || "";
  }

  items.forEach((el) => {
    el.addEventListener("pointerenter", (e) => {
      const text = textFor(el);
      if (!text) return;
      active = el;
      tip.textContent = text;
      x = e.clientX;
      y = e.clientY;
      placeTip();
      tip.classList.add("is-visible");
    });
    el.addEventListener("pointermove", (e) => {
      if (active !== el) return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(placeTip);
    });
    el.addEventListener("pointerleave", () => {
      if (active === el) {
        tip.classList.remove("is-visible");
        active = null;
      }
    });
  });
})();

(function initIntroMore() {
  const openBtn = document.querySelector("#intro-more-toggle");
  const closeBtn = document.querySelector("#intro-less-toggle");
  const more = document.querySelector("#intro-more");
  if (!openBtn || !more) return;

  function open() {
    playExpandSound(true);
    more.hidden = false;
    more.classList.add("is-open");
    openBtn.setAttribute("aria-expanded", "true");
    openBtn.hidden = true;
  }

  function close() {
    playExpandSound(false);
    more.hidden = true;
    more.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.hidden = false;
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
})();

(function scrambleTitle() {
  const h1 = document.querySelector(".intro h1");
  if (!h1) return;
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const palette = ["#ff3b6b", "#ff8a00", "#ffd60a", "#06d6a0", "#00b4ff", "#7a4cff", "#ff5ecf"];
  const rand = () => chars[(Math.random() * chars.length) | 0];
  const randColor = () => palette[(Math.random() * palette.length) | 0];

  const segments = [];
  Array.from(h1.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const wrap = document.createElement("span");
      wrap.style.color = "inherit";
      wrap.textContent = node.textContent;
      h1.replaceChild(wrap, node);
      segments.push({ node: wrap, text: wrap.textContent });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      segments.push({ node, text: node.textContent });
    }
  });

  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
  const duration = 3800;
  const tickInterval = 140;
  const colorChance = 0.22;
  const start = performance.now();
  let lastTick = start;
  const charCache = new Array(totalChars).fill("");
  const colorCache = new Array(totalChars).fill(null);

  const revealOrder = [];
  for (let i = 0; i < totalChars; i++) revealOrder.push(i);
  for (let i = revealOrder.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
  }
  const revealedAt = new Array(totalChars).fill(Infinity);
  revealOrder.forEach((idx, order) => {
    revealedAt[idx] = (order / totalChars) * duration;
  });

  function escapeChar(c) {
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === "&") return "&amp;";
    return c;
  }

  function frame(now) {
    const elapsed = now - start;
    const tick = now - lastTick >= tickInterval;
    if (tick) lastTick = now;
    let globalIdx = 0;
    let done = true;
    segments.forEach((seg) => {
      let out = "";
      for (let i = 0; i < seg.text.length; i++) {
        const original = seg.text[i];
        const isStatic = original === " " || original === "," || original === ".";
        if (elapsed >= revealedAt[globalIdx] || isStatic) {
          out += escapeChar(original);
        } else {
          if (tick || !charCache[globalIdx]) {
            charCache[globalIdx] = rand();
            colorCache[globalIdx] = Math.random() < colorChance ? randColor() : null;
          }
          const ch = /[A-Z]/.test(original) ? charCache[globalIdx].toUpperCase() : charCache[globalIdx];
          out += colorCache[globalIdx]
            ? '<span style="color:' + colorCache[globalIdx] + '">' + ch + "</span>"
            : ch;
          done = false;
        }
        globalIdx += 1;
      }
      seg.node.innerHTML = out;
    });
    if (!done) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    playToggleSound(next === "light");
    applyTheme(next);
  });
}

function initFeedbackSlider(slider) {
  const items = Array.from(slider.querySelectorAll(".feedback"));
  if (!items.length) return;

  const dotsHost = slider.querySelector(".feedback-dots");
  const countEl = slider.querySelector(".feedback-count b");
  const totalEl = slider.querySelector(".feedback-count");
  const modeBtn = slider.querySelector('[data-action="toggle"]');
  const modeLabel = modeBtn && modeBtn.querySelector(".mode-label");
  const prevBtn = slider.querySelector('[data-action="prev"]');
  const nextBtn = slider.querySelector('[data-action="next"]');

  const dots = items.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "Show testimonial " + (i + 1));
    b.addEventListener("click", () => {
      go(i);
      setMode("manual");
    });
    dotsHost.appendChild(b);
    return b;
  });

  if (totalEl) {
    totalEl.lastChild.textContent = " / " + String(items.length).padStart(2, "0");
  }

  let index = items.findIndex((el) => el.classList.contains("is-active"));
  if (index < 0) index = 0;
  let mode = slider.dataset.mode === "manual" ? "manual" : "auto";
  let timer = null;
  const INTERVAL = 11000;

  items.forEach((el) => {
    if (!el.dataset.originalHtml) el.dataset.originalHtml = el.innerHTML;
  });

  function render() {
    items.forEach((el, i) => el.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
    if (countEl) countEl.textContent = String(index + 1).padStart(2, "0");
    const active = items[index];
    if (active) scrambleFeedback(active);
  }

  function scrambleFeedback(article) {
    article.innerHTML = article.dataset.originalHtml;
    const duration = 2400;
    const tickInterval = 130;
    const opacityTickInterval = 65;
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const rand = () => chars[(Math.random() * chars.length) | 0];
    const randOpacity = () => (0.18 + Math.random() * 0.78).toFixed(2);

    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.parentElement) return NodeFilter.FILTER_REJECT;
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const targets = [];
    let nd;
    while ((nd = walker.nextNode())) {
      const wrap = document.createElement("span");
      wrap.style.color = "inherit";
      wrap.textContent = nd.nodeValue;
      nd.parentElement.replaceChild(wrap, nd);
      targets.push({ node: wrap, text: wrap.textContent });
    }
    const total = targets.reduce((s, t) => s + t.text.length, 0);
    if (!total) return;
    const start = performance.now();
    let lastTick = start;
    let lastOpacityTick = start;
    const charCache = new Array(total).fill("");
    const opacityCache = new Array(total).fill("0.5");
    const order = [];
    for (let i = 0; i < total; i++) order.push(i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    const revealedAt = new Array(total).fill(Infinity);
    order.forEach((idx, k) => { revealedAt[idx] = (k / total) * duration; });

    function esc(c) {
      if (c === "<") return "&lt;";
      if (c === ">") return "&gt;";
      if (c === "&") return "&amp;";
      return c;
    }

    function frame(now) {
      if (!article.classList.contains("is-active")) {
        targets.forEach((seg) => { seg.node.textContent = seg.text; });
        return;
      }
      const elapsed = now - start;
      const tick = now - lastTick >= tickInterval;
      const opacityTick = now - lastOpacityTick >= opacityTickInterval;
      if (tick) lastTick = now;
      if (opacityTick) lastOpacityTick = now;
      let gi = 0;
      let done = true;
      targets.forEach((seg) => {
        let out = "";
        for (let i = 0; i < seg.text.length; i++) {
          const original = seg.text[i];
          const isStatic = original === " " || original === "," || original === "." || original === "—" || original === "·";
          if (elapsed >= revealedAt[gi] || isStatic) {
            out += esc(original);
          } else {
            if (tick || !charCache[gi]) charCache[gi] = rand();
            if (opacityTick || !opacityCache[gi]) opacityCache[gi] = randOpacity();
            const ch = /[A-Z]/.test(original) ? charCache[gi].toUpperCase() : charCache[gi];
            out += '<span style="opacity:' + opacityCache[gi] + '">' + ch + "</span>";
            done = false;
          }
          gi += 1;
        }
        seg.node.innerHTML = out;
      });
      if (!done) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function go(i) {
    index = (i + items.length) % items.length;
    render();
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, INTERVAL);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function setMode(m) {
    mode = m === "manual" ? "manual" : "auto";
    slider.dataset.mode = mode;
    if (modeBtn) modeBtn.setAttribute("aria-pressed", String(mode === "auto"));
    if (modeLabel) modeLabel.textContent = mode === "auto" ? "Auto" : "Manual";
    if (mode === "auto") startAuto(); else stopAuto();
  }

  prevBtn && prevBtn.addEventListener("click", () => { prev(); setMode("manual"); });
  nextBtn && nextBtn.addEventListener("click", () => { next(); setMode("manual"); });
  modeBtn && modeBtn.addEventListener("click", () => setMode(mode === "auto" ? "manual" : "auto"));

  slider.addEventListener("mouseenter", () => { if (mode === "auto") stopAuto(); });
  slider.addEventListener("mouseleave", () => { if (mode === "auto") startAuto(); });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else if (mode === "auto") startAuto();
  });

  render();
  setMode(mode);
}

document.querySelectorAll(".feedback-slider").forEach(initFeedbackSlider);

(function initProjectSlideshow() {
  const portrait = document.querySelector(".portrait");
  const slideshow = portrait && portrait.querySelector(".project-slideshow");
  if (!slideshow) return;

  const stage = slideshow.querySelector(".project-stage");
  const dotsHost = slideshow.querySelector(".project-dots");
  const countEl = slideshow.querySelector(".project-count b");
  const totalEl = slideshow.querySelector(".project-count");
  const closeBtn = slideshow.querySelector(".project-close");
  const prevBtn = slideshow.querySelector(".project-prev");
  const nextBtn = slideshow.querySelector(".project-next");
  const modeBtn = slideshow.querySelector(".project-mode");
  const modeLabel = modeBtn && modeBtn.querySelector(".mode-label");
  const titleEl = slideshow.querySelector(".project-title");
  const roleEl = slideshow.querySelector(".project-role");
  const infoBtn = slideshow.querySelector(".project-info-btn");
  const infoPanel = slideshow.querySelector(".project-info-panel");
  const infoText = slideshow.querySelector(".project-info-text");

  const projects = {
    dotfile: {
      title: "Dotfile",
      role: "Founder Senior Product Designer",
      info: "At Dotfile I design intelligent, trustworthy experiences for our AI-powered compliance platform, helping businesses manage KYC, KYB, and AML with clarity and confidence. My work focuses on transforming complex, data-heavy workflows into simple, human-centered interfaces where trust and usability meet innovation.",
    },
    lemlist: {
      title: "lemlist",
      role: "Head of Design",
      info: "As Head of Design at lempire, I led the design vision across multiple SaaS products, including lemlist, lemcal, lemwarm, and Taplio. I managed a team of +8 designers, driving innovation in UX/UI to create cohesive, user-friendly experiences. My focus was on building scalable design systems, enhancing product usability, and aligning the design strategy with business objectives. I also played a key role in recruitment and team development, ensuring that our design processes were optimized for both creativity and efficiency. One of my most significant achievements was leading the unification of lempire’s diverse product suite into a single, integrated platform.",
    },
    cocolabs: {
      title: "Cocolabs",
      role: "Lead Product Designer",
      info: "As Product Design Leader at Cocolabs, I was responsible for driving the design strategy and execution across the company’s innovative service marketplace platform. I led a team of designers to deliver top-notch user experiences, focusing on creating intuitive interfaces and enhancing the overall user journey. My role involved close collaboration with product, engineering, and business teams to ensure alignment between design solutions and company objectives.",
    },
    xxii: {
      title: "XXII",
      role: "Founder Product Designer",
      info: "At XXII, I worked as a Product Designer, focusing on designing cutting-edge solutions for augmented reality and AI-powered platforms. I was involved in creating innovative user interfaces that merged advanced technology with practical, user-centered design principles. Collaborating with cross-functional teams, I ensured that the product designs were not only visually appealing but also highly functional and intuitive for end-users.",
    },
    apple: {
      title: "Apple",
      role: "In-Store Guest Trainer",
      info: "During my time at Apple, I served as an In-Store Guest Trainer, where I was responsible for delivering engaging training sessions on Apple products and services to both customers and internal teams. In addition to my training role, I worked as a technician, sales specialist, and product expert, providing exceptional customer service and in-depth technical support.",
    },
    buska: {
      title: "Buska",
      role: "Side Project · Web",
      info: "Find promising leads before anyone starts searching for them.",
    },
    "blur-and-colors": { title: "Blur and colors", role: "Digital art", folder: "blur", info: "A series exploring soft focus, color fields, and the moment where shapes start to dissolve into pure light." },
    minimal: { title: "Minimal", role: "Digital art", info: "Strict reduction: a few shapes, a few lines, a lot of breathing room." },
    splatters: { title: "Splatters", role: "Digital art", info: "Controlled chaos — drips, splashes, and accidents shaped into composition." },
    "flower-beauty": { title: "Flower beauty", role: "Digital art", info: "Botanical close-ups treated with the patience of a still life." },
    horses: { title: "Horses", role: "Digital art", info: "Motion studies and portraits of the most photogenic mammal." },
    "oil-painting": { title: "Oil painting", role: "Digital art", info: "Digital surfaces pretending to be canvas — thick strokes, slow tempo." },
  };

  const INTERVAL = 4500;
  let slides = [];
  let dots = [];
  let index = 0;
  let mode = "auto";
  let timer = null;
  const cache = {};

  function probeImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function loadGallery(folder, max = 15) {
    if (cache[folder]) return cache[folder];
    const exts = ["jpg", "jpeg", "png", "webp"];
    const candidates = [];
    for (let i = 0; i <= max; i++) {
      exts.forEach((ext) => candidates.push("./assets/" + folder + "/" + i + "." + ext));
    }
    const checks = await Promise.all(candidates.map(probeImage));
    const seen = new Set();
    const found = [];
    candidates.forEach((url, i) => {
      if (!checks[i]) return;
      const m = url.match(/\/(\d+)\.[^/]+$/);
      const key = m ? m[1] : url;
      if (seen.has(key)) return;
      seen.add(key);
      found.push(url);
    });
    cache[folder] = found;
    return found;
  }

  function buildSlides(urls) {
    stage.innerHTML = "";
    dotsHost.innerHTML = "";
    slides = urls.map((url, i) => {
      const div = document.createElement("div");
      div.className = "project-slide";
      div.style.backgroundImage = "url(\"" + url + "\")";
      if (i === 0) div.classList.add("is-active");
      stage.appendChild(div);
      return div;
    });
    dots = urls.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Slide " + (i + 1));
      b.addEventListener("click", () => { go(i); setMode("manual"); });
      dotsHost.appendChild(b);
      return b;
    });
    index = 0;
    if (totalEl) totalEl.lastChild.textContent = " / " + String(urls.length).padStart(2, "0");
    render();
  }

  function render() {
    slides.forEach((el, i) => el.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
    if (countEl) countEl.textContent = String(index + 1).padStart(2, "0");
  }

  function go(i) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    render();
  }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function startAuto() { stopAuto(); timer = setInterval(next, INTERVAL); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  function setMode(m) {
    mode = m === "manual" ? "manual" : "auto";
    slideshow.dataset.mode = mode;
    if (modeBtn) modeBtn.setAttribute("aria-pressed", String(mode === "auto"));
    if (modeLabel) modeLabel.textContent = mode === "auto" ? "Auto" : "Manual";
    if (mode === "auto") startAuto(); else stopAuto();
  }

  function markActive(key) {
    document.querySelectorAll(".is-project-active").forEach((el) => el.classList.remove("is-project-active"));
    document.querySelectorAll('[data-project="' + key + '"]').forEach((el) => {
      el.classList.add("is-project-active");
      const li = el.closest("li");
      if (li) li.classList.add("is-project-active");
    });
  }

  function clearActive() {
    document.querySelectorAll(".is-project-active").forEach((el) => el.classList.remove("is-project-active"));
  }

  function silentCloseVideo() {
    if (!portrait.classList.contains("is-video")) return;
    if (videoIframe) videoIframe.src = "";
    portrait.classList.remove("is-video");
    if (videoPlayer) videoPlayer.hidden = true;
  }

  const healthPanel = portrait.querySelector(".health-stats");
  const healthCloseBtn = healthPanel && healthPanel.querySelector(".health-close");

  function silentCloseHealth() {
    if (!portrait.classList.contains("is-health")) return;
    portrait.classList.remove("is-health");
    if (healthPanel) healthPanel.hidden = true;
  }

  function openHealth() {
    if (!healthPanel) return;
    silentCloseVideo();
    silentCloseProjectIfAny();
    healthPanel.hidden = false;
    portrait.classList.add("is-health");
  }

  function silentCloseProjectIfAny() {
    if (!portrait.classList.contains("is-project")) return;
    stopAuto();
    portrait.classList.remove("is-project");
    clearActive();
    if (slideshow) slideshow.hidden = true;
  }

  if (healthCloseBtn) {
    healthCloseBtn.addEventListener("click", () => {
      playCloseSound();
      silentCloseHealth();
    });
  }

  const bpmPill = document.querySelector("#bpm-widget");
  if (bpmPill) {
    bpmPill.setAttribute("role", "button");
    bpmPill.setAttribute("tabindex", "0");
    bpmPill.addEventListener("click", () => {
      playOpenSound();
      openHealth();
    });
    bpmPill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playOpenSound();
        openHealth();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (portrait.classList.contains("is-health") && e.key === "Escape") {
      playCloseSound();
      silentCloseHealth();
    }
  });

  async function open(key) {
    const proj = projects[key];
    if (!proj) return;
    let urls = await loadGallery(proj.folder || key);
    if (key === "buska") urls = urls.slice().reverse();
    if (!urls.length) {
      console.warn("No images found in ./assets/" + key + "/ (expected 1.jpg, 2.jpg, ...)");
      return;
    }
    silentCloseVideo();
    silentCloseHealth();
    if (titleEl) titleEl.textContent = proj.title;
    if (roleEl) roleEl.textContent = proj.role;
    if (infoText) infoText.textContent = proj.info || "";
    setInfo(true);
    buildSlides(urls);
    slideshow.hidden = false;
    portrait.classList.add("is-project");
    markActive(key);
    setMode("auto");
  }

  function setInfo(open) {
    if (!infoPanel || !infoBtn) return;
    if (open) {
      infoPanel.hidden = false;
      infoBtn.setAttribute("aria-expanded", "true");
    } else {
      infoPanel.hidden = true;
      infoBtn.setAttribute("aria-expanded", "false");
    }
  }

  function close() {
    playCloseSound();
    stopAuto();
    portrait.classList.remove("is-project");
    clearActive();
    setTimeout(() => { slideshow.hidden = true; }, 280);
  }

  document.querySelectorAll("[data-project]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      playOpenSound();
      open(el.dataset.project);
    });
  });

  // Video player
  const videoPlayer = portrait.querySelector(".video-player");
  const videoIframe = videoPlayer && videoPlayer.querySelector("iframe");
  const videoFrame = videoPlayer && videoPlayer.querySelector(".video-frame");
  const videoClose = videoPlayer && videoPlayer.querySelector(".video-close");
  const videoInfoBtn = videoPlayer && videoPlayer.querySelector(".video-info-btn");
  const videoInfoPanel = videoPlayer && videoPlayer.querySelector(".video-info-panel");
  const videoSoundBtn = videoPlayer && videoPlayer.querySelector(".video-sound-btn");
  const videoFeatureTag = videoPlayer && videoPlayer.querySelector(".video-feature-tag");

  function setVideoMuted(muted) {
    if (!videoIframe || !videoIframe.contentWindow) return;
    const cmd = muted ? "mute" : "unMute";
    try {
      videoIframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: cmd, args: [] }), "*");
    } catch (_) {}
    if (videoSoundBtn) videoSoundBtn.dataset.muted = String(muted);
  }

  if (videoSoundBtn) {
    videoSoundBtn.addEventListener("click", () => {
      const muted = videoSoundBtn.dataset.muted === "true";
      setVideoMuted(!muted);
    });
  }
  if (videoInfoBtn) {
    videoInfoBtn.addEventListener("click", () => {
      const expanded = videoInfoBtn.getAttribute("aria-expanded") === "true";
      playExpandSound(!expanded);
      videoInfoBtn.setAttribute("aria-expanded", String(!expanded));
      if (videoInfoPanel) videoInfoPanel.hidden = expanded;
    });
  }
  const videoAspect = 16 / 9;

  function fitVideo() {
    if (!videoIframe || !videoFrame) return;
    const cw = videoFrame.clientWidth;
    const ch = videoFrame.clientHeight;
    if (!cw || !ch) return;
    let w = cw;
    let h = w / videoAspect;
    if (h < ch) {
      h = ch;
      w = h * videoAspect;
    }
    videoIframe.style.width = w + "px";
    videoIframe.style.height = h + "px";
    videoIframe.style.left = ((cw - w) / 2) + "px";
    videoIframe.style.top = ((ch - h) / 2) + "px";
  }

  function silentCloseProject() {
    if (!portrait.classList.contains("is-project")) return;
    stopAuto();
    portrait.classList.remove("is-project");
    clearActive();
    if (slideshow) slideshow.hidden = true;
  }

  function openVideo(id, info, opts) {
    if (!videoIframe) return;
    silentCloseProject();
    silentCloseHealth();
    const withControls = opts && opts.controls;
    const muted = !opts || opts.muted !== false;
    const ctrl = withControls ? "controls=1&fs=1&disablekb=0" : "controls=0&disablekb=1&fs=0";
    const muteParam = muted ? "&mute=1" : "";
    videoIframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&playsinline=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&enablejsapi=1" + muteParam + "&" + ctrl;
    if (videoSoundBtn) videoSoundBtn.dataset.muted = String(muted);
    if (videoFeatureTag) videoFeatureTag.hidden = !(opts && opts.featured);
    videoPlayer.hidden = false;
    portrait.classList.add("is-video");
    const hasInfo = !!(info && info.trim());
    const showInfo = hasInfo && (!opts || opts.showInfo !== false);
    if (videoInfoPanel) {
      const textEl = videoInfoPanel.querySelector(".project-info-text");
      if (textEl) textEl.textContent = info || "";
      videoInfoPanel.hidden = !showInfo;
    }
    if (videoInfoBtn) {
      videoInfoBtn.setAttribute("aria-expanded", String(showInfo));
      videoInfoBtn.hidden = !hasInfo;
    }
    requestAnimationFrame(fitVideo);
  }

  function closeVideo() {
    if (!videoIframe) return;
    playCloseSound();
    videoIframe.src = "";
    portrait.classList.remove("is-video");
    setTimeout(() => { videoPlayer.hidden = true; }, 280);
  }

  if (videoClose) videoClose.addEventListener("click", closeVideo);
  window.addEventListener("resize", fitVideo);
  if (window.ResizeObserver && videoFrame) new ResizeObserver(fitVideo).observe(videoFrame);
  window.addEventListener("keydown", (e) => {
    if (portrait.classList.contains("is-video") && e.key === "Escape") closeVideo();
  });

  document.querySelectorAll("[data-video]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      playOpenSound();
      openVideo(el.dataset.video, el.dataset.videoInfo, { controls: el.dataset.videoControls === "1", muted: false });
    });
  });

  closeBtn && closeBtn.addEventListener("click", close);
  infoBtn && infoBtn.addEventListener("click", () => {
    const expanded = infoBtn.getAttribute("aria-expanded") === "true";
    playExpandSound(!expanded);
    setInfo(!expanded);
  });
  prevBtn && prevBtn.addEventListener("click", () => { prev(); setMode("manual"); });
  nextBtn && nextBtn.addEventListener("click", () => { next(); setMode("manual"); });
  modeBtn && modeBtn.addEventListener("click", () => setMode(mode === "auto" ? "manual" : "auto"));

  window.addEventListener("keydown", (e) => {
    if (!portrait.classList.contains("is-project")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") { next(); setMode("manual"); }
    else if (e.key === "ArrowLeft") { prev(); setMode("manual"); }
  });

  slideshow.addEventListener("mouseenter", () => { if (mode === "auto") stopAuto(); });
  slideshow.addEventListener("mouseleave", () => { if (mode === "auto") startAuto(); });
})();

/* ──────────────────────────────────────────────────────────────
 *  Easter eggs for dev visitors
 *  (if you're reading this, hi 👋 — pulssart@gmail.com)
 * ────────────────────────────────────────────────────────────── */

(function devEasterEggs() {
  const style = "color:#7faeb7;font-family:ui-monospace,monospace;font-size:12px;line-height:1.4";
  const big = "color:#d9d6d0;font-family:ui-monospace,monospace;font-size:14px;font-weight:600;line-height:1.2";
  const dim = "color:#8a847a;font-family:ui-monospace,monospace;font-size:11px";

  console.log(
    "%c\n" +
    "   █████╗ ██████╗ \n" +
    "  ██╔══██╗██╔══██╗\n" +
    "  ███████║██║  ██║\n" +
    "  ██╔══██║██║  ██║\n" +
    "  ██║  ██║██████╔╝\n" +
    "  ╚═╝  ╚═╝╚═════╝ \n",
    big
  );
  console.log("%cYou opened the devtools. Respect.", style);
  console.log("%cIf you got curious enough to look here, we'd probably get along.", style);
  console.log("%c→ pulssart@gmail.com  ·  fancy a chat?", style);
  console.log("%c\nTry: window.__adrien — or the Konami code on the page.\n", dim);

  // Hidden bio object
  Object.defineProperty(window, "__adrien", {
    value: Object.freeze({
      name: "Adrien Donot",
      title: "Senior Product Designer",
      city: "Paris, 9e",
      now: "Dotfile — KYB compliance × agentic AI",
      past: ["lempire (lemlist)", "Cocolabs", "XXII", "Apple"],
      stack: ["Figma", "Linear", "Framer", "the obscure terminal commands"],
      favoriteHour: "2am, redesigning a fake onboarding for fun",
      currentlyListening: "probably ambient electronic or French rap",
      sideProjects: ["Echo", "Flux", "Natura", "StoryTime AI", "+ a graveyard of 30 others"],
      philosophy: "make complexity feel calm",
      whisper: "you can press ↑↑↓↓←→←→BA on the page. just saying.",
    }),
    writable: false,
    configurable: false,
  });

  // Konami code (or just type "adrien") → party mode
  const konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  const wordTrigger = "adrien";
  let buffer = [];
  let typed = "";
  let unlocked = false;

  function triggerParty(source) {
    if (unlocked) return;
    unlocked = true;
    document.documentElement.classList.add("party-mode");
    console.log("%c🎉 PARTY MODE UNLOCKED via " + source + ". you found the egg.", big);
    console.log("%cif you're a recruiter, tell me you tried it. instant kinship.", style);
    scrambleAllText(3500);
    setTimeout(() => {
      document.documentElement.classList.remove("party-mode");
      unlocked = false;
      buffer = [];
      typed = "";
    }, 6000);
  }

  function scrambleAllText(duration) {
    const pool = "abcdefghijklmnopqrstuvwxyz";
    const partyPalette = ["#ff3b6b", "#ff8a00", "#ffd60a", "#06d6a0", "#00b4ff", "#7a4cff", "#ff5ecf"];
    const rand = () => pool[(Math.random() * pool.length) | 0];
    const randCol = () => partyPalette[(Math.random() * partyPalette.length) | 0];

    const root = document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = n.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TITLE") return NodeFilter.FILTER_REJECT;
        if (n.parentElement.closest("#theme-toggle")) return NodeFilter.FILTER_REJECT;
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const targets = [];
    let nd;
    while ((nd = walker.nextNode())) {
      const parent = nd.parentElement;
      const wrap = document.createElement("span");
      wrap.style.color = "inherit";
      wrap.textContent = nd.nodeValue;
      parent.replaceChild(wrap, nd);
      targets.push({ node: wrap, text: wrap.textContent });
    }

    const totalChars = targets.reduce((s, t) => s + t.text.length, 0);
    if (!totalChars) return;
    const tickInterval = 90;
    const start = performance.now();
    let lastTick = start;
    const charCache = new Array(totalChars).fill("");
    const colorCache = new Array(totalChars).fill(null);

    const revealOrder = [];
    for (let i = 0; i < totalChars; i++) revealOrder.push(i);
    for (let i = revealOrder.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }
    const revealedAt = new Array(totalChars).fill(Infinity);
    revealOrder.forEach((idx, order) => {
      revealedAt[idx] = (order / totalChars) * duration;
    });

    function esc(c) {
      if (c === "<") return "&lt;";
      if (c === ">") return "&gt;";
      if (c === "&") return "&amp;";
      return c;
    }

    function frame(now) {
      const elapsed = now - start;
      const tick = now - lastTick >= tickInterval;
      if (tick) lastTick = now;
      let gi = 0;
      let done = true;
      targets.forEach((seg) => {
        let out = "";
        for (let i = 0; i < seg.text.length; i++) {
          const original = seg.text[i];
          const isStatic = original === " " || original === "\n" || original === "\t";
          if (elapsed >= revealedAt[gi] || isStatic) {
            out += esc(original);
          } else {
            if (tick || !charCache[gi]) {
              charCache[gi] = rand();
              colorCache[gi] = Math.random() < 0.55 ? randCol() : null;
            }
            const ch = /[A-Z]/.test(original) ? charCache[gi].toUpperCase() : charCache[gi];
            out += colorCache[gi] ? '<span style="color:' + colorCache[gi] + '">' + ch + "</span>" : ch;
            done = false;
          }
          gi += 1;
        }
        seg.node.innerHTML = out;
      });
      if (!done) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function onKey(e) {
    const raw = e.key;
    const key = raw && raw.length === 1 ? raw.toLowerCase() : raw;
    buffer.push(key);
    if (buffer.length > konami.length) buffer.shift();
    if (buffer.length === konami.length && buffer.every((k, i) => k === konami[i])) {
      triggerParty("Konami");
      return;
    }
    if (raw && raw.length === 1) {
      typed = (typed + raw.toLowerCase()).slice(-wordTrigger.length);
      if (typed === wordTrigger) triggerParty("typing");
    }
  }

  window.addEventListener("keydown", onKey, true);

  // Friendly print stylesheet whisper
  const print = document.createElement("style");
  print.textContent = '@media print { body::after { content: "Printing my portfolio? Bold. — Adrien"; display:block; padding:24px; font-style:italic; } }';
  document.head.appendChild(print);

  // Page-title flirt when tab is hidden
  const originalTitle = document.title;
  const teasers = [
    "👀 come back, I miss you",
    "still here. waiting.",
    "ok but seriously, come back",
    "I made coffee.",
  ];
  let teaseTimer = null;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      let i = 0;
      teaseTimer = setInterval(() => {
        document.title = teasers[i % teasers.length];
        i += 1;
      }, 2500);
    } else {
      if (teaseTimer) clearInterval(teaseTimer);
      document.title = originalTitle;
    }
  });
})();

function playSuccessSound() {
  if (!ensureAudio()) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.0001, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.14, t + i * 0.08 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.28);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.32);
    });
  } catch (_) {}
}

function showToast(message, isError) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = '<span class="toast-dot" aria-hidden="true"></span><span class="toast-text"></span>';
    document.body.appendChild(toast);
  }
  toast.classList.toggle("is-error", !!isError);
  toast.querySelector(".toast-text").textContent = message;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

(function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const submitBtn = form.querySelector(".contact-submit");
  const submitLabel = submitBtn && submitBtn.querySelector("span");
  const originalLabel = submitLabel ? submitLabel.textContent : "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const subject = (data.get("subject") || "").toString().trim();
    const body = (data.get("body") || "").toString().trim();
    if (!subject || !body) {
      form.reportValidity && form.reportValidity();
      return;
    }

    const endpoint = form.getAttribute("action") || "";
    if (!endpoint || endpoint.indexOf("YOUR_FORM_ID") !== -1) {
      const href = "mailto:pulssart@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      window.location.href = href;
      return;
    }

    if (submitLabel) submitLabel.textContent = "Sending…";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      playSuccessSound();
      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Message sent");
    } catch (err) {
      console.error("Form error:", err);
      showToast("Something went wrong — try again", true);
    } finally {
      if (submitLabel) submitLabel.textContent = originalLabel;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();

(function initCollapsibleSections() {
  document.querySelectorAll(".list-section.is-collapsible h2").forEach((h2) => {
    h2.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 820px)").matches) return;
      const section = h2.parentElement;
      const wasCollapsed = section.classList.contains("is-collapsed");
      playExpandSound(wasCollapsed);
      section.classList.toggle("is-collapsed");
    });
  });
})();

(function initPulsoidBPM() {
  const widget = document.querySelector("#bpm-widget");
  if (!widget) return;

  // Capture OAuth implicit-flow token from URL hash, store, clean URL
  if (window.location.hash && window.location.hash.indexOf("access_token=") !== -1) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const tok = params.get("access_token");
    if (tok) {
      try { localStorage.setItem("pulsoid_token", tok); } catch (_) {}
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  let token = (widget.dataset.token || "").trim();
  if (!token) {
    try { token = localStorage.getItem("pulsoid_token") || ""; } catch (_) {}
  }
  const valueEl = widget.querySelector(".bpm-value");

  let ws = null;
  let staleTimer = null;
  let reconnectDelay = 1500;
  let fallbackTimer = null;
  let fallbackBpm = 70 + Math.floor(Math.random() * 8);
  let isLive = false;

  const liveBpmEl = document.querySelector("[data-live-bpm]");

  function render(bpm) {
    widget.hidden = false;
    widget.classList.remove("is-stale");
    widget.style.setProperty("--bpm", String(bpm));
    document.documentElement.style.setProperty("--bpm", String(bpm));
    if (valueEl) valueEl.textContent = String(bpm);
    if (liveBpmEl) liveBpmEl.textContent = String(bpm);
  }

  function tickFallback() {
    fallbackBpm += (Math.random() - 0.5) * 2.4;
    if (fallbackBpm < 64) fallbackBpm = 64;
    if (fallbackBpm > 82) fallbackBpm = 82;
    render(Math.round(fallbackBpm));
    fallbackTimer = setTimeout(tickFallback, 1800 + Math.random() * 1800);
  }

  function startFallback() {
    if (fallbackTimer) return;
    isLive = false;
    tickFallback();
  }

  function stopFallback() {
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
  }

  function setLiveBpm(bpm) {
    if (!bpm || bpm < 20 || bpm > 250) return;
    isLive = true;
    stopFallback();
    render(bpm);
    if (staleTimer) clearTimeout(staleTimer);
    staleTimer = setTimeout(() => {
      // No live data for 8s → resume fallback
      isLive = false;
      startFallback();
    }, 8000);
  }

  function connect() {
    if (!token) return;
    try {
      ws = new WebSocket("wss://dev.pulsoid.net/api/v1/data/real_time?access_token=" + encodeURIComponent(token));
    } catch (e) {
      console.warn("Pulsoid: failed to open WebSocket", e);
      scheduleReconnect();
      return;
    }
    ws.addEventListener("open", () => { reconnectDelay = 1500; });
    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        const bpm = (msg && msg.data && msg.data.heart_rate) || msg.heart_rate;
        if (typeof bpm === "number") setLiveBpm(bpm);
      } catch (_) {}
    });
    ws.addEventListener("close", scheduleReconnect);
    ws.addEventListener("error", () => { try { ws.close(); } catch (_) {} });
  }

  function scheduleReconnect() {
    if (!isLive) startFallback();
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 1.6, 20000);
  }

  // Always start with fallback so the widget is visible immediately
  startFallback();
  connect();
})();

(function initWaterLiquid() {
  const canvas = document.querySelector("[data-water-liquid]");
  if (!canvas) return;
  const card = canvas.closest(".health-card");
  const ctx = canvas.getContext("2d");
  if (!card || !ctx) return;

  const state = {
    width: 0,
    height: 0,
    level: 0.42,
    targetLevel: 0.42,
    wave: 0,
    impulse: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    pointerActive: false,
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function resize() {
    const rect = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(1, Math.round(rect.width));
    state.height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setWaterLevel(liters) {
    const dailyGoal = 2.5;
    state.targetLevel = clamp(liters / dailyGoal, 0.08, 0.92);
  }

  function movePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = clamp((clientX - rect.left) / rect.width, 0, 1);
    state.pointerY = clamp((clientY - rect.top) / rect.height, 0, 1);
    state.impulse = Math.min(state.impulse + 0.9, 3.2);
  }

  card.addEventListener("pointerenter", (event) => {
    resize();
    state.pointerActive = true;
    movePointer(event.clientX, event.clientY);
  });
  card.addEventListener("pointermove", (event) => {
    state.pointerActive = true;
    movePointer(event.clientX, event.clientY);
  });
  card.addEventListener("pointerleave", () => {
    state.pointerActive = false;
  });
  document.addEventListener("adrien:water-level", (event) => {
    const liters = event.detail && event.detail.liters;
    if (typeof liters === "number") setWaterLevel(liters);
  });

  function draw() {
    const w = state.width;
    const h = state.height;
    if (!w || !h) {
      requestAnimationFrame(draw);
      return;
    }

    state.level += (state.targetLevel - state.level) * 0.035;
    state.wave += 0.018 + state.impulse * 0.002;
    state.impulse *= 0.94;

    ctx.clearRect(0, 0, w, h);

    const fillTop = h * (1 - state.level);
    const pointerPush = state.pointerActive ? (0.5 - state.pointerY) * 12 * state.impulse : 0;
    const amp = 5 + state.impulse * 4;
    const steps = 26;

    function waveY(nx) {
      const pointerDistance = Math.abs(nx - state.pointerX);
      const localPush = Math.max(0, 1 - pointerDistance * 4) * pointerPush;
      return fillTop +
        Math.sin(nx * Math.PI * 2 + state.wave * 3.2) * amp +
        Math.sin(nx * Math.PI * 4.6 - state.wave * 2.1) * (amp * 0.32) +
        localPush;
    }

    const gradient = ctx.createLinearGradient(0, fillTop - 28, 0, h);
    gradient.addColorStop(0, "rgba(86, 196, 216, 0.18)");
    gradient.addColorStop(0.42, "rgba(86, 196, 216, 0.36)");
    gradient.addColorStop(1, "rgba(86, 196, 216, 0.58)");

    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, waveY(0));
    for (let i = 1; i <= steps; i += 1) {
      const nx = i / steps;
      ctx.lineTo(w * nx, waveY(nx));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const nx = i / steps;
      const x = w * nx;
      const y = waveY(nx);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(188, 238, 246, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  setWaterLevel(1.1);
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(card);
  else window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();

(function initHealthData() {
  const grid = document.querySelector(".health-grid");
  if (!grid) return;
  const endpoint = grid.dataset.healthApi;
  if (!endpoint) return;

  function setText(selector, value) {
    if (value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value))) return;
    document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
  }

  function fmtInt(n) {
    if (n == null || Number.isNaN(n)) return null;
    return Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");
  }
  function fmtKm(km) {
    if (km == null) return null;
    return km < 1 ? (km * 1000).toFixed(0) + " m" : km.toFixed(1) + " km";
  }
  function fmtHoursTotal(h) {
    if (!h) return null;
    const hours = Math.floor(h);
    const min = Math.round((h - hours) * 60);
    return hours + "h " + String(min).padStart(2, "0") + "m";
  }
  function fmtHM(h) {
    if (!h) return null;
    const hours = Math.floor(h);
    const min = Math.round((h - hours) * 60);
    return hours + ":" + String(min).padStart(2, "0");
  }

  function fmtSince(iso) {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return Math.floor(diffSec / 60) + " min ago";
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + " h ago";
    return Math.floor(diffSec / 86400) + " d ago";
  }

  function apply(d) {
    if (!d) return;
    setText("[data-health-updated]", fmtSince(d.updatedAt));
    setText("[data-health-resting]", fmtInt(d.resting_heart_rate?.qty));
    setText("[data-health-vo2]", d.vo2_max?.qty ? d.vo2_max.qty.toFixed(1) : null);
    setText("[data-health-hrv]", fmtInt(d.heart_rate_variability?.qty));

    if (d.sleep_analysis) {
      const s = d.sleep_analysis;
      setText("[data-health-sleep-total]", fmtHoursTotal(s.totalSleep));
      setText("[data-health-sleep-rem]", fmtHM(s.rem));
      setText("[data-health-sleep-deep]", fmtHM(s.deep));
      setText("[data-health-sleep-core]", fmtHM(s.core));
    }

    setText("[data-health-steps]", fmtInt(d.step_count?.qty));
    setText("[data-health-distance]", fmtKm(d.walking_running_distance?.qty));
    const stand = d.apple_stand_hour?.qty ?? d.stand_hours?.qty;
    setText("[data-health-stand]", stand != null ? Math.round(stand) + "h" : null);

    const waterMl = d.dietary_water?.qty;
    if (waterMl != null) {
      const waterL = waterMl / 1000;
      setText("[data-health-water]", waterL.toFixed(1));
      document.dispatchEvent(new CustomEvent("adrien:water-level", { detail: { liters: waterL } }));
    }
    setText("[data-health-daylight]", fmtInt(d.time_in_daylight?.qty));

    const wrist = d.apple_sleeping_wrist_temperature?.qty ?? d.wrist_temperature?.qty;
    if (wrist != null) setText("[data-health-wrist]", wrist.toFixed(1) + "°C");
  }

  let inflight = null;
  async function refresh() {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        apply(data);
      } catch (e) {
        console.warn("Health fetch failed", e);
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  refresh();
  let timer = null;
  const portrait = document.querySelector(".portrait");
  if (portrait) {
    const obs = new MutationObserver(() => {
      if (portrait.classList.contains("is-health")) {
        refresh();
        if (!timer) timer = setInterval(refresh, 60000);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    obs.observe(portrait, { attributes: true, attributeFilter: ["class"] });
  }
})();
