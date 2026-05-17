import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  get,
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

const els = {
  button: document.querySelector("#randomMatchButton"),
  status: document.querySelector("#onlineStatus"),
  form: document.querySelector("#settingsForm"),
  setup: document.querySelector("#setupPanel"),
  play: document.querySelector("#playPanel"),
  canvas: document.querySelector("#gameCanvas"),
  players: document.querySelector("#playerCountSelect"),
  board: document.querySelector("#boardSizeSelect"),
  win: document.querySelector("#winModeSelect"),
  corner: document.querySelector("#cornerBoostSelect"),
  cpu: document.querySelector("#cpuModeSelect"),
};

let currentMatch = null;
let started = false;
let replayingRemoteMove = false;
const appliedRemoteMoves = new Set();

function setStatus(message) {
  if (els.status) els.status.textContent = message;
}

function clientId() {
  const key = "custom-reversi-random-client";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

function roomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

function rules() {
  return {
    playerCount: Number(els.players?.value) || 2,
    boardSize: Number(els.board?.value) || 8,
    winMode: els.win?.value || "classic",
    cornerBoostPlayer: els.corner?.value ? Number(els.corner.value) : null,
    cpuMode: "none",
  };
}

function matchKey(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function joinedCount(room) {
  return Object.values(room?.players ?? {}).filter(Boolean).length;
}

async function claimSeat(id, ownClientId) {
  let seat = null;
  const roomRef = ref(database, `randomRooms/${id}`);
  await runTransaction(roomRef, (room) => {
    if (!room) return room;

    const existing = Object.entries(room.players ?? {}).find(([, value]) => value === ownClientId);
    if (existing) {
      seat = Number(existing[0]);
      return room;
    }

    room.players = room.players ?? {};
    for (let player = 1; player <= room.rules.playerCount; player += 1) {
      if (!room.players[player]) {
        room.players[player] = ownClientId;
        room.updatedAt = Date.now();
        seat = player;
        break;
      }
    }

    return room;
  });
  return seat;
}

async function createWaitingRoom(value, ownClientId, key) {
  const id = roomId();
  const room = {
    id,
    rules: value,
    players: { 1: ownClientId },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(ref(database, `randomRooms/${id}`), room);
  await set(ref(database, `randomQueue/${key}`), { roomId: id, createdAt: Date.now() });
  return { roomId: id, seat: 1 };
}

async function findOrCreateMatch() {
  const value = rules();
  const key = matchKey(value);
  const ownClientId = clientId();
  const queueRef = ref(database, `randomQueue/${key}`);
  const queued = (await get(queueRef)).val();

  if (queued?.roomId && Date.now() - queued.createdAt < WAITING_ROOM_TTL) {
    const seat = await claimSeat(queued.roomId, ownClientId);
    const room = (await get(ref(database, `randomRooms/${queued.roomId}`))).val();
    if (seat && room) {
      if (joinedCount(room) >= room.rules.playerCount) await remove(queueRef);
      return { roomId: queued.roomId, seat };
    }
  }

  return createWaitingRoom(value, ownClientId, key);
}

function startGameOnce(room) {
  if (started || !room || joinedCount(room) < room.rules.playerCount) return;
  started = true;
  if (els.cpu) els.cpu.value = "none";
  els.form?.requestSubmit();
  setStatus(`マッチ成立: ${currentMatch.roomId.toUpperCase()} / あなたは ${currentMatch.seat}P`);
}

function cellFromEvent(event) {
  const rect = els.canvas.getBoundingClientRect();
  const size = Number(els.board?.value) || 8;
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  if (row < 0 || col < 0 || row >= size || col >= size) return null;
  return { row, col };
}

function replayMove(move) {
  if (!move || move.clientId === clientId() || appliedRemoteMoves.has(move.id) || !els.canvas) return;
  appliedRemoteMoves.add(move.id);
  const size = Number(els.board?.value) || 8;
  const rect = els.canvas.getBoundingClientRect();
  const x = rect.left + ((move.col + 0.5) / size) * rect.width;
  const y = rect.top + ((move.row + 0.5) / size) * rect.height;
  replayingRemoteMove = true;
  els.canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
  replayingRemoteMove = false;
}

function attachRoomListeners() {
  onValue(ref(database, `randomRooms/${currentMatch.roomId}`), (snapshot) => {
    const room = snapshot.val();
    if (!room) return;
    const count = joinedCount(room);
    if (!started) {
      setStatus(`対戦相手を探しています... ${count}/${room.rules.playerCount}`);
    }
    startGameOnce(room);
  });

  onValue(ref(database, `randomRooms/${currentMatch.roomId}/moves`), (snapshot) => {
    const moves = snapshot.val() ?? {};
    Object.entries(moves)
      .map(([id, move]) => ({ id, ...move }))
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach(replayMove);
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
  if (!currentMatch || !started || replayingRemoteMove) return;
  const cell = cellFromEvent(event);
  if (!cell) return;
  push(ref(database, `randomRooms/${currentMatch.roomId}/moves`), {
    ...cell,
    clientId: clientId(),
    seat: currentMatch.seat,
    createdAt: Date.now(),
  });
});
