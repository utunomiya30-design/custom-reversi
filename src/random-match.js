import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
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
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
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
  apiKey: "AIzaSyAIiqR-0frAfSNLMeXNfUqwNPs2fgsVQBw",
  authDomain: "custom-reversi.firebaseapp.com",
  databaseURL: "https://custom-reversi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "custom-reversi",
  storageBucket: "custom-reversi.firebasestorage.app",
  messagingSenderId: "735539430711",
  appId: "1:735539430711:web:c324fa54c6f6b9d899c6b2",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const auth = getAuth(app);
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
  cancelButton: document.querySelector("#cancelRandomMatchButton"),
  status: document.querySelector("#onlineStatus"),
  gameStatus: document.querySelector("#gameOnlineStatus"),
  form: document.querySelector("#settingsForm"),
  setup: document.querySelector("#setupPanel"),
  play: document.querySelector("#playPanel"),
  result: document.querySelector("#resultPanel"),
  canvas: document.querySelector("#gameCanvas"),
  resultCanvas: document.querySelector("#resultBoardCanvas"),
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
let matchPlayerName = "";
let lastSyncedName = "";
let unsubscribeRoom = null;

function scrollToPanel(panel = els.play) {
  requestAnimationFrame(() => {
    panel?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function updateNameText() {
  const text = NAME_TEXT[els.language?.value] ?? NAME_TEXT.en;
  if (els.nameLabel) els.nameLabel.textContent = text.label;
  if (els.name) els.name.placeholder = text.placeholder;
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
  if (els.gameStatus && started) els.gameStatus.textContent = message;
}

function setRandomMatchWaiting(isWaiting) {
  if (els.button) els.button.disabled = isWaiting;
  if (els.cancelButton) {
    els.cancelButton.classList.toggle("is-hidden", !isWaiting);
    els.cancelButton.disabled = !isWaiting;
  }
}

async function ensureGuestAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

function detachRoomListeners() {
  if (typeof unsubscribeRoom === "function") unsubscribeRoom();
  unsubscribeRoom = null;
}

function roomRef(roomId = currentMatch?.roomId) {
  return ref(database, `${RANDOM_ROOMS_PATH}/${roomId}`);
}

function clientId() {
  return CLIENT_ID;
}

function readOwnName() {
  return (els.name?.value || "").trim().replace(/\s+/g, " ").slice(0, 16);
}

function ownName() {
  return matchPlayerName || readOwnName();
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

async function removeMatchingQueue(roomIdValue) {
  const queueRef = ref(database, RANDOM_QUEUE_PATH);
  const queued = (await get(queueRef)).val();
  if (queued?.roomId === roomIdValue) await remove(queueRef);
}

async function cancelRandomMatch() {
  if (!currentMatch || started) return;

  const match = currentMatch;
  setRandomMatchWaiting(false);
  detachRoomListeners();
  setStatus("ランダムマッチをキャンセルしています...");

  try {
    let shouldRequeue = false;
    await runTransaction(ref(database, `${RANDOM_ROOMS_PATH}/${match.roomId}`), (room) => {
      if (!room || room.board) return room;
      const players = { ...(room.players ?? {}) };
      const playerNames = { ...(room.playerNames ?? {}) };
      if (players[match.seat] !== clientId()) return room;
      delete players[match.seat];
      delete playerNames[match.seat];
      const remaining = Object.values(players).filter(Boolean).length;
      if (remaining === 0 || match.seat === 1) return null;
      shouldRequeue = true;
      return {
        ...room,
        players,
        playerNames,
        updatedAt: Date.now(),
      };
    });
    if (shouldRequeue) {
      await set(ref(database, RANDOM_QUEUE_PATH), { roomId: match.roomId, createdAt: Date.now() });
    } else {
      await removeMatchingQueue(match.roomId);
    }
    currentMatch = null;
    latestRoom = null;
    setStatus("ランダムマッチをキャンセルしました");
  } catch (error) {
    console.error(error);
    currentMatch = match;
    attachRoomListeners();
    setRandomMatchWaiting(true);
    setStatus("キャンセルに失敗しました。もう一度押してください。");
  }
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

async function syncOwnName(room) {
  if (!currentMatch?.seat || !matchPlayerName || lastSyncedName === matchPlayerName) return;
  const seat = currentMatch.seat;
  if (room?.playerNames?.[seat] === matchPlayerName) {
    lastSyncedName = matchPlayerName;
    return;
  }
  lastSyncedName = matchPlayerName;
  await runTransaction(roomRef(room.id), (current) => {
    if (!current || current.players?.[seat] !== clientId()) return current;
    current.playerNames = current.playerNames ?? {};
    current.playerNames[seat] = matchPlayerName;
    current.updatedAt = Date.now();
    return current;
  });
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
  document.body.dataset.onlineRoomPath = RANDOM_ROOMS_PATH;
  setRandomMatchWaiting(false);
  applyRoomRulesToControls(room.rules);
  els.form?.requestSubmit();
  setStatus(`マッチ成立: ${currentMatch.roomId.toUpperCase()} / あなたは ${playerLabel(room, currentMatch.seat)}`);
  renderRoom(room);
  scrollToPanel();
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
    const wasPlaying = !els.play?.classList.contains("is-hidden");
    els.setup?.classList.add("is-hidden");
    els.result?.classList.add("is-hidden");
    els.play?.classList.remove("is-hidden");
    if (!wasPlaying) scrollToPanel();
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
    const dot = document.createElement("span");
    dot.className = "stone-dot";
    dot.style.background = PLAYER_COLORS[player];
    const label = document.createElement("strong");
    label.textContent = playerLabel(room, player);
    const value = document.createElement("span");
    value.textContent = `${values[player]} ${unit}`;
    pill.append(dot, label, value);
    els.scores.append(pill);
  }
}

function markerIndexes(size) {
  const inner = Math.max(1, Math.floor(size / 4));
  const outer = size - inner;
  return inner === outer ? [inner] : [inner, outer];
}

function drawBoardSurface(targetCtx, width, height) {
  const base = targetCtx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#2d765b");
  base.addColorStop(0.42, "#18553f");
  base.addColorStop(1, "#0c3429");
  targetCtx.fillStyle = base;
  targetCtx.fillRect(0, 0, width, height);
  const glow = targetCtx.createRadialGradient(width * 0.18, height * 0.16, 0, width * 0.18, height * 0.16, width * 0.82);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  glow.addColorStop(0.46, "rgba(255, 255, 255, 0.035)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0.22)");
  targetCtx.fillStyle = glow;
  targetCtx.fillRect(0, 0, width, height);
}

function drawBoard(room, canvas = els.canvas, showHints = true) {
  const targetCtx = canvas?.getContext("2d");
  if (!targetCtx || !room?.board) return;
  const size = room.rules.boardSize;
  const width = canvas.width;
  const height = canvas.height;
  const cell = width / size;
  targetCtx.clearRect(0, 0, width, height);
  drawBoardSurface(targetCtx, width, height);
  targetCtx.strokeStyle = "rgba(235, 226, 199, 0.58)";
  targetCtx.lineWidth = Math.max(1, Math.floor(cell * 0.018));

  for (let line = 0; line <= size; line += 1) {
    const position = Math.round(line * cell) + 0.5;
    targetCtx.beginPath();
    targetCtx.moveTo(position, 0);
    targetCtx.lineTo(position, height);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(0, position);
    targetCtx.lineTo(width, position);
    targetCtx.stroke();
  }

  const dots = markerIndexes(size);
  targetCtx.fillStyle = "rgba(246, 236, 205, 0.82)";
  targetCtx.strokeStyle = "rgba(21, 55, 42, 0.42)";
  for (const row of dots) {
    for (const col of dots) {
      targetCtx.beginPath();
      targetCtx.arc(col * cell, row * cell, Math.max(3.2, cell * 0.045), 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
    }
  }

  const legalMoves = showHints ? new Set(getLegalMoves(room.board, room.currentPlayer).map((move) => `${move.row},${move.col}`)) : new Set();
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const player = room.board[row][col];
      const centerX = col * cell + cell / 2;
      const centerY = row * cell + cell / 2;
      if (player !== EMPTY) {
        drawStone(targetCtx, centerX, centerY, cell * 0.38, PLAYER_COLORS[player], player === 2);
      } else if (legalMoves.has(`${row},${col}`)) {
        drawLegalHint(targetCtx, centerX, centerY, cell * 0.13);
      }
    }
  }
}

function drawStone(targetCtx, x, y, radius, color, isLight) {
  const coloredStoneLighting = {
    [PLAYER_COLORS[3]]: { highlight: "#ff9a9a", shadow: "#b40000", edge: "rgba(180, 0, 0, 0.28)" },
    [PLAYER_COLORS[4]]: { highlight: "#9fc3ff", shadow: "#003aa8", edge: "rgba(0, 58, 168, 0.28)" },
  };
  const lighting = coloredStoneLighting[color];
  targetCtx.save();
  targetCtx.shadowColor = "rgba(0, 0, 0, 0.34)";
  targetCtx.shadowBlur = radius * 0.18;
  targetCtx.shadowOffsetY = radius * 0.08;
  const gradient = targetCtx.createRadialGradient(x - radius * 0.32, y - radius * 0.36, radius * 0.1, x, y, radius);
  gradient.addColorStop(0, lighting?.highlight ?? (isLight ? "#ffffff" : "#5b5b5b"));
  gradient.addColorStop(0.58, color);
  gradient.addColorStop(1, lighting?.shadow ?? color);
  targetCtx.fillStyle = gradient;
  targetCtx.beginPath();
  targetCtx.arc(x, y, radius, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
  targetCtx.strokeStyle = lighting?.edge ?? (isLight ? "rgba(0, 0, 0, 0.32)" : "rgba(0, 0, 0, 0.5)");
  targetCtx.lineWidth = lighting ? 1.2 : 2.5;
  targetCtx.stroke();
}

function drawLegalHint(targetCtx, x, y, radius) {
  targetCtx.fillStyle = "rgba(255, 246, 216, 0.68)";
  targetCtx.beginPath();
  targetCtx.arc(x, y, radius, 0, Math.PI * 2);
  targetCtx.fill();
}

function renderResult(room) {
  drawBoard(room, els.resultCanvas, false);
  const values = room.rules.winMode === "score"
    ? scoreBoard(room.board, room.rules.playerCount, createScoreMap(room.rules.boardSize))
    : countStones(room.board, room.rules.playerCount);
  const ranking = rankPlayers(values, room.rules.winMode === "reverse" ? "reverse" : "classic");
  const unit = room.rules.winMode === "score" ? "点" : "個";

  els.ranks?.replaceChildren();
  for (const [index, entry] of ranking.entries()) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${index + 1}位 ${playerLabel(room, entry.player)}`;
    const value = document.createElement("span");
    value.className = "rank-value";
    value.textContent = `${entry.value} ${unit}`;
    item.append(label, value);
    els.ranks?.append(item);
  }

  els.play?.classList.add("is-hidden");
  els.result?.classList.remove("is-hidden");
  scrollToPanel(els.result);
  setStatus(`対戦終了 / Room: ${room.id.toUpperCase()}`);
}

function attachRoomListeners() {
  detachRoomListeners();
  unsubscribeRoom = onValue(roomRef(), async (snapshot) => {
    const room = snapshot.val();
    if (!room) {
      if (!started && currentMatch) {
        currentMatch = null;
        latestRoom = null;
        setRandomMatchWaiting(false);
        setStatus("ランダムマッチをキャンセルしました");
      }
      detachRoomListeners();
      return;
    }
    latestRoom = room;
    await syncOwnName(room);
    const count = joinedCount(room);
    if (!started) setStatus(`対戦相手を探しています... ${count}/${room.rules.playerCount}`);
    await initializeRoomIfReady(room);
    startGameOnce(room);
    if (started) renderRoom(room);
  });
}

els.button?.addEventListener("click", async () => {
  setRandomMatchWaiting(true);
  matchPlayerName = readOwnName();
  lastSyncedName = "";
  setStatus(auth.currentUser ? "対戦相手を探しています..." : "ゲストとしてオンライン接続中...");
  try {
    await ensureGuestAuth();
    setStatus("対戦相手を探しています...");
    currentMatch = await findOrCreateMatch();
    attachRoomListeners();
  } catch (error) {
    console.error(error);
    const code = error?.code || "unknown";
    const authHint = code === "auth/operation-not-allowed"
      ? "Firebase Authenticationの匿名ログインを有効にしてください。"
      : "Firebaseのルール設定を確認してください。";
    setStatus(`ランダムマッチに失敗しました。${authHint}(${code})`);
    setRandomMatchWaiting(false);
  }
});

els.cancelButton?.addEventListener("click", cancelRandomMatch);

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
