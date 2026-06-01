const turnLabel = document.querySelector("#turnLabel");
const moveLog = document.querySelector("#moveLog");
const scoreRow = document.querySelector("#scoreRow");
const gameHeader = document.querySelector(".game-header");
const playPanel = document.querySelector("#playPanel");
const resultPanel = document.querySelector("#resultPanel");
const boardWrap = document.querySelector(".board-wrap");

let turnStartedAt = Date.now();
let timerId = null;
let lastTurnText = "";

const hud = document.createElement("div");
hud.className = "game-feel-hud";
hud.innerHTML = `
  <div class="game-feel-chip" id="turnTimerChip"><span>手番</span><strong>00:00</strong></div>
  <div class="game-feel-chip game-feel-last" id="lastMoveChip"><span>直前</span><strong>ゲーム開始</strong></div>
`;

gameHeader?.insertAdjacentElement("afterend", hud);

const timerChip = hud.querySelector("#turnTimerChip strong");
const lastMoveChip = hud.querySelector("#lastMoveChip strong");

function reactionLog(text) {
  return text.match(/^([1-4])P:\s*(.{1,40})$/);
}

function isVisible(node) {
  return node && !node.classList.contains("is-hidden");
}

function currentPlayerNumber() {
  const match = turnLabel?.textContent.match(/([1-4])P/);
  return match ? Number(match[1]) : null;
}

function updateCurrentScore() {
  const current = currentPlayerNumber();
  scoreRow?.querySelectorAll(".score-pill").forEach((pill) => {
    const match = pill.textContent.match(/([1-4])P/);
    pill.classList.toggle("is-current", Boolean(current && match && Number(match[1]) === current));
  });
}

function resetTurnTimerIfNeeded() {
  const text = turnLabel?.textContent.trim() || "";
  if (!text || text === lastTurnText) return;
  lastTurnText = text;
  turnStartedAt = Date.now();
  updateCurrentScore();
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  if (!timerChip) return;
  timerChip.textContent = isVisible(playPanel) && !isVisible(resultPanel)
    ? formatElapsed(Date.now() - turnStartedAt)
    : "00:00";
}

function updateLastMove() {
  if (!lastMoveChip || !moveLog) return;
  const text = moveLog.textContent.trim();
  const reaction = reactionLog(text);
  moveLog.classList.toggle("is-reaction-log", Boolean(reaction));
  if (reaction) {
    lastMoveChip.textContent = `リアクション ${reaction[1]}P「${reaction[2]}」`;
  } else if (text) {
    lastMoveChip.textContent = text;
  }
}

function pulseBoard() {
  if (!boardWrap) return;
  boardWrap.classList.remove("is-board-pulse");
  void boardWrap.offsetWidth;
  boardWrap.classList.add("is-board-pulse");
}

function boot() {
  updateCurrentScore();
  updateLastMove();
  resetTurnTimerIfNeeded();
  updateTimer();
  timerId = window.setInterval(updateTimer, 1000);
}

new MutationObserver(() => {
  resetTurnTimerIfNeeded();
  updateCurrentScore();
}).observe(turnLabel, { childList: true, characterData: true, subtree: true });

new MutationObserver(() => {
  updateLastMove();
  const text = moveLog?.textContent.trim() || "";
  if (text && !reactionLog(text)) pulseBoard();
}).observe(moveLog, { childList: true, characterData: true, subtree: true });

new MutationObserver(updateCurrentScore).observe(scoreRow, { childList: true, subtree: true });

window.addEventListener("pagehide", () => {
  if (timerId) window.clearInterval(timerId);
});

boot();
