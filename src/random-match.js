import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import {
  EMPTY,
  applyMove,
  countStones,
  createInitialBoard,
  createScoreMap,
  getLegalMoves,
  getNextPlayer,
  rankPlayers,
  scoreBoard,
} from "./reversi-core.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIiqR-0frAfSNlMeXNfUqwNPs2fgsVQBw",
  authDomain: "custom-reversi.firebaseapp.com",
  databaseURL: "https://custom-reversi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "custom-reversi",
  storageBucket: "custom-reversi.firebasestorage.app",
  messagingSenderId: "735539430711",
  appId: "1:735539430711:web:c324fa54c6f6b9d899c6b2",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const WAITING_ROOM_TTL = 1000 * 60 * 10;
const RANDOM_QUEUE_PATH = "randomQueueV5/current";
const RANDOM_ROOMS_PATH = "randomRoomsV5";
const CLIENT_ID = crypto.randomUUID();
const PLAYER_COLORS = {
  1: "#141414",
  2: "#f7f3ea",
  3: "#f02f2f",
  4: "#176cff",
};
const PLAYER_LABELS = ["", "1P 黒", "2P 白", "3P 赤", "4P 青"];
const NAME_TEXT = {
  ja: { label: "あなたの名前", placeholder: "例: おぎ" },
  en: { label: "Your name", placeholder: "e.g. Ogi" },
  fr: { label: "Votre nom", placeholder: "ex. Ogi" },
  es: { label: "Tu nombre", placeholder: "p. ej. Ogi" },
  de: { label: "Dein Name", placeholder: "z. B. Ogi" },
  ko: { label: "내 이름", placeholder: "예: Ogi" },
  zh: { label: "你的名字", placeholder: "例如：Ogi" },
};

const els = {
  button: document.querySelector("#randomMatchButton"),
  status: document.querySelector("#onlineStatus"),
  gameStatus: document.querySelector("#gameOnlineStatus"),
  form: document.querySelector("#settingsForm"),
  setup: document.querySelector("#setupPanel"),
  play: document.querySelector("#playPanel"),
  result: document.querySelector("#resultPanel"),
  canvas: document.querySelector("#gameCanvas"),
  turn: document.querySelector("#turnLabel"),
  log: document.querySelector("#moveLog"),
  scores: document.querySelector("#scoreRow"),
  ranks: document.querySelector("#rankingList"),
  players: document.querySelector("#playerCountSelect"),
  board: document.querySelector("#boardSizeSelect"),
  win: document.querySelector("#winModeSelect"),
  corner: document.querySelector("#cornerBoostSelect"),
  cpu: document.querySelector("#cpuModeSelect"),
  language: document.querySelector("#languageSelect"),
  name: document.querySelector("#playerNameInput"),
  nameLabel: document.querySelector("#playerNameInput")?.closest("label")?.querySelector("span"),
};

const ctx = els.canvas?.getContext("2d");
let currentMatch = null;
let started = false;
let latestRoom = null;
let applyingMove = false;

function updateNameText() {
  const text = NAME_TEXT[els.language?.value] ?? NAME_TEXT.en;
  if (els.nameLabel) els.nameLabel.textContent = text.label;
  if (els.name) els.name.placeholder = text.placeholder;
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
  if (els.gameStatus && started) els.gameStatus.textContent = message;
}

function roomRef(roomId = currentMatch?.roomId) {
  return ref(database, `${RANDOM_ROOMS_PATH}/${roomId}`);
}

function clientId() {
  return CLIENT_ID;
}

function ownName() {
  return (els.name?.value || "").trim().replace(/\s+/g, " ").slice(0, 16);
}

function playerLabel(room, player) {
  const name = room?.playerNames?.[player]?.trim();
  return name ? `${PLAYER_LABELS[player]} ${name}` : PLAYER_LABELS[player];
}

function roomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

function rules() {
  return {
    language: els.language?.value || "ja",
    playerCount: Number(els.players?.value) || 2,
    boardSize: Number(els.board?.value) || 8,
    winMode: els.win?.value || "classic",
    cornerBoostPlayer: els.corner?.value ? Number(els.corner.value) : null,
    cpuMode: "none",
  };
}

