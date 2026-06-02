import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, onValue, ref, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIiqR-0frAfSNLMeXNfUqwNPs2fgsVQBw",
  authDomain: "custom-reversi.firebaseapp.com",
  databaseURL: "https://custom-reversi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "custom-reversi",
  storageBucket: "custom-reversi.firebasestorage.app",
  messagingSenderId: "735539430711",
  appId: "1:735539430711:web:c324fa54c6f6b9d899c6b2",
};

const ROOM_PATHS = {
  manualRoomsV1: "manualRoomsV1",
  randomRoomsV5: "randomRoomsV5",
};
const REACTIONS = ["nice", "wow", "think", "oops"];
const REACTION_EMOJIS = {
  nice: "\u{1F44D}",
  wow: "\u{1F62E}",
  think: "\u{1F914}",
  oops: "\u{1F605}",
};
const COPY = {
  ja: {
    title: "リアクション",
    sent: "リアクションを送りました",
    offline: "オンライン対戦中に使えます",
    failed: "リアクションを送れませんでした。Firebaseルールを確認してください。",
    players: ["", "1P 黒", "2P 白", "3P 赤", "4P 青"],
    labels: { nice: "いいね", wow: "すごい", think: "考え中", oops: "しまった" },
  },
  en: {
    title: "Reactions",
    sent: "Reaction sent",
    offline: "Available during online matches",
    failed: "Could not send the reaction. Check Firebase rules.",
    players: ["", "1P Black", "2P White", "3P Red", "4P Blue"],
    labels: { nice: "Nice", wow: "Wow", think: "Thinking", oops: "Oops" },
  },
  fr: {
    title: "Réactions",
    sent: "Réaction envoyée",
    offline: "Disponible en partie en ligne",
    failed: "Impossible d'envoyer la réaction. Vérifiez les règles Firebase.",
    players: ["", "1P Noir", "2P Blanc", "3P Rouge", "4P Bleu"],
    labels: { nice: "Bien joué", wow: "Incroyable", think: "Je réfléchis", oops: "Oups" },
  },
  es: {
    title: "Reacciones",
    sent: "Reacción enviada",
    offline: "Disponible durante partidas online",
    failed: "No se pudo enviar la reacción. Revisa las reglas de Firebase.",
    players: ["", "1P Negro", "2P Blanco", "3P Rojo", "4P Azul"],
    labels: { nice: "Bien", wow: "Genial", think: "Pensando", oops: "Ups" },
  },
  de: {
    title: "Reaktionen",
    sent: "Reaktion gesendet",
    offline: "Während Online-Partien verfügbar",
    failed: "Reaktion konnte nicht gesendet werden. Prüfe die Firebase-Regeln.",
    players: ["", "1P Schwarz", "2P Weiß", "3P Rot", "4P Blau"],
    labels: { nice: "Stark", wow: "Wow", think: "Denke", oops: "Ups" },
  },
  ko: {
    title: "리액션",
    sent: "리액션을 보냈습니다",
    offline: "온라인 대전 중에 사용할 수 있습니다",
    failed: "리액션을 보낼 수 없습니다. Firebase 규칙을 확인하세요.",
    players: ["", "1P 검정", "2P 흰색", "3P 빨강", "4P 파랑"],
    labels: { nice: "좋아요", wow: "대단해", think: "생각 중", oops: "아차" },
  },
  zh: {
    title: "反应",
    sent: "已发送反应",
    offline: "在线对战中可用",
    failed: "无法发送反应。请检查 Firebase 规则。",
    players: ["", "1P 黑", "2P 白", "3P 红", "4P 蓝"],
    labels: { nice: "不错", wow: "厉害", think: "思考中", oops: "糟了" },
  },
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const els = {
  playPanel: document.querySelector("#playPanel"),
  status: document.querySelector("#gameOnlineStatus"),
  setupStatus: document.querySelector("#onlineStatus"),
  language: document.querySelector("#languageSelect"),
  playActions: document.querySelector(".play-actions"),
};

let currentRoomId = "";
let currentRoomPath = "";
let unsubscribeReaction = null;
let lastReactionId = "";
let toastTimer = null;

const panel = document.createElement("section");
panel.className = "reaction-panel is-hidden";
panel.setAttribute("aria-label", "リアクション");

const heading = document.createElement("strong");
heading.className = "reaction-title";

const buttons = document.createElement("div");
buttons.className = "reaction-buttons";

const status = document.createElement("p");
status.className = "reaction-status";
status.setAttribute("aria-live", "polite");

const toast = document.createElement("div");
toast.className = "reaction-toast";
toast.hidden = true;
toast.setAttribute("aria-live", "polite");

panel.append(heading, buttons, status, toast);
els.playActions?.after(panel);

function copy() {
  return COPY[els.language?.value] || COPY.en;
}

function currentOnlineRoomId() {
  const text = `${els.status?.textContent || ""} ${els.setupStatus?.textContent || ""}`;
  return text.match(/Room:\s*([a-z0-9]+)/i)?.[1]?.toLowerCase() || "";
}

function currentOnlineRoomPath() {
  if (document.body.dataset.onlineRoomPath) return document.body.dataset.onlineRoomPath;
  const params = new URLSearchParams(location.search);
  if (params.has("room")) return ROOM_PATHS.manualRoomsV1;
  return ROOM_PATHS.randomRoomsV5;
}

function ownPlayer() {
  const text = `${els.status?.textContent || ""} ${els.setupStatus?.textContent || ""}`;
  return Number(text.match(/([1-4])P/)?.[1] || 0) || null;
}

function playerName(player) {
  return copy().players[player] || `${player}P`;
}

function reactionLabel(kind) {
  return copy().labels[kind] || kind;
}

function reactionText(kind) {
  const emoji = REACTION_EMOJIS[kind] || "\u2728";
  return `${emoji} ${reactionLabel(kind)}`;
}

function renderButtonContent(button) {
  const kind = button.dataset.kind;
  const emoji = document.createElement("span");
  emoji.className = "reaction-button-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = REACTION_EMOJIS[kind] || "\u2728";

  const label = document.createElement("span");
  label.className = "reaction-button-label";
  label.textContent = reactionLabel(kind);

  button.setAttribute("aria-label", reactionLabel(kind));
  button.replaceChildren(emoji, label);
}

function setReactionStatus(message = "") {
  if (status.textContent === message) return;
  status.textContent = message;
}

function updateCopy() {
  const text = copy();
  heading.textContent = text.title;
  for (const button of buttons.querySelectorAll("button")) {
    renderButtonContent(button);
  }
  if (panel.classList.contains("is-hidden")) return;
  if (!currentOnlineRoomId()) setReactionStatus(text.offline);
}

function renderButtons() {
  buttons.replaceChildren();
  for (const kind of REACTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reaction-button";
    button.dataset.kind = kind;
    button.addEventListener("click", () => sendReaction(kind));
    buttons.append(button);
  }
  updateCopy();
}

function parseReactionMessage(room) {
  const message = room?.lastMessage || "";
  const match = message.match(/^([1-4])P:\s*(.{1,40})$/);
  if (!match) return null;
  return {
    id: `${room.updatedAt || 0}-${message}`,
    player: Number(match[1]),
    text: match[2],
  };
}

function showReaction(reaction) {
  if (!reaction?.id || reaction.id === lastReactionId) return;
  lastReactionId = reaction.id;
  toast.hidden = false;
  const player = document.createElement("strong");
  player.textContent = playerName(reaction.player);
  const message = document.createElement("span");
  message.textContent = reaction.text;
  toast.replaceChildren(player, message);
  toast.classList.remove("is-floating");
  void toast.offsetWidth;
  toast.classList.add("is-floating");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-floating");
  }, 2800);
}

