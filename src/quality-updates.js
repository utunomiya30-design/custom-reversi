const NAME_STORAGE_KEY = "customReversiPlayerName";
const LOCAL_RANKING_KEY = "customReversiLocalResults";

const els = {
  name: document.querySelector("#playerNameInput"),
  resultPanel: document.querySelector("#resultPanel"),
  rankingList: document.querySelector("#rankingList"),
  shareResult: document.querySelector("#shareResultButton"),
  resultCard: document.querySelector(".result-card"),
};

const RESULT_COPY = {
  ja: {
    label: "勝者の称号",
    titles: {
      1: "黒の盤上マスター",
      2: "白のひらめき王",
      3: "赤い大逆転職人",
      4: "青き盤面ジャック",
    },
  },
  en: {
    label: "Winner Title",
    titles: {
      1: "Black Board Master",
      2: "White Tactics Star",
      3: "Red Comeback Artist",
      4: "Blue Board Breaker",
    },
  },
  fr: {
    label: "Titre du vainqueur",
    titles: {
      1: "Maître noir du plateau",
      2: "Éclair blanc",
      3: "Artiste rouge du retour",
      4: "Stratège bleu",
    },
  },
  es: {
    label: "Título del ganador",
    titles: {
      1: "Maestro negro del tablero",
      2: "Genio blanco",
      3: "Artista rojo de remontadas",
      4: "Dominador azul",
    },
  },
  de: {
    label: "Titel des Siegers",
    titles: {
      1: "Schwarzer Brettmeister",
      2: "Weißer Taktikstar",
      3: "Roter Comeback-Künstler",
      4: "Blauer Brettstürmer",
    },
  },
  ko: {
    label: "승자의 칭호",
    titles: {
      1: "검은 판의 마스터",
      2: "하얀 번뜩임의 왕",
      3: "빨간 역전 장인",
      4: "파란 판의 지배자",
    },
  },
  zh: {
    label: "胜者称号",
    titles: {
      1: "黑棋盘面大师",
      2: "白棋灵感王",
      3: "红色逆转高手",
      4: "蓝色棋盘掌控者",
    },
  },
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

function resultCopy() {
  const language = document.querySelector("#languageSelect")?.value || "ja";
  return RESULT_COPY[language] || RESULT_COPY.en;
}

function winnerPlayer(lines) {
  const top = lines[0] || "";
  if (top.includes("4P") || top.includes("青") || top.includes("Blue")) return 4;
  if (top.includes("3P") || top.includes("赤") || top.includes("Red")) return 3;
  if (top.includes("2P") || top.includes("白") || top.includes("White")) return 2;
  return 1;
}

function winnerTitle(lines) {
  const copy = resultCopy();
  return copy.titles[winnerPlayer(lines)] || copy.titles[1];
}

function renderResultSpotlight(lines) {
  if (!els.resultCard || !lines.length) return;
  let panel = els.resultCard.querySelector(".result-spotlight");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "result-spotlight";
    els.resultCard.insertBefore(panel, els.rankingList);
  }

  const copy = resultCopy();
  panel.innerHTML = `
    <span>${copy.label}</span>
    <strong>${winnerTitle(lines)}</strong>
    <p>${lines[0]} / ${currentRulesLabel()}</p>
  `;
}

function burstResult() {
  if (!els.resultCard) return;
  const colors = ["#171715", "#f7f2e7", "#d9362d", "#1268d8", "#c88d28"];
  const layer = document.createElement("div");
  layer.className = "result-burst";
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", "50%");
    piece.style.setProperty("--y", "92px");
    piece.style.setProperty("--dx", `${Math.cos(index * 0.9) * (90 + (index % 4) * 18)}px`);
    piece.style.setProperty("--dy", `${Math.sin(index * 1.3) * (56 + (index % 3) * 14)}px`);
    piece.style.setProperty("--c", colors[index % colors.length]);
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
  renderResultSpotlight(lines);
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
