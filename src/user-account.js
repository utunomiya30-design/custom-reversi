import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
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

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
const POSTED_USER_RESULT_KEY = "customReversiPostedUserResultId";
const NAME_KEY = "customReversiPlayerName";

const els = {
  signIn: document.querySelector("#googleSignInButton"),
  signOut: document.querySelector("#signOutButton"),
  status: document.querySelector("#authStatus"),
  stats: document.querySelector("#accountStats"),
  games: document.querySelector("#statGames"),
  wins: document.querySelector("#statWins"),
  winRate: document.querySelector("#statWinRate"),
  bestScore: document.querySelector("#statBestScore"),
  historyPanel: document.querySelector("#matchHistoryPanel"),
  history: document.querySelector("#matchHistoryList"),
  resultPanel: document.querySelector("#resultPanel"),
  rankingList: document.querySelector("#rankingList"),
  name: document.querySelector("#playerNameInput"),
};

let currentUser = null;
let wasResultVisible = false;
let unsubscribeStats = null;
let unsubscribeHistory = null;

const AUTH_ERROR_MESSAGES = {
  "auth/unauthorized-domain": "この公開URLがFirebase Authenticationの承認済みドメインに入っていません。Firebase Authentication > Settings > 承認済みドメインに utunomiya30-design.github.io を追加してください。",
  "auth/operation-not-allowed": "Firebase AuthenticationでGoogleログインが有効になっていません。Sign-in methodでGoogleを有効にしてください。",
  "auth/popup-blocked": "ポップアップがブロックされました。リダイレクトログインに切り替えます。",
  "auth/popup-closed-by-user": "ログイン画面が閉じられました。もう一度ログインを押してください。",
  "auth/cancelled-popup-request": "ログイン処理が重なりました。少し待ってからもう一度押してください。",
};

function authErrorMessage(error) {
  const code = error?.code || "unknown";
  return AUTH_ERROR_MESSAGES[code] || `ログインできませんでした。Firebase Authenticationの設定を確認してください。(${code})`;
}

function selectedText(selector) {
  return document.querySelector(selector)?.selectedOptions?.[0]?.textContent?.trim() || "";
}

function currentRuleLabel() {
  return [
    selectedText("#playerCountSelect"),
    selectedText("#boardSizeSelect"),
    selectedText("#winModeSelect"),
  ].filter(Boolean).join(" / ");
}

function playerName() {
  return (els.name?.value || "").trim().replace(/\s+/g, " ").slice(0, 16);
}

function parseResult() {
  const rows = Array.from(els.rankingList?.querySelectorAll("li") || []);
  if (!rows.length) return null;
  const winnerText = rows[0].textContent.replace(/\s+/g, " ").trim();
  const score = Number(winnerText.match(/(-?\d+)\s*(?:個|点|stones|pts)?/)?.[1] ?? 0);
  const name = playerName();
  const won = Boolean(name && winnerText.includes(name));
  return {
    winner: winnerText.slice(0, 100),
    score,
    rules: currentRuleLabel().slice(0, 120),
    playerName: name,
    outcome: name ? (won ? "win" : "loss") : "played",
    createdAt: Date.now(),
  };
}

function resultLocalId(result) {
  return `${currentUser?.uid}|${result.winner}|${result.rules}|${Math.floor(result.createdAt / 10000)}`;
}

function renderStats(stats = {}) {
  const games = Number(stats.games || 0);
  const wins = Number(stats.wins || 0);
  const losses = Number(stats.losses || 0);
  const rate = games ? Math.round((wins / games) * 100) : 0;
  if (els.games) els.games.textContent = String(games);
  if (els.wins) els.wins.textContent = String(wins);
  if (els.winRate) els.winRate.textContent = `${rate}%`;
  if (els.bestScore) els.bestScore.textContent = String(stats.bestScore ?? 0);
  if (els.status && currentUser) {
    els.status.textContent = `${currentUser.displayName || "ログイン中"} の戦績を保存中: ${wins}勝 / ${losses}敗`;
  }
}

function shortDisplayName(user) {
  return (user?.displayName || "").slice(0, 40);
}

function shortPhotoURL(user) {
  return (user?.photoURL || "").slice(0, 300);
}

