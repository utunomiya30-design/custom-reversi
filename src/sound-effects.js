const STORAGE_KEY = "customReversiSoundEnabled";
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let audioContext = null;
let enabled = localStorage.getItem(STORAGE_KEY) !== "off";
let audioReady = false;
let lastMoveText = "";
let resultWasVisible = false;

function getAudioContext() {
  if (!AudioContextClass || !enabled) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

async function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  try {
    if (ctx.state === "suspended") await ctx.resume();
    if (!audioReady) {
      const volume = ctx.createGain();
      const oscillator = ctx.createOscillator();
      volume.gain.value = 0.0001;
      oscillator.frequency.value = 440;
      oscillator.connect(volume);
      volume.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.01);
      audioReady = true;
    }
    return ctx;
  } catch {
    return null;
  }
}

function scheduleTone(ctx, { frequency = 440, duration = 0.08, type = "sine", gain = 0.035, delay = 0 }) {
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.connect(volume);
  volume.connect(ctx.destination);

  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

async function tone(options) {
  const ctx = await unlockAudio();
  if (!ctx) return;
  scheduleTone(ctx, options);
}

async function playSound(kind) {
  if (!enabled) return;
  const ctx = await unlockAudio();
  if (!ctx) return;

  if (kind === "move") {
    scheduleTone(ctx, { frequency: 520, duration: 0.07, type: "triangle", gain: 0.038 });
    scheduleTone(ctx, { frequency: 760, duration: 0.05, type: "sine", gain: 0.018, delay: 0.035 });
    return;
  }

  if (kind === "pass") {
    scheduleTone(ctx, { frequency: 260, duration: 0.11, type: "triangle", gain: 0.03 });
    return;
  }

  if (kind === "start") {
    scheduleTone(ctx, { frequency: 392, duration: 0.07, type: "sine", gain: 0.028 });
    scheduleTone(ctx, { frequency: 587, duration: 0.08, type: "sine", gain: 0.03, delay: 0.055 });
    return;
  }

  if (kind === "result") {
    scheduleTone(ctx, { frequency: 523, duration: 0.08, type: "triangle", gain: 0.03 });
    scheduleTone(ctx, { frequency: 659, duration: 0.08, type: "triangle", gain: 0.03, delay: 0.075 });
    scheduleTone(ctx, { frequency: 784, duration: 0.11, type: "triangle", gain: 0.032, delay: 0.15 });
    return;
  }

  scheduleTone(ctx, { frequency: 430, duration: 0.045, type: "sine", gain: 0.018 });
}

function setEnabled(next) {
  enabled = next;
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
    button.textContent = enabled ? "音 ON" : "音 OFF";
    button.setAttribute("aria-pressed", String(enabled));
  });
  if (enabled) playSound("tap");
}

function addSoundToggle(target) {
  if (!target || target.querySelector("[data-sound-toggle]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.soundToggle = "true";
  button.textContent = enabled ? "音 ON" : "音 OFF";
  button.setAttribute("aria-pressed", String(enabled));
  button.addEventListener("click", () => setEnabled(!enabled));
  target.append(button);
}

function moveKind(text) {
  if (!text || text === lastMoveText) return null;
  lastMoveText = text;
  if (/^[1-4]P:\s*/.test(text)) return "tap";
  if (/パス|passed|passe|pasa|passt|패스|跳过/.test(text)) return "pass";
  return "move";
}

function observeGameEvents() {
  const moveLog = document.querySelector("#moveLog");
  const resultPanel = document.querySelector("#resultPanel");
  const setupForm = document.querySelector("#settingsForm");

  setupForm?.addEventListener("submit", () => {
    unlockAudio().then(() => playSound("start"));
  });

  document.addEventListener("pointerdown", unlockAudio, { passive: true });
  document.addEventListener("touchstart", unlockAudio, { passive: true });
  document.addEventListener("click", unlockAudio, { passive: true });
  document.addEventListener("keydown", unlockAudio);

  if (moveLog) {
    new MutationObserver(() => {
      const kind = moveKind(moveLog.textContent.trim());
      if (kind) playSound(kind);
    }).observe(moveLog, { childList: true, characterData: true, subtree: true });
  }

  if (resultPanel) {
    new MutationObserver(() => {
      const visible = !resultPanel.classList.contains("is-hidden");
      if (visible && !resultWasVisible) playSound("result");
      resultWasVisible = visible;
    }).observe(resultPanel, { attributes: true, attributeFilter: ["class"] });
  }
}

addSoundToggle(document.querySelector(".actions"));
addSoundToggle(document.querySelector(".play-actions"));
observeGameEvents();
