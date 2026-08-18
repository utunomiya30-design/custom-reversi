const STORAGE_KEY = "customReversiDailyChallengeV1";
const ACTIVE_KEY = "customReversiActiveChallenge";

const CHALLENGES = [
  { title: "小さな盤の速攻戦", detail: "6x6・通常・2人戦", players: "2", board: "6", win: "classic", corner: "" },
  { title: "少ない石で逃げ切れ", detail: "6x6・逆転・2人戦", players: "2", board: "6", win: "reverse", corner: "" },
  { title: "3色スクランブル", detail: "8x8・スコア・3人戦", players: "3", board: "8", win: "score", corner: "" },
  { title: "角から始まる攻防", detail: "8x8・通常・2人戦・1P角スタート", players: "2", board: "8", win: "classic", corner: "1" },
  { title: "4色スプリント", detail: "6x6・スコア・4人戦", players: "4", board: "6", win: "score", corner: "" },
  { title: "王道を制覇せよ", detail: "8x8・通常・2人戦", players: "2", board: "8", win: "classic", corner: "" },
  { title: "3人逆転バトル", detail: "6x6・逆転・3人戦", players: "3", board: "6", win: "reverse", corner: "" },
];

const COPY = {
  ja: {
    title: "今日の一局",
    lead: (challenge) => `「${challenge.title}」に挑戦。1Pで1位を目指そう。`,
    incomplete: "本日は未達成",
    complete: "本日の挑戦クリア",
    streak: (days) => `連続 ${days}日`,
    daily: "今日の挑戦を始める",
    replay: "達成済み・もう一度",
    cpu: "CPUとすぐ遊ぶ",
    chaos: "おまかせカオス",
    mission: "今日の挑戦",
    objective: "1Pで1位を目指そう",
    success: "今日の挑戦、達成",
    successLead: "見事1位。明日は別のルールが待っています。",
    retry: "今日の挑戦、あと一歩",
    retryLead: "同じルールですぐ再挑戦できます。",
  },
  en: {
    title: "Today's match",
    lead: () => "A fresh CPU rule set awaits. Finish first as 1P.",
    incomplete: "Not cleared today",
    complete: "Today's challenge cleared",
    streak: (days) => `${days}-day streak`,
    daily: "Start today's challenge",
    replay: "Cleared · Play again",
    cpu: "Quick CPU match",
    chaos: "Surprise chaos",
    mission: "Today's challenge",
    objective: "Finish first as 1P",
    success: "Challenge cleared",
    successLead: "First place secured. A new rule arrives tomorrow.",
    retry: "Almost there",
    retryLead: "Replay the same rules and try again.",
  },
  fr: {
    title: "Match du jour", lead: () => "Un nouveau défi contre le CPU. Terminez premier avec 1P.",
    incomplete: "Pas encore réussi", complete: "Défi du jour réussi", streak: (days) => `${days} jours de suite`,
    daily: "Lancer le défi", replay: "Réussi · Rejouer", cpu: "Partie CPU rapide", chaos: "Chaos surprise",
    mission: "Défi du jour", objective: "Finissez premier avec 1P", success: "Défi réussi",
    successLead: "Première place assurée. Une nouvelle règle arrive demain.", retry: "Presque réussi",
    retryLead: "Rejouez avec les mêmes règles.",
  },
  es: {
    title: "Partida de hoy", lead: () => "Te espera un nuevo reto contra la CPU. Termina primero con 1P.",
    incomplete: "Aún sin completar", complete: "Reto de hoy completado", streak: (days) => `${days} días seguidos`,
    daily: "Empezar el reto", replay: "Completado · Repetir", cpu: "Partida rápida CPU", chaos: "Caos sorpresa",
    mission: "Reto de hoy", objective: "Termina primero con 1P", success: "Reto completado",
    successLead: "Primer puesto conseguido. Mañana habrá otra regla.", retry: "Casi lo tienes",
    retryLead: "Vuelve a intentarlo con las mismas reglas.",
  },
  de: {
    title: "Heutiges Match", lead: () => "Eine neue CPU-Herausforderung wartet. Werde mit 1P Erster.",
    incomplete: "Heute noch offen", complete: "Heutige Aufgabe geschafft", streak: (days) => `${days} Tage in Folge`,
    daily: "Aufgabe starten", replay: "Geschafft · Nochmal", cpu: "Schnelles CPU-Spiel", chaos: "Überraschungschaos",
    mission: "Heutige Aufgabe", objective: "Werde mit 1P Erster", success: "Aufgabe geschafft",
    successLead: "Platz eins erreicht. Morgen wartet eine neue Regel.", retry: "Fast geschafft",
    retryLead: "Versuche es mit denselben Regeln erneut.",
  },
  ko: {
    title: "오늘의 한 판", lead: () => "매일 바뀌는 CPU 규칙에 도전하고 1P로 1위를 노리세요.",
    incomplete: "오늘은 아직 미완료", complete: "오늘의 도전 완료", streak: (days) => `${days}일 연속`,
    daily: "오늘의 도전 시작", replay: "완료 · 다시 하기", cpu: "CPU와 바로 하기", chaos: "랜덤 카오스",
    mission: "오늘의 도전", objective: "1P로 1위를 노리세요", success: "도전 완료",
    successLead: "1위를 달성했습니다. 내일은 새로운 규칙이 열립니다.", retry: "조금만 더",
    retryLead: "같은 규칙으로 다시 도전하세요.",
  },
  zh: {
    title: "今日对局", lead: () => "挑战每日变化的电脑规则，用1P争夺第一名。",
    incomplete: "今日尚未完成", complete: "今日挑战已完成", streak: (days) => `连续 ${days} 天`,
    daily: "开始今日挑战", replay: "已完成 · 再玩一次", cpu: "快速电脑对局", chaos: "随机混战",
    mission: "今日挑战", objective: "用1P争夺第一名", success: "挑战完成",
    successLead: "成功获得第一名。明天会有新的规则。", retry: "还差一点",
    retryLead: "使用相同规则再次挑战。",
  },
};

