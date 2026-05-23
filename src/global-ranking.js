import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
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
const database = getDatabase(app);
const RESULTS_PATH = "globalResultsV1";
const POSTED_RESULT_KEY = "customReversiPostedResultId";

const resultPanel = document.querySelector("#resultPanel");
const rankingList = document.querySelector("#rankingList");
const resultCard = document.querySelector(".result-card");

let wasVisible = false;

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

function parseWinner() {
  const first = rankingList?.querySelector("li");
  if (!first) return null;
  const text = first.textContent.replace(/\s+/g, " ").trim();
  const score = Number(text.match(/(-?\d+)\s*(個|点|stones|pts)?/)?.[1] ?? 0);
  return {
    label: text,
    score,
  };
}

async function postResult() {
  const winner = parseWinner();
  if (!winner) return;
  const localId = `${winner.label}|${currentRuleLabel()}|${Date.now().toString().slice(0, -4)}`;
  if (sessionStorage.getItem(POSTED_RESULT_KEY) === localId) return;
  sessionStorage.setItem(POSTED_RESULT_KEY, localId);
  await push(ref(database, RESULTS_PATH), {
    winner: winner.label,
    score: winner.score,
    rules: currentRuleLabel(),
    name: document.querySelector("#playerNameInput")?.value?.trim().slice(0, 16) || "",
    createdAt: Date.now(),
  });
}

function ensurePanel() {
  let panel = document.querySelector(".global-ranking-panel");
  if (panel) return panel;
  panel = document.createElement("section");
  panel.className = "global-ranking-panel";
  panel.innerHTML = "<h3>みんなの最新リザルト</h3><ol></ol>";
  const localPanel = document.querySelector(".local-ranking-panel");
  if (localPanel) localPanel.after(panel);
  else resultCard?.append(panel);
  return panel;
}

function renderResults(records) {
  const panel = ensurePanel();
  const list = panel.querySelector("ol");
  list.replaceChildren();
  for (const record of records) {
    const item = document.createElement("li");
    const name = record.name ? ` / ${record.name}` : "";
    const date = new Date(record.createdAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" });
    item.innerHTML = `<span>${record.winner}${name}</span><small>${record.rules}<br>${date}</small>`;
    list.append(item);
  }
}

function watchGlobalResults() {
  const q = query(ref(database, RESULTS_PATH), orderByChild("createdAt"), limitToLast(10));
  onValue(q, (snapshot) => {
    const records = Object.values(snapshot.val() || {}).sort((a, b) => b.createdAt - a.createdAt);
    renderResults(records);
  });
}

function observeResult() {
  if (!resultPanel) return;
  const nowVisible = !resultPanel.classList.contains("is-hidden");
  if (nowVisible && !wasVisible) postResult().catch((error) => console.warn("Global result post failed", error));
  wasVisible = nowVisible;
}

watchGlobalResults();
observeResult();
new MutationObserver(observeResult).observe(resultPanel, { attributes: true, attributeFilter: ["class"] });
