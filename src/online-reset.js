import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, onValue, ref, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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
const database = getDatabase(app);
const RANDOM_ROOMS_PATH = "randomRoomsV5";

const playPanel = document.querySelector("#playPanel");
const resultPanel = document.querySelector("#resultPanel");
const playActions = document.querySelector(".play-actions");
const gameStatus = document.querySelector("#gameOnlineStatus");
const topStatus = document.querySelector("#onlineStatus");
const randomButton = document.querySelector("#randomMatchButton");

let activeRoomId = "";
let unsubscribeRoom = null;
let resetting = false;

const resetButton = document.createElement("button");
resetButton.type = "button";
resetButton.id = "onlineResetButton";
resetButton.textContent = "対戦をリセット";
resetButton.hidden = true;
playActions?.append(resetButton);

function currentRoomId() {
  const text = `${gameStatus?.textContent || ""} ${topStatus?.textContent || ""}`;
  return text.match(/Room:\s*([a-z0-9]+)/i)?.[1]?.toLowerCase() || "";
}

function isPlayingOnline() {
  return !playPanel?.classList.contains("is-hidden") && Boolean(currentRoomId());
}

function updateButtonVisibility() {
  const roomId = currentRoomId();
  resetButton.hidden = !isPlayingOnline();
  if (roomId && roomId !== activeRoomId) subscribeRoom(roomId);
}

function subscribeRoom(roomId) {
  if (unsubscribeRoom) unsubscribeRoom();
  activeRoomId = roomId;
  unsubscribeRoom = onValue(ref(database, `${RANDOM_ROOMS_PATH}/${roomId}`), (snapshot) => {
    const room = snapshot.val();
    if (room?.abandoned) reloadToTop(room.lastMessage || "対戦がリセットされました。");
  });
}

function reloadToTop(message) {
  if (resetting) return;
  resetting = true;
  try {
    sessionStorage.setItem("customReversiNotice", message);
  } catch {
    // Ignore storage failures; the reload still clears the stuck match state.
  }
  window.setTimeout(() => {
    window.location.href = `${window.location.origin}${window.location.pathname}`;
  }, 500);
}

async function resetOnlineMatch() {
  const roomId = currentRoomId();
  if (!roomId || resetting) return;
  resetButton.disabled = true;
  resetButton.textContent = "リセット中...";
  await runTransaction(ref(database, `${RANDOM_ROOMS_PATH}/${roomId}`), (room) => {
    if (!room) return room;
    room.abandoned = true;
    room.finished = true;
    room.lastMessage = "対戦がリセットされました。";
    room.updatedAt = Date.now();
    return room;
  });
  reloadToTop("対戦をリセットしました。もう一度ランダムマッチできます。");
}

resetButton.addEventListener("click", resetOnlineMatch);

window.addEventListener("DOMContentLoaded", () => {
  const notice = sessionStorage.getItem("customReversiNotice");
  if (!notice) return;
  sessionStorage.removeItem("customReversiNotice");
  if (topStatus) topStatus.textContent = notice;
  if (randomButton) randomButton.disabled = false;
  playPanel?.classList.add("is-hidden");
  resultPanel?.classList.add("is-hidden");
  document.querySelector("#setupPanel")?.classList.remove("is-hidden");
});

new MutationObserver(updateButtonVisibility).observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["class"],
});

updateButtonVisibility();