const RULE_COPY = {
  ja: { classic: "通常", reverse: "逆転", score: "スコア", players: (n) => `${n}人戦`, corner: "角スタート" },
  en: { classic: "Classic", reverse: "Reverse", score: "Score", players: (n) => `${n} players`, corner: "corner start" },
  fr: { classic: "Classique", reverse: "Inversé", score: "Score", players: (n) => `${n} joueurs`, corner: "départ en coin" },
  es: { classic: "Clásico", reverse: "Inverso", score: "Puntuación", players: (n) => `${n} jugadores`, corner: "inicio en esquina" },
  de: { classic: "Klassisch", reverse: "Umkehr", score: "Punkte", players: (n) => `${n} Spieler`, corner: "Eckenstart" },
  ko: { classic: "기본", reverse: "역전", score: "점수", players: (n) => `${n}인전`, corner: "모서리 시작" },
  zh: { classic: "经典", reverse: "反转", score: "积分", players: (n) => `${n}人对局`, corner: "角落开局" },
};

const CHAOS_PRESETS = [
  { players: "3", board: "6", win: "score", corner: "" },
  { players: "3", board: "8", win: "reverse", corner: "" },
  { players: "4", board: "6", win: "score", corner: "" },
  { players: "4", board: "8", win: "classic", corner: "2" },
];

const els = {
  form: document.querySelector("#settingsForm"),
  language: document.querySelector("#languageSelect"),
  players: document.querySelector("#playerCountSelect"),
  board: document.querySelector("#boardSizeSelect"),
  win: document.querySelector("#winModeSelect"),
  corner: document.querySelector("#cornerBoostSelect"),
  cpu: document.querySelector("#cpuModeSelect"),
  title: document.querySelector("#quickLaunchTitle"),
  text: document.querySelector("#dailyChallengeText"),
  status: document.querySelector("#dailyChallengeStatus"),
  streak: document.querySelector("#dailyStreak"),
  dailyButton: document.querySelector("#dailyChallengeButton"),
  cpuButton: document.querySelector("#quickCpuButton"),
  chaosButton: document.querySelector("#randomChaosButton"),
  mission: document.querySelector("#challengeMission"),
  missionTitle: document.querySelector("#challengeMissionTitle"),
  missionRules: document.querySelector("#challengeMissionRules"),
  resultPanel: document.querySelector("#resultPanel"),
  resultCard: document.querySelector(".result-card"),
  ranking: document.querySelector("#rankingList"),
  playAgain: document.querySelector("#playAgainButton"),
};

let activeMode = sessionStorage.getItem(ACTIVE_KEY) || "";
let resultWasVisible = false;

function languageCopy() {
  return COPY[els.language?.value] || COPY.en;
}

