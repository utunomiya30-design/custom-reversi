const NAME_STORAGE_KEY = "customReversiPlayerName";
const LOCAL_RANKING_KEY = "customReversiLocalResults";

const els = {
  name: document.querySelector("#playerNameInput"),
  resultPanel: document.querySelector("#resultPanel"),
  rankingList: document.querySelector("#rankingList"),
  shareResult: document.querySelector("#shareResultButton"),
  resultCard: document.querySelector(".result-card"),
};

let resultWasVisible = false;

function restoreName() {
  if (!els.name) return;
  const saved = localStorage.getItem(NAME_STORAGE_KEY);
  if (saved && !els.name.value) els.name.value = saved;
  els.name.addEventListener("input", () => {
    localStorage.setItem(NAME_STORAGE_KEY, els.name.value.trim().slice(0, 16));
  });
}

function currentRulesLabel() {
  const playerCount = document.querySelector("#playerCountSelect")?.selectedOptions?.[0]?.textContent || "";
  const boardSize = document.querySelector("#boardSizeSelect")?.selectedOptions?.[0]?.textContent || "";
  const winMode = document.querySelector("#winModeSelect")?.selectedOptions?.[0]?.textContent || "";
  return [playerCount, boardSize, winMode].filter(Boolean).join(" / ");
}

function rankingLines() {
  return Array.from(els.rankingList?.querySelectorAll("li") || [])
    .map((item) => item.textContent.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function resultShareText() {
  const lines = rankingLines();
  const rules = currentRulesLabel();
  const header = "カスタム・リバーシの結果";
  const result = lines.length ? lines.join("\n") : "結果をシェアしました";
  return `${header}\n${rules}\n\n${result}\n\n${location.origin}${location.pathname}`;
}

async function shareResult(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const text = resultShareText();
  const url = `${location.origin}${location.pathname}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "カスタム・リバーシの結果", text, url });
      return;
    } catch {
      // Fall back to copying if the user cancels or the browser refuses share.
    }
  }

  await navigator.clipboard?.writeText(text);
  const intent = new URL("https://twitter.com/intent/tweet");
  intent.searchParams.set("text", text);
  window.open(intent.toString(), "_blank", "noopener,noreferrer");
}

function loadLocalResults() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_RANKING_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalResult(lines) {
  if (!lines.length) return loadLocalResults();
  const results = loadLocalResults();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: new Date().toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" }),
    rules: currentRulesLabel(),
    winner: lines[0],
  };
  const next = [record, ...results].slice(0, 5);
  localStorage.setItem(LOCAL_RANKING_KEY, JSON.stringify(next));
  return next;
}

function renderLocalResults(results) {
  if (!els.resultCard) return;
  let panel = els.resultCard.querySelector(".local-ranking-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "local-ranking-panel";
    els.resultCard.insertBefore(panel, els.resultCard.querySelector(".result-actions"));
  }

  panel.innerHTML = `
    <h3>最近のローカル結果</h3>
    <ol>${results.map((item) => `<li><strong>${item.winner}</strong><span>${item.rules}</span><small>${item.date}</small></li>`).join("")}</ol>
  `;
}

function burstResult() {
  if (!els.resultCard) return;
  const layer = document.createElement("div");
  layer.className = "result-burst";
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", `${Math.cos(index) * (80 + (index % 4) * 18)}px`);
    piece.style.setProperty("--y", `${Math.sin(index * 1.7) * (48 + (index % 3) * 12)}px`);
    piece.style.setProperty("--delay", `${index * 0.018}s`);
    layer.append(piece);
  }
  els.resultCard.append(layer);
  window.setTimeout(() => layer.remove(), 1300);
}

function handleResultVisibility() {
  const visible = els.resultPanel && !els.resultPanel.classList.contains("is-hidden");
  if (!visible || resultWasVisible) {
    resultWasVisible = Boolean(visible);
    return;
  }
  resultWasVisible = true;
  const lines = rankingLines();
  renderLocalResults(saveLocalResult(lines));
  burstResult();
}

restoreName();
els.shareResult?.addEventListener("click", shareResult, true);

if (els.resultPanel) {
  new MutationObserver(handleResultVisibility).observe(els.resultPanel, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