function detachRoom() {
  if (unsubscribeReaction) unsubscribeReaction();
  unsubscribeReaction = null;
  currentRoomId = "";
  currentRoomPath = "";
}

function attachRoom(roomId, roomPath) {
  if (!roomId || !roomPath || (roomId === currentRoomId && roomPath === currentRoomPath)) return;
  detachRoom();
  currentRoomId = roomId;
  currentRoomPath = roomPath;
  unsubscribeReaction = onValue(ref(database, `${roomPath}/${roomId}`), (snapshot) => showReaction(parseReactionMessage(snapshot.val())), (error) => {
    console.warn("Reaction listener failed", error);
    setReactionStatus(copy().failed);
  });
}

function updateVisibility() {
  const roomId = currentOnlineRoomId();
  const roomPath = currentOnlineRoomPath();
  const playing = els.playPanel && !els.playPanel.classList.contains("is-hidden");
  panel.classList.toggle("is-hidden", !playing || !roomId);
  if (playing && roomId) {
    attachRoom(roomId, roomPath);
    setReactionStatus("");
  } else {
    detachRoom();
    if (playing) setReactionStatus(copy().offline);
  }
}

async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

async function sendReaction(kind) {
  const roomId = currentOnlineRoomId();
  const roomPath = currentOnlineRoomPath();
  const player = ownPlayer();
  if (!roomId || !roomPath || !player) {
    setReactionStatus(copy().offline);
    return;
  }

  const text = reactionText(kind);
  const reaction = {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    player,
    text,
    createdAt: Date.now(),
  };

  for (const button of buttons.querySelectorAll("button")) button.disabled = true;
  try {
    await ensureAuth();
    await update(ref(database, `${roomPath}/${roomId}`), {
      lastMessage: `${player}P: ${text}`,
      updatedAt: reaction.createdAt,
    });
    showReaction(reaction);
    setReactionStatus(copy().sent);
  } catch (error) {
    console.warn("Reaction failed", error);
    setReactionStatus(copy().failed);
  } finally {
    window.setTimeout(() => {
      for (const button of buttons.querySelectorAll("button")) button.disabled = false;
    }, 700);
  }
}

renderButtons();
new MutationObserver(updateVisibility).observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["class"],
});
els.language?.addEventListener("change", updateCopy);
updateVisibility();