function applyRoomRulesToControls(roomRules) {
  if (!roomRules) return;
  if (els.players) els.players.value = String(roomRules.playerCount);
  if (els.board) els.board.value = String(roomRules.boardSize);
  if (els.win) els.win.value = roomRules.winMode;
  if (els.corner) els.corner.value = roomRules.cornerBoostPlayer ? String(roomRules.cornerBoostPlayer) : "";
  if (els.cpu) els.cpu.value = "none";
}

function joinedCount(room) {
  return Object.values(room?.players ?? {}).filter(Boolean).length;
}

function createInitialOnlineState(room) {
  const board = createInitialBoard({
    size: room.rules.boardSize,
    playerCount: room.rules.playerCount,
    cornerBoostPlayer: room.rules.cornerBoostPlayer,
  });
  const next = getNextPlayer(board, room.rules.playerCount, room.rules.playerCount);
  return {
    board,
    currentPlayer: next.player ?? 1,
    finished: false,
    lastMessage: "ゲーム開始",
    winner: null,
    version: 1,
  };
}

async function claimSeat(id, ownClientId) {
  let seat = null;
  await runTransaction(ref(database, `${RANDOM_ROOMS_PATH}/${id}`), (room) => {
    if (!room) return room;

    const existing = Object.entries(room.players ?? {}).find(([, value]) => value === ownClientId);
    if (existing) {
      seat = Number(existing[0]);
      room.playerNames = room.playerNames ?? {};
      room.playerNames[seat] = ownName();
      room.updatedAt = Date.now();
      return room;
    }

    room.players = room.players ?? {};
    room.playerNames = room.playerNames ?? {};
    for (let player = 1; player <= room.rules.playerCount; player += 1) {
      if (!room.players[player]) {
        room.players[player] = ownClientId;
        room.playerNames[player] = ownName();
        room.updatedAt = Date.now();
        seat = player;
        break;
      }
    }

    return room;
  });
  return seat;
}

