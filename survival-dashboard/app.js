(function () {
  "use strict";

  const PHRASES = window.PHRASES;
  const STORAGE_KEY = "survivalDashboard.lang";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    lang: localStorage.getItem(STORAGE_KEY) || "en-US",
    amount: "0",
    voicesReady: false,
    voiceCache: new Map()
  };

  // ---------- Speech ----------
  const synth = window.speechSynthesis;

  function loadVoices() {
    if (!synth) return [];
    const voices = synth.getVoices();
    state.voicesReady = voices.length > 0;
    return voices;
  }

  function pickVoice(lang) {
    if (state.voiceCache.has(lang)) return state.voiceCache.get(lang);
    const voices = loadVoices();
    const lower = lang.toLowerCase();
    const base = lower.split("-")[0];
    let v =
      voices.find(x => x.lang && x.lang.toLowerCase() === lower) ||
      voices.find(x => x.lang && x.lang.toLowerCase().startsWith(base + "-")) ||
      voices.find(x => x.lang && x.lang.toLowerCase().startsWith(base)) ||
      null;
    state.voiceCache.set(lang, v);
    return v;
  }

  function speak(text, opts) {
    if (!text) return;
    if (!synth) {
      flashOutput("(この端末は音声に対応していません) " + text);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (opts && opts.lang) || state.lang;
    const v = pickVoice(u.lang);
    if (v) u.voice = v;
    u.rate = (opts && opts.rate) || 0.95;
    u.pitch = 1.0;
    u.volume = 1.0;
    synth.speak(u);
  }

  if (synth && typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = () => {
      state.voiceCache.clear();
      loadVoices();
    };
  }

  // ---------- Output area ----------
  const greetOutput = $("#greetOutput");
  let outputResetTimer = null;

  function flashOutput(html) {
    greetOutput.innerHTML = html;
    if (outputResetTimer) clearTimeout(outputResetTimer);
    outputResetTimer = setTimeout(() => {
      greetOutput.textContent = "ボタンを押すと現地の言葉で再生されます";
    }, 6000);
  }

  // ---------- Language switching ----------
  const langSelect = $("#langSelect");
  const amountPrefix = $("#amountPrefix");

  function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    const p = PHRASES[lang] || PHRASES["en-US"];
    amountPrefix.textContent = p.currency || "";
    $$(".quick").forEach(btn => {
      const slot = btn.querySelector(".quick__local");
      const key = btn.dataset.phrase;
      if (slot && p[key]) slot.textContent = p[key];
    });
  }

  langSelect.value = state.lang;
  applyLanguage(state.lang);
  langSelect.addEventListener("change", e => applyLanguage(e.target.value));

  // ---------- Keypad / Shop ----------
  const amountEl = $("#amount");

  function setAmount(next) {
    state.amount = next;
    amountEl.textContent = formatAmount(next);
  }

  function formatAmount(n) {
    if (!n) return "0";
    const s = String(n);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function pressDigit(d) {
    if (state.amount === "0") {
      setAmount(d);
    } else if (state.amount.length < 9) {
      setAmount(state.amount + d);
    }
    speak(d, { rate: 1.0 });
  }

  function pressClear() {
    setAmount("0");
  }

  function pressBack() {
    if (state.amount.length <= 1) setAmount("0");
    else setAmount(state.amount.slice(0, -1));
  }

  $$(".key").forEach(btn => {
    btn.addEventListener("click", () => {
      const d = btn.dataset.digit;
      const action = btn.dataset.action;
      if (typeof d !== "undefined") pressDigit(d);
      else if (action === "clear") pressClear();
      else if (action === "back") pressBack();
    });
  });

  // Quick phrases
  $$(".quick").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.phrase;
      const p = PHRASES[state.lang] || PHRASES["en-US"];
      let text = p[key];
      if (key === "howmuch" && state.amount !== "0") {
        // If user typed an amount, confirm it instead of asking blindly
        text = (p.priceFmt || (n => n))(formatAmount(state.amount));
      }
      flashOutput("<strong>" + escapeHtml(text) + "</strong>");
      speak(text);
      pulse(btn);
    });
  });

  // ---------- Greetings ----------
  $$(".greet").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.greet;
      const p = PHRASES[state.lang] || PHRASES["en-US"];
      const text = p[key];
      flashOutput("<strong>" + escapeHtml(text) + "</strong>");
      speak(text);
      pulse(btn);
    });
  });

  // ---------- Emergency overlay ----------
  const overlay = $("#emergencyOverlay");
  const overlayBig = $("#overlayBig");
  const overlaySub = $("#overlaySub");
  const overlayClose = $("#overlayClose");
  const emergencyBtn = $("#emergencyBtn");

  function openEmergency() {
    const p = PHRASES[state.lang] || PHRASES["en-US"];
    overlayBig.textContent = p.wait;
    overlaySub.textContent = p.waitSub;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    if (typeof navigator.vibrate === "function") navigator.vibrate([20, 40, 20]);
    speak(p.wait + " " + p.waitSub, { rate: 0.92 });
  }

  function closeEmergency(e) {
    if (e) e.stopPropagation();
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (synth) synth.cancel();
  }

  emergencyBtn.addEventListener("click", openEmergency);
  overlay.addEventListener("click", e => {
    // Tap anywhere closes — except double-tap on close button which also closes.
    if (e.target.closest(".overlay__close") || e.currentTarget === e.target ||
        !e.target.closest(".overlay__content")) {
      closeEmergency();
    }
  });
  overlayClose.addEventListener("click", closeEmergency);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.hidden) closeEmergency();
  });

  // ---------- Helpers ----------
  function pulse(el) {
    el.classList.add("is-active");
    setTimeout(() => el.classList.remove("is-active"), 250);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // Prime voice list (some browsers populate asynchronously)
  loadVoices();
})();
