const COPY = {
  ja: {
    summaryTitle: "現在のルール",
    matchNote: "ランダムマッチは先に待っている相手の設定で開始します。途中で詰まったら対戦をリセットできます。",
    board: "盤面",
    players: "人数",
    win: "勝利条件",
    corner: "角スタート",
    cpu: "CPU",
    none: "なし",
    classic: "通常",
    reverse: "逆転",
    score: "スコア",
    cpuNone: "なし",
    cpuOpponents: "2P以降",
    onlineHint: "名前を入れると対戦画面とスクショで見分けやすくなります。",
  },
  en: {
    summaryTitle: "Current Rules",
    matchNote: "Random Match starts with the waiting opponent's settings. Use Reset Match if a game gets stuck.",
    board: "Board",
    players: "Players",
    win: "Win",
    corner: "Corner",
    cpu: "CPU",
    none: "None",
    classic: "Classic",
    reverse: "Reverse",
    score: "Score",
    cpuNone: "None",
    cpuOpponents: "From 2P",
    onlineHint: "Add a name so the game screen and screenshots are easier to read.",
  },
  fr: {
    summaryTitle: "Règles actuelles",
    matchNote: "Le match aléatoire utilise les réglages de l'adversaire déjà en attente. Réinitialisez la partie si elle se bloque.",
    board: "Plateau",
    players: "Joueurs",
    win: "Victoire",
    corner: "Coin",
    cpu: "CPU",
    none: "Aucun",
    classic: "Classique",
    reverse: "Inversé",
    score: "Score",
    cpuNone: "Aucun",
    cpuOpponents: "Dès 2P",
    onlineHint: "Ajoutez un nom pour rendre l'écran et les captures plus lisibles.",
  },
  es: {
    summaryTitle: "Reglas actuales",
    matchNote: "La partida aleatoria usa los ajustes del rival que ya espera. Usa Reiniciar partida si se queda bloqueada.",
    board: "Tablero",
    players: "Jugadores",
    win: "Victoria",
    corner: "Esquina",
    cpu: "CPU",
    none: "Ninguno",
    classic: "Clásico",
    reverse: "Invertido",
    score: "Puntuación",
    cpuNone: "Ninguno",
    cpuOpponents: "Desde 2P",
    onlineHint: "Añade un nombre para que la pantalla y las capturas sean más claras.",
  },
  de: {
    summaryTitle: "Aktuelle Regeln",
    matchNote: "Das Zufallsmatch nutzt die Einstellungen des wartenden Gegners. Nutze Match zurücksetzen, falls es hängen bleibt.",
    board: "Brett",
    players: "Spieler",
    win: "Sieg",
    corner: "Ecke",
    cpu: "CPU",
    none: "Keine",
    classic: "Klassisch",
    reverse: "Umgekehrt",
    score: "Punkte",
    cpuNone: "Keine",
    cpuOpponents: "Ab 2P",
    onlineHint: "Mit Namen sind Spielanzeige und Screenshots leichter zu lesen.",
  },
  ko: {
    summaryTitle: "현재 규칙",
    matchNote: "랜덤 매치는 먼저 기다리는 상대의 설정으로 시작합니다. 막히면 대전 리셋을 사용할 수 있습니다.",
    board: "보드",
    players: "인원",
    win: "승리",
    corner: "코너",
    cpu: "CPU",
    none: "없음",
    classic: "일반",
    reverse: "역전",
    score: "점수",
    cpuNone: "없음",
    cpuOpponents: "2P부터",
    onlineHint: "이름을 넣으면 게임 화면과 스크린샷에서 구분하기 쉽습니다.",
  },
  zh: {
    summaryTitle: "当前规则",
    matchNote: "随机匹配会使用正在等待的对手设置。若对局卡住，可以重置对战。",
    board: "棋盘",
    players: "人数",
    win: "胜利",
    corner: "角落",
    cpu: "CPU",
    none: "无",
    classic: "普通",
    reverse: "反转",
    score: "得分",
    cpuNone: "无",
    cpuOpponents: "2P起",
    onlineHint: "输入名字后，游戏画面和截图会更容易辨认。",
  },
};

const selectors = {
  language: "#languageSelect",
  players: "#playerCountSelect",
  board: "#boardSizeSelect",
  win: "#winModeSelect",
  corner: "#cornerBoostSelect",
  cpu: "#cpuModeSelect",
  name: "#playerNameInput",
  setupIntro: "#setupIntro",
  onlinePanel: ".online-panel",
  scoreRow: "#scoreRow",
  turnLabel: "#turnLabel",
  onlineStatus: "#onlineStatus",
  gameOnlineStatus: "#gameOnlineStatus",
};

function $(selector) {
  return document.querySelector(selector);
}

function text() {
  return COPY[$(selectors.language)?.value] ?? COPY.en;
}

function selectedText(selector) {
  const select = $(selector);
  return select?.selectedOptions?.[0]?.textContent?.trim() || "";
}

function value(selector) {
  return $(selector)?.value || "";
}

function ensureSummary() {
  let summary = $("#ruleSummary");
  if (summary) return summary;
  summary = document.createElement("section");
  summary.id = "ruleSummary";
  summary.className = "rule-summary";
  summary.setAttribute("aria-live", "polite");
  $(selectors.setupIntro)?.after(summary);
  return summary;
}

function ensureOnlineHint() {
  let hint = $("#onlinePolishHint");
  if (hint) return hint;
  hint = document.createElement("p");
  hint.id = "onlinePolishHint";
  hint.className = "online-polish-hint";
  $(selectors.onlinePanel)?.append(hint);
  return hint;
}

function chip(label, body) {
  return `<span class="rule-chip"><b>${label}</b>${body}</span>`;
}

function updateSummary() {
  const t = text();
  const corner = value(selectors.corner) ? selectedText(selectors.corner) : t.none;
  const cpu = value(selectors.cpu) === "opponents" ? t.cpuOpponents : t.cpuNone;
  ensureSummary().innerHTML = `
    <div class="rule-summary-title">${t.summaryTitle}</div>
    <div class="rule-chip-row">
      ${chip(t.board, selectedText(selectors.board))}
      ${chip(t.players, selectedText(selectors.players))}
      ${chip(t.win, selectedText(selectors.win))}
      ${chip(t.corner, corner)}
      ${chip(t.cpu, cpu)}
    </div>
  `;
  ensureOnlineHint().textContent = `${t.matchNote} ${t.onlineHint}`;
}

function updateScoreFocus() {
  const turn = $(selectors.turnLabel)?.textContent || "";
  for (const pill of document.querySelectorAll(".score-pill")) {
    const label = pill.querySelector("strong")?.textContent || "";
    pill.classList.toggle("is-current", Boolean(label && turn.includes(label)));
  }
}

function updateStatusTone() {
  for (const node of [$(selectors.onlineStatus), $(selectors.gameOnlineStatus)]) {
    if (!node) continue;
    const content = node.textContent || "";
    node.classList.toggle("is-waiting", /探しています|Waiting|Recherche|Buscando|gesucht|찾는 중|寻找/.test(content));
    node.classList.toggle("is-room", /Room:|部屋|Salon|Sala|Raum|방:|房间/.test(content));
  }
}

function updateAll() {
  updateSummary();
  updateScoreFocus();
  updateStatusTone();
}

for (const selector of [selectors.language, selectors.players, selectors.board, selectors.win, selectors.corner, selectors.cpu, selectors.name]) {
  $(selector)?.addEventListener("change", updateAll);
  $(selector)?.addEventListener("input", updateAll);
}

new MutationObserver(updateAll).observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["class", "disabled"],
});

updateAll();
