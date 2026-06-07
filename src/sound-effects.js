const STORAGE_KEY = "customReversiSoundEnabled";
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let audioContext = null;
let enabled = localStorage.getItem(STORAGE_KEY) !== "off";
let audioReady = false;
let lastMoveText = "";
let resultWasVisible = false;
let bgmState = {
  running: false,
  style: null,
  timer: null,
  master: null,
  nextTime: 0,
  step: 0,
};

const NOTE_OFFSETS = { C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2 };
const BGM_STYLES = [
  {
    key: "classic",
    label: "クラシック風",
    bpm: 88,
    wave: "triangle",
    volume: 0.62,
    leadGain: 0.017,
    bassGain: 0.012,
    chordGain: 0.007,
    lead: ["C5", "E5", "G5", "E5", "F5", "A5", "C6", "A5", "G5", "B4", "D5", "B4", "E5", "G5", "C6", "G5"],
    bass: ["C3", null, "G2", null, "F3", null, "C3", null, "A2", null, "E3", null, "G2", null, "C3", null],
    chords: [["C4", "E4", "G4"], ["F4", "A4", "C5"], ["A3", "C4", "E4"], ["G3", "B3", "D4"]],
  },
  {
    key: "arcade",
    label: "ゲームセンター風",
    bpm: 140,
    wave: "square",
    volume: 0.52,
    leadGain: 0.016,
    bassGain: 0.012,
    chordGain: 0.006,
    lead: ["C5", "G5", "C6", "G5", "D#5", "A#5", "D#6", "A#5", "F5", "C6", "F6", "C6", "G5", "D6", "G6", "D6"],
    bass: ["C3", "C3", null, "C3", "D#3", "D#3", null, "D#3", "F3", "F3", null, "F3", "G3", "G3", null, "G3"],
    chords: [["C4", "D#4", "G4"], ["D#4", "G4", "A#4"], ["F4", "A4", "C5"], ["G4", "B4", "D5"]],
    percussion: true,
  },
  {
    key: "jazz",
    label: "ジャズ風",
    bpm: 112,
    wave: "sine",
    swing: 0.22,
    volume: 0.58,
    leadGain: 0.017,
    bassGain: 0.013,
    chordGain: 0.008,
    lead: ["E5", "G5", "A5", null, "A#5", "A5", "G5", "E5", "D5", "F5", "G5", null, "B4", "D5", "E5", null],
    bass: ["C3", "E3", "G3", "A3", "F3", "A3", "C4", "A3", "D3", "F3", "A3", "C4", "G2", "B2", "D3", "F3"],
    chords: [["C4", "E4", "G4", "A#4"], ["F3", "A3", "C4", "E4"], ["D4", "F4", "A4", "C5"], ["G3", "B3", "D4", "F4"]],
  },
  {
    key: "wagakki",
    label: "和楽器風",
    bpm: 96,
    wave: "triangle",
    volume: 0.58,
    leadGain: 0.018,
    bassGain: 0.01,
    chordGain: 0.005,
    lead: ["C5", null, "D5", "F5", "G5", null, "A5", "G5", "F5", null, "D5", "C5", "G4", null, "A4", "C5"],
    bass: ["C3", null, null, null, "G2", null, null, null, "F3", null, null, null, "C3", null, null, null],
    chords: [["C4", "F4", "G4"], ["D4", "G4", "A4"], ["F4", "G4", "C5"], ["C4", "D4", "G4"]],
    pluck: true,
  },
  {
    key: "hawaiian",
    label: "ハワイアン風",
    bpm: 104,
    wave: "triangle",
    swing: 0.12,
    volume: 0.56,
    leadGain: 0.017,
    bassGain: 0.012,
    chordGain: 0.007,
    lead: ["E5", "G5", "A5", "C6", "A5", "G5", "E5", null, "D5", "F5", "G5", "B5", "G5", "F5", "D5", null],
    bass: ["C3", null, "G2", null, "A2", null, "E3", null, "F3", null, "C3", null, "G2", null, "C3", null],
    chords: [["C4", "E4", "G4", "A4"], ["A3", "C4", "E4", "G4"], ["F4", "A4", "C5"], ["G3", "B3", "D4"]],
    slide: true,
  },
];

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