async function createWaitingRoom(value, ownClientId) {
  const id = roomId();
  const now = Date.now();
  const room = {
    id,
    rules: value,
    players: { 1: ownClientId },
    playerNames: { 1: ownName() },
    board: null,
    currentPlayer: 1,
    finished: false,
    lastMessage: "",
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  await set(ref(database, `${RANDOM_ROOMS_PATH}/${id}`), room);
  await set(ref(database, RANDOM_QUEUE_PATH), { roomId: id, createdAt: now });
  return { roomId: id, seat: 1 };
}

async function findOrCreateMatch() {
  const value = rules();
  const ownClientId = clientId();
  const queueRef = ref(database, RANDOM_QUEUE_PATH);
  const queued = (await get(queueRef)).val();

  if (queued?.roomId && Date.now() - queued.createdAt < WAITING_ROOM_TTL) {
    const seat = await claimSeat(queued.roomId, ownClientId);
    const room = (await get(ref(database, `${RANDOM_ROOMS_PATH}/${queued.roomId}`))).val();
    if (seat && room) {
      if (joinedCount(room) >= room.rules.playerCount) await remove(queueRef);
      return { roomId: queued.roomId, seat };
    }
  }

  await remove(queueRef);
  return createWaitingRoom(value, ownClientId);
}

async function initializeRoomIfReady(room) {
  if (!room || room.board || joinedCount(room) < room.rules.playerCount) return;
  await runTransaction(roomRef(room.id), (current) => {
    if (!current || current.board || joinedCount(current) < current.rules.playerCount) return current;
    return {
      ...current,
      ...createInitialOnlineState(current),
      updatedAt: Date.now(),
    };
  });
}

function startGameOnce(room) {
  if (started || !room || joinedCount(room) < room.rules.playerCount || !room.board) return;
  started = true;
  applyRoomRulesToControls(room.rules);
  els.form?.requestSubmit();
  setStatus(`マッチ成立: ${currentMatch.roomId.toUpperCase()} / あなたは ${playerLabel(room, currentMatch.seat)}`);
  renderRoom(room);
}

function cellFromEvent(event) {
  if (!els.canvas || !latestRoom) return null;
  const rect = els.canvas.getBoundingClientRect();
  const size = latestRoom.rules.boardSize;
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  if (row < 0 || col < 0 || row >= size || col >= size) return null;
  return { row, col };
}

function getPassedPlayers(previousPlayer, nextPlayer, playerCount) {
  if (!nextPlayer) return [];
  const passed = [];
  let player = (previousPlayer % playerCount) + 1;
  while (player !== nextPlayer) {
    passed.push(player);
    player = (player % playerCount) + 1;
  }
  return passed;
}

function formatCell(row, col) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

function formatMoveMessage(room, player, row, col) {
  return `${playerLabel(room, player)} ${formatCell(row, col)} に置きました`;
}

function formatPassMessage(room, player) {
  return `${playerLabel(room, player)} は置けないためパス`;
}

async function submitMove(row, col) {
  if (!currentMatch || !latestRoom || latestRoom.finished || applyingMove) return;
  if (latestRoom.currentPlayer !== currentMatch.seat) {
    setStatus(`あなたは ${playerLabel(latestRoom, currentMatch.seat)} / 現在は ${playerLabel(latestRoom, latestRoom.currentPlayer)} のターンです`);
    return;
  }

  applyingMove = true;
  try {
    await runTransaction(roomRef(), (room) => {
      if (!room || room.finished || !room.board) return room;
      if (room.players?.[room.currentPlayer] !== clientId()) return room;

      const previousPlayer = room.currentPlayer;
      const result = applyMove(room.board, row, col, previousPlayer);
      if (!result.ok) return room;

      const next = getNextPlayer(result.board, previousPlayer, room.rules.playerCount);
      const messages = [formatMoveMessage(room, previousPlayer, row, col)];
      for (const player of getPassedPlayers(previousPlayer, next.player, room.rules.playerCount)) {
        messages.push(formatPassMessage(room, player));
      }

      room.board = result.board;
      room.lastMessage = messages.join(" / ");
      room.updatedAt = Date.now();
      room.version = (room.version ?? 0) + 1;
      if (next.player === null) {
        room.finished = true;
        room.currentPlayer = previousPlayer;
      } else {
        room.currentPlayer = next.player;
      }
      return room;
    });
  } finally {
    applyingMove = false;
  }
}

function renderRoom(room) {
  latestRoom = room;
  if (!room?.board || !ctx || !els.canvas) return;

  if (room.finished) {
    renderResult(room);
    return;
  }

  if (started) {
    els.setup?.classList.add("is-hidden");
    els.result?.classList.add("is-hidden");
    els.play?.classList.remove("is-hidden");
  }

  if (els.turn) els.turn.textContent = `${playerLabel(room, room.currentPlayer)} のターン`;
  if (els.log) els.log.textContent = room.lastMessage ?? "";
  renderScores(room);
  drawBoard(room);
  setStatus(`あなたは ${playerLabel(room, currentMatch.seat)} / Room: ${room.id.toUpperCase()}`);
}

function renderScores(room) {
  if (!els.scores) return;
  const values = room.rules.winMode === "score"
    ? scoreBoard(room.board, room.rules.playerCount, createScoreMap(room.rules.boardSize))
    : countStones(room.board, room.rules.playerCount);
  const unit = room.rules.winMode === "score" ? "点" : "個";

  els.scores.replaceChildren();
  for (let player = 1; player <= room.rules.playerCount; player += 1) {
    const pill = document.createElement("div");
    pill.className = "score-pill";
    pill.innerHTML = `
      <span class="stone-dot" style="background:${PLAYER_COLORS[player]}"></span>
      <strong>${playerLabel(room, player)}</strong>
      <span>${values[player]} ${unit}</span>
    `;
    els.scores.append(pill);
  }
}

function drawBoard(room) {
  const size = room.rules.boardSize;
  const cell = els.canvas.width / size;
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.fillStyle = "rgba(32, 93, 71, 0.92)";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.strokeStyle = "rgba(255, 253, 247, 0.46)";
  ctx.lineWidth = Math.max(1, Math.floor(cell * 0.02));

  for (let line = 0; line <= size; line += 1) {
    const position = Math.round(line * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, els.canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(els.canvas.width, position);
    ctx.stroke();
  }

  const legalMoves = new Set(getLegalMoves(room.board, room.currentPlayer).map((move) => `${move.row},${move.col}`));
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const player = room.board[row][col];
      const centerX = col * cell + cell / 2;
      const centerY = row * cell + cell / 2;
      if (player !== EMPTY) {
        drawStone(centerX, centerY, cell * 0.38, PLAYER_COLORS[player], player === 2);
      } else if (legalMoves.has(`${row},${col}`)) {
        drawLegalHint(centerX, centerY, cell * 0.13);
      }
    }
  }
}