function renderHistory(snapshotValue) {
  const records = Object.values(snapshotValue || {}).sort((a, b) => b.createdAt - a.createdAt);
  els.history?.replaceChildren();
  for (const record of records) {
    const item = document.createElement("li");
    const result = record.outcome === "win" ? "勝利" : record.outcome === "loss" ? "敗北" : "記録";
    const date = new Date(record.createdAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" });
    item.innerHTML = `<span>${result} / ${record.winner}</span><small>${record.rules}<br>${date}</small>`;
    els.history?.append(item);
  }
}

function updateAuthUi(user) {
  currentUser = user;
  els.signIn?.classList.toggle("is-hidden", Boolean(user));
  els.signOut?.classList.toggle("is-hidden", !user);
  els.stats?.classList.toggle("is-hidden", !user);
  els.historyPanel?.classList.toggle("is-hidden", !user);

  if (!user) {
    if (els.status) els.status.textContent = "Googleログインすると、自分の戦績と最近の対戦履歴を保存できます。";
    renderStats();
    els.history?.replaceChildren();
    if (unsubscribeStats) unsubscribeStats();
    if (unsubscribeHistory) unsubscribeHistory();
    unsubscribeStats = null;
    unsubscribeHistory = null;
    return;
  }

  if (els.status) els.status.textContent = `${user.displayName || "ログイン中"} としてログインしました。`;
  unsubscribeStats = onValue(ref(database, `userStatsV1/${user.uid}`), (snapshot) => renderStats(snapshot.val() || {}));
  const historyQuery = query(ref(database, `matchHistoryV1/${user.uid}`), orderByChild("createdAt"), limitToLast(10));
  unsubscribeHistory = onValue(historyQuery, (snapshot) => renderHistory(snapshot.val() || {}));
}

async function saveResultForUser() {
  if (!currentUser) return;
  const result = parseResult();
  if (!result) return;
  const localId = resultLocalId(result);
  if (sessionStorage.getItem(POSTED_USER_RESULT_KEY) === localId) return;
  sessionStorage.setItem(POSTED_USER_RESULT_KEY, localId);

  await runTransaction(ref(database, `userStatsV1/${currentUser.uid}`), (stats) => {
    const next = stats || {};
    next.uid = currentUser.uid;
    next.displayName = shortDisplayName(currentUser);
    next.photoURL = shortPhotoURL(currentUser);
    next.games = Number(next.games || 0) + 1;
    next.wins = Number(next.wins || 0) + (result.outcome === "win" ? 1 : 0);
    next.losses = Number(next.losses || 0) + (result.outcome === "loss" ? 1 : 0);
    next.bestScore = Math.max(Number(next.bestScore || 0), Number(result.score || 0));
    next.lastPlayedAt = result.createdAt;
    next.updatedAt = Date.now();
    return next;
  });

  const historyRef = push(ref(database, `matchHistoryV1/${currentUser.uid}`));
  await set(historyRef, {
    winner: result.winner,
    score: result.score,
    rules: result.rules,
    playerName: result.playerName,
    outcome: result.outcome,
    createdAt: result.createdAt,
  });
}

function observeResult() {
  const visible = els.resultPanel && !els.resultPanel.classList.contains("is-hidden");
  if (visible && !wasResultVisible) saveResultForUser().catch((error) => console.warn("User result save failed", error));
  wasResultVisible = Boolean(visible);
}

function restoreName() {
  const saved = localStorage.getItem(NAME_KEY);
  if (saved && els.name && !els.name.value) els.name.value = saved;
}

els.signIn?.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((error) => {
    console.warn("Google sign-in failed", error);
    if (els.status) els.status.textContent = authErrorMessage(error);
    if (error?.code === "auth/popup-blocked") {
      signInWithRedirect(auth, provider).catch((redirectError) => {
        console.warn("Google redirect sign-in failed", redirectError);
        if (els.status) els.status.textContent = authErrorMessage(redirectError);
      });
    }
  });
});

els.signOut?.addEventListener("click", () => {
  signOut(auth).catch((error) => console.warn("Sign-out failed", error));
});

els.name?.addEventListener("input", () => {
  localStorage.setItem(NAME_KEY, playerName());
});

restoreName();
getRedirectResult(auth).catch((error) => {
  console.warn("Google redirect result failed", error);
  if (els.status) els.status.textContent = authErrorMessage(error);
});
onAuthStateChanged(auth, updateAuthUi);
observeResult();
if (els.resultPanel) {
  new MutationObserver(observeResult).observe(els.resultPanel, { attributes: true, attributeFilter: ["class"] });
}