function noteFrequency(name) {
  if (!name) return null;
  const match = String(name).match(/^([A-G])(#?)(-?\d+)$/);
  if (!match) return null;
  const key = `${match[1]}${match[2]}`;
  const octave = Number(match[3]);
  return 440 * (2 ** ((NOTE_OFFSETS[key] + (octave - 4) * 12) / 12));
}

function isGameActive() {
  const playPanel = document.querySelector("#playPanel");
  const resultPanel = document.querySelector("#resultPanel");
  return Boolean(playPanel && !playPanel.classList.contains("is-hidden") && (!resultPanel || resultPanel.classList.contains("is-hidden")));
}

function updateSoundButtons() {
  const bgmLabel = bgmState.style ? ` / BGM: ${bgmState.style.label}` : "";
  document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
    button.textContent = enabled ? "音 ON" : "音 OFF";
    button.title = enabled ? `音 ON${bgmLabel}` : "音 OFF";
    button.setAttribute("aria-label", enabled ? `音 ON${bgmLabel}` : "音 OFF");
    button.setAttribute("aria-pressed", String(enabled));
  });
}

function scheduleMusicTone(ctx, {
  frequency,
  start,
  duration,
  type = "sine",
  gain = 0.01,
  attack = 0.018,
  release = 0.08,
  bend = 1,
}) {
  if (!frequency || !bgmState.master) return;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = type;
  if (bend !== 1) {
    oscillator.frequency.setValueAtTime(frequency * bend, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, start + Math.min(0.12, duration * 0.45));
  } else {
    oscillator.frequency.setValueAtTime(frequency, start);
  }
  oscillator.connect(volume);
  volume.connect(bgmState.master);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + attack);
  volume.gain.setTargetAtTime(0.0001, start + Math.max(attack, duration - release), Math.max(0.025, release));
  oscillator.start(start);
  oscillator.stop(start + duration + release + 0.04);
}

function scheduleChord(ctx, style, start, stepDuration) {
  const chord = style.chords[Math.floor((bgmState.step % 16) / 4) % style.chords.length];
  chord.forEach((name, index) => {
    scheduleMusicTone(ctx, {
      frequency: noteFrequency(name),
      start: start + index * 0.018,
      duration: stepDuration * 2.7,
      type: style.wave === "square" ? "triangle" : style.wave,
      gain: style.chordGain,
      attack: 0.04,
      release: 0.26,
    });
  });
}

function schedulePercussion(ctx, style, start, step) {
  if (!style.percussion) return;
  if (step % 4 === 0) {
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(96, start);
    oscillator.frequency.exponentialRampToValueAtTime(48, start + 0.09);
    oscillator.connect(volume);
    volume.connect(bgmState.master);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.018, start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  }
  if (step % 2 === 1) {
    scheduleMusicTone(ctx, {
      frequency: 1760,
      start,
      duration: 0.026,
      type: "square",
      gain: 0.0038,
      attack: 0.004,
      release: 0.018,
    });
  }
}

function scheduleMusicStep(ctx) {
  const style = bgmState.style;
  if (!style || !bgmState.master) return;
  const step = bgmState.step % style.lead.length;
  const stepDuration = 60 / style.bpm / 2;
  const swingDelay = style.swing && step % 2 ? stepDuration * style.swing : 0;
  const start = bgmState.nextTime + swingDelay;
  const lead = noteFrequency(style.lead[step]);
  const bass = noteFrequency(style.bass[step]);

  if (step % 4 === 0) scheduleChord(ctx, style, start, stepDuration);
  if (bass) {
    scheduleMusicTone(ctx, {
      frequency: bass,
      start,
      duration: stepDuration * 1.25,
      type: "sine",
      gain: style.bassGain,
      attack: 0.022,
      release: 0.12,
    });
  }
  if (lead) {
    scheduleMusicTone(ctx, {
      frequency: lead,
      start: start + (style.pluck ? 0.012 : 0),
      duration: stepDuration * (style.pluck ? 0.72 : 0.92),
      type: style.wave,
      gain: style.leadGain,
      attack: style.pluck ? 0.008 : 0.018,
      release: style.pluck ? 0.05 : 0.09,
      bend: style.slide ? 0.985 : 1,
    });
  }
  schedulePercussion(ctx, style, start, step);
  bgmState.nextTime += stepDuration;
  bgmState.step += 1;
}