function drawStone(x, y, radius, color, isLight) {
  const coloredStoneLighting = {
    [PLAYER_COLORS[3]]: { highlight: "#ff9a9a", shadow: "#b40000", edge: "rgba(180, 0, 0, 0.28)" },
    [PLAYER_COLORS[4]]: { highlight: "#9fc3ff", shadow: "#003aa8", edge: "rgba(0, 58, 168, 0.28)" },
  };
  const lighting = coloredStoneLighting[color];
  const gradient = ctx.createRadialGradient(x - radius * 0.32, y - radius * 0.36, radius * 0.1, x, y, radius);
  gradient.addColorStop(0, lighting?.highlight ?? (isLight ? "#ffffff" : "#5b5b5b"));
  gradient.addColorStop(0.58, color);
  gradient.addColorStop(1, lighting?.shadow ?? color);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = lighting?.edge ?? (isLight ? "rgba(0, 0, 0, 0.32)" : "rgba(0, 0, 0, 0.5)");
  ctx.lineWidth = lighting ? 1.2 : 2.5;
  ctx.stroke();
}

function drawLegalHint(x, y, radius) {
  ctx.fillStyle = "rgba(255, 253, 247, 0.62)";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function renderResult(room) {
  const values = room.rules.winMode === "score"
    ? scoreBoard(room.board, room.rules.playerCount, createScoreMap(room.rules.boardSize))
    : countStones(room.board, room.rules.playerCount);
  const ranking = rankPlayers(values, room.rules.winMode === "reverse" ? "reverse" : "classic");
  const unit = room.rules.winMode === "score" ? "点" : "個";

  els.ranks?.replaceChildren();
  for (const [index, entry] of ranking.entries()) {
    const item = document.createElement("li");
    item.innerHTML = `<span>${index + 1}位 ${playerLabel(room, entry.player)}</span><span class="rank-value">${entry.value} ${unit}</span>`;
    els.ranks?.append(item);
  }

  els.play?.classList.add("is-hidden");
  els.result?.classList.remove("is-hidden");
  setStatus(`対戦終了 / Room: ${room.id.toUpperCase()}`);
}

function attachRoomListeners() {
  onValue(roomRef(), async (snapshot) => {
    const room = snapshot.val();
    if (!room) return;
    latestRoom = room;
    const count = joinedCount(room);
    if (!started) setStatus(`対戦相手を探しています... ${count}/${room.rules.playerCount}`);
    await initializeRoomIfReady(room);
    startGameOnce(room);
    if (started) renderRoom(room);
  });
}

els.button?.addEventListener("click", async () => {
  els.button.disabled = true;
  setStatus("対戦相手を探しています...");
  try {
    currentMatch = await findOrCreateMatch();
    attachRoomListeners();
  } catch (error) {
    console.error(error);
    setStatus("ランダムマッチに失敗しました。Firebaseのルール設定を確認してください。");
    els.button.disabled = false;
  }
});

els.canvas?.addEventListener("click", (event) => {
  if (!currentMatch || !started) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const cell = cellFromEvent(event);
  if (!cell) return;
  submitMove(cell.row, cell.col);
}, true);

els.language?.addEventListener("change", updateNameText);
updateNameText();