function challengeRulesLabel(challenge) {
  const copy = RULE_COPY[els.language?.value] || RULE_COPY.en;
  return [
    `${challenge.board}x${challenge.board}`,
    copy[challenge.win],
    copy.players(challenge.players),
    challenge.corner ? copy.corner : "",
  ].filter(Boolean).join(" · ");
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayIndex(date = new Date()) {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
}

function todayChallenge() {
  return CHALLENGES[Math.abs(dayIndex()) % CHALLENGES.length];
}

function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { completed: Array.isArray(value.completed) ? value.completed.slice(-60) : [] };
  } catch {
    return { completed: [] };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function streakDays(completed) {
  const dates = new Set(completed);
  const cursor = new Date();
  if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function setSelect(select, value) {
  if (!select) return;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyRules(rules) {
  setSelect(els.players, rules.players);
  setSelect(els.board, rules.board);
  setSelect(els.win, rules.win);
  setSelect(els.corner, rules.corner || "");
  setSelect(els.cpu, "opponents");
}

function launch(rules, mode) {
  els.resultCard?.querySelector(".challenge-result")?.remove();
  applyRules(rules);
  activeMode = mode;
  sessionStorage.setItem(ACTIVE_KEY, mode);
  els.form.dataset.engagementLaunch = mode;
  updateMission();
  els.form.requestSubmit();
  delete els.form.dataset.engagementLaunch;
}

function updateMission() {
  const isDaily = activeMode === "daily";
  els.mission?.classList.toggle("is-hidden", !isDaily);
  if (!isDaily) return;
  const copy = languageCopy();
  const challenge = todayChallenge();
  if (els.missionTitle) els.missionTitle.textContent = copy.objective;
  if (els.missionRules) els.missionRules.textContent = challengeRulesLabel(challenge);
  const label = els.mission?.querySelector("span");
  if (label) label.textContent = copy.mission;
}

function updateHome() {
  const copy = languageCopy();
  const challenge = todayChallenge();
  const progress = loadProgress();
  const completed = progress.completed.includes(dateKey());
  if (els.title) els.title.textContent = copy.title;
  if (els.text) els.text.textContent = copy.lead(challenge);
  if (els.status) els.status.textContent = completed ? copy.complete : copy.incomplete;
  if (els.streak) els.streak.textContent = copy.streak(streakDays(progress.completed));
  if (els.dailyButton) els.dailyButton.textContent = completed ? copy.replay : copy.daily;
  if (els.cpuButton) els.cpuButton.textContent = copy.cpu;
  if (els.chaosButton) els.chaosButton.textContent = copy.chaos;
  updateMission();
}

function winnerIsPlayerOne() {
  const first = els.ranking?.querySelector("li")?.textContent || "";
  return /^\s*#1\s+1P\b/.test(first);
}

function renderChallengeResult(success) {
  if (!els.resultCard) return;
  let panel = els.resultCard.querySelector(".challenge-result");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "challenge-result";
    const ranking = els.resultCard.querySelector("#rankingList");
    els.resultCard.insertBefore(panel, ranking);
  }
  const copy = languageCopy();
  panel.classList.toggle("is-success", success);
  panel.innerHTML = `<span>${copy.mission}</span><strong>${success ? copy.success : copy.retry}</strong><p>${success ? copy.successLead : copy.retryLead}</p>`;
}

function completeDailyChallenge() {
  const success = winnerIsPlayerOne();
  if (success) {
    const progress = loadProgress();
    const today = dateKey();
    if (!progress.completed.includes(today)) {
      progress.completed.push(today);
      progress.completed = progress.completed.slice(-60);
      saveProgress(progress);
    }
  }
  renderChallengeResult(success);
  updateHome();
}

function handleResultVisibility() {
  const visible = Boolean(els.resultPanel && !els.resultPanel.classList.contains("is-hidden"));
  if (!visible || resultWasVisible) {
    resultWasVisible = visible;
    return;
  }
  resultWasVisible = true;
  if (activeMode === "daily") completeDailyChallenge();
}

els.dailyButton?.addEventListener("click", () => launch(todayChallenge(), "daily"));
els.cpuButton?.addEventListener("click", () => launch({ players: "2", board: "6", win: "classic", corner: "" }, "quick"));
els.chaosButton?.addEventListener("click", () => {
  const preset = CHAOS_PRESETS[Math.floor(Math.random() * CHAOS_PRESETS.length)];
  launch(preset, "chaos");
});

els.form?.addEventListener("submit", () => {
  if (els.form.dataset.engagementLaunch) return;
  activeMode = "";
  sessionStorage.removeItem(ACTIVE_KEY);
  els.resultCard?.querySelector(".challenge-result")?.remove();
  updateMission();
}, true);

els.playAgain?.addEventListener("click", () => {
  if (activeMode !== "daily" || !els.form) return;
  els.form.dataset.engagementLaunch = "daily";
  window.setTimeout(() => delete els.form.dataset.engagementLaunch, 0);
}, true);

els.language?.addEventListener("change", updateHome);

if (els.resultPanel) {
  new MutationObserver(handleResultVisibility).observe(els.resultPanel, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

updateHome();