function runBgmScheduler() {
  const ctx = audioContext;
  if (!ctx || !bgmState.running) return;
  while (bgmState.nextTime < ctx.currentTime + 0.75) scheduleMusicStep(ctx);
}

function pickBgmStyle() {
  return BGM_STYLES[Math.floor(Math.random() * BGM_STYLES.length)];
}

function stopBgm(fade = true) {
  if (bgmState.timer) window.clearInterval(bgmState.timer);
  bgmState.timer = null;
  bgmState.running = false;

  const master = bgmState.master;
  bgmState.master = null;
  if (!master || !audioContext) return;
  const now = audioContext.currentTime;
  try {
    master.gain.cancelScheduledValues(now);
    if (fade) {
      master.gain.setTargetAtTime(0.0001, now, 0.18);
      window.setTimeout(() => master.disconnect(), 900);
    } else {
      master.disconnect();
    }
  } catch {
    // Ignore disconnect races from already-stopped nodes.
  }
}

async function startBgm(forceNew = false) {
  if (!enabled || !isGameActive()) return;
  if (bgmState.running && !forceNew) return;
  const ctx = await unlockAudio();
  if (!ctx) return;
  stopBgm(false);

  bgmState.style = pickBgmStyle();
  bgmState.master = ctx.createGain();
  bgmState.master.gain.setValueAtTime(0.0001, ctx.currentTime);
  bgmState.master.gain.exponentialRampToValueAtTime(bgmState.style.volume, ctx.currentTime + 0.45);
  bgmState.master.connect(ctx.destination);
  bgmState.nextTime = ctx.currentTime + 0.04;
  bgmState.step = 0;
  bgmState.running = true;
  document.body.dataset.bgmStyle = bgmState.style.key;
  updateSoundButtons();
  runBgmScheduler();
  bgmState.timer = window.setInterval(runBgmScheduler, 140);
}

function syncBgmToGame(forceNew = false) {
  if (enabled && isGameActive()) {
    startBgm(forceNew);
  } else {
    stopBgm();
  }
}

function unlockAndSyncBgm() {
  unlockAudio().then(() => {
    if (isGameActive()) syncBgmToGame();
  });
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
  updateSoundButtons();
  if (enabled) {
    playSound("tap");
    syncBgmToGame();
  } else {
    stopBgm();
  }
}

function addSoundToggle(target) {
  if (!target || target.querySelector("[data-sound-toggle]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.soundToggle = "true";
  button.addEventListener("click", () => setEnabled(!enabled));
  target.append(button);
  updateSoundButtons();
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
  const playPanel = document.querySelector("#playPanel");
  const setupForm = document.querySelector("#settingsForm");
  const restartButton = document.querySelector("#restartButton");
  const backButton = document.querySelector("#backButton");

  setupForm?.addEventListener("submit", () => {
    unlockAudio().then(() => {
      playSound("start");
      startBgm(true);
      window.setTimeout(() => syncBgmToGame(true), 120);
    });
  });

  restartButton?.addEventListener("click", () => {
    unlockAudio().then(() => startBgm(true));
  });

  backButton?.addEventListener("click", () => stopBgm());

  document.addEventListener("pointerdown", unlockAndSyncBgm, { passive: true });
  document.addEventListener("touchstart", unlockAndSyncBgm, { passive: true });
  document.addEventListener("click", unlockAndSyncBgm, { passive: true });
  document.addEventListener("keydown", unlockAndSyncBgm);

  if (moveLog) {
    new MutationObserver(() => {
      const kind = moveKind(moveLog.textContent.trim());
      if (kind) playSound(kind);
    }).observe(moveLog, { childList: true, characterData: true, subtree: true });
  }

  if (resultPanel) {
    new MutationObserver(() => {
      const visible = !resultPanel.classList.contains("is-hidden");
      if (visible && !resultWasVisible) {
        stopBgm();
        playSound("result");
      }
      resultWasVisible = visible;
    }).observe(resultPanel, { attributes: true, attributeFilter: ["class"] });
  }

  if (playPanel) {
    new MutationObserver(() => syncBgmToGame()).observe(playPanel, { attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("pagehide", () => stopBgm(false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBgm();
    else syncBgmToGame();
  });
}

addSoundToggle(document.querySelector(".actions"));
addSoundToggle(document.querySelector(".play-actions"));
observeGameEvents();
