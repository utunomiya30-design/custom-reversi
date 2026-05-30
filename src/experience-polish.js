const PRESET_COPY = {
  ja: {
    title: "おすすめモード",
    subtitle: "迷ったらここから",
    status: {
      classic: "定番8x8を選びました。迷ったらこのままゲーム開始でOKです。",
      chaos3: "3人スコア戦を選びました。横取り多めの人気モードです。",
      party4: "4人パーティを選びました。スクショ映えする大乱戦です。",
      reverse: "逆転モードを選びました。少ない石で勝つ変則戦です。",
      fallback: "おすすめモードを選びました。",
    },
    cards: {
      classic: ["定番", "まずは8x8", "ふつうのリバーシ感で、初見でもすぐ遊べます。"],
      chaos3: ["人気", "3人スコア戦", "横取りが起きやすく、最後まで順位が揺れます。"],
      party4: ["カオス", "4人パーティ", "色が入り乱れる、スクショ向きの大乱戦です。"],
      reverse: ["逆転", "少ない方が勝ち", "いつもの強手が罠になる、短時間の変則戦です。"],
    },
  },
  en: {
    title: "Recommended Modes",
    subtitle: "Start here",
    status: {
      classic: "Classic 8x8 selected. Press Start game when in doubt.",
      chaos3: "3-player score battle selected. Expect lots of steals.",
      party4: "4-player party selected. A chaotic board made for screenshots.",
      reverse: "Reverse mode selected. Fewer stones wins.",
      fallback: "Recommended mode selected.",
    },
    cards: {
      classic: ["Classic", "Start with 8x8", "A familiar Reversi feel for first-time players."],
      chaos3: ["Popular", "3-player score", "Scores swing until the final move."],
      party4: ["Chaos", "4-player party", "Four colors collide in a screenshot-friendly match."],
      reverse: ["Reverse", "Fewest wins", "Strong moves can become traps in this quick variant."],
    },
  },
  fr: {
    title: "Modes conseillés",
    subtitle: "Commencez ici",
    status: {
      classic: "Mode classique 8x8 sélectionné. Lancez la partie pour commencer.",
      chaos3: "Score à 3 joueurs sélectionné. Les retournements arrivent vite.",
      party4: "Partie à 4 joueurs sélectionnée. Un chaos parfait pour les captures.",
      reverse: "Mode inversé sélectionné. Le moins de pions gagne.",
      fallback: "Mode conseillé sélectionné.",
    },
    cards: {
      classic: ["Classique", "D'abord 8x8", "Une sensation proche du Reversi habituel."],
      chaos3: ["Populaire", "Score à 3", "Les places peuvent changer jusqu'au dernier coup."],
      party4: ["Chaos", "Partie à 4", "Quatre couleurs se disputent le plateau."],
      reverse: ["Inversé", "Le moins gagne", "Les bons coups habituels peuvent devenir des pièges."],
    },
  },
  es: {
    title: "Modos recomendados",
    subtitle: "Empieza aquí",
    status: {
      classic: "Clásico 8x8 seleccionado. Pulsa iniciar si no sabes qué elegir.",
      chaos3: "Puntuación de 3 jugadores seleccionada. Habrá muchos robos.",
      party4: "Fiesta de 4 jugadores seleccionada. Caos ideal para compartir.",
      reverse: "Modo inverso seleccionado. Gana quien tenga menos fichas.",
      fallback: "Modo recomendado seleccionado.",
    },
    cards: {
      classic: ["Clásico", "Empieza 8x8", "Sensación familiar para jugar al instante."],
      chaos3: ["Popular", "Puntuación 3P", "La clasificación cambia hasta el final."],
      party4: ["Caos", "Fiesta 4P", "Cuatro colores chocan en una gran batalla."],
      reverse: ["Inverso", "Menos gana", "Las jugadas fuertes pueden ser una trampa."],
    },
  },
  de: {
    title: "Empfohlene Modi",
    subtitle: "Hier starten",
    status: {
      classic: "Klassisch 8x8 ausgewählt. Damit kann man sofort loslegen.",
      chaos3: "3-Spieler-Punkte ausgewählt. Viele Führungswechsel warten.",
      party4: "4-Spieler-Party ausgewählt. Chaotisch und gut zum Teilen.",
      reverse: "Umkehrmodus ausgewählt. Weniger Steine gewinnen.",
      fallback: "Empfohlener Modus ausgewählt.",
    },
    cards: {
      classic: ["Klassisch", "Erst 8x8", "Vertrautes Reversi-Gefühl für den Einstieg."],
      chaos3: ["Beliebt", "3P-Punkte", "Die Rangfolge kippt bis zum letzten Zug."],
      party4: ["Chaos", "4P-Party", "Vier Farben kämpfen auf einem wilden Brett."],
      reverse: ["Umkehr", "Weniger gewinnt", "Starke Züge können plötzlich Fallen sein."],
    },
  },
  ko: {
    title: "추천 모드",
    subtitle: "처음이면 여기서",
    status: {
      classic: "기본 8x8을 선택했습니다. 바로 시작하기 좋습니다.",
      chaos3: "3인 점수전을 선택했습니다. 역전이 자주 나옵니다.",
      party4: "4인 파티를 선택했습니다. 공유하기 좋은 난전입니다.",
      reverse: "반전 모드를 선택했습니다. 돌이 적은 사람이 이깁니다.",
      fallback: "추천 모드를 선택했습니다.",
    },
    cards: {
      classic: ["기본", "8x8 시작", "처음 해도 바로 익숙한 리버시 감각."],
      chaos3: ["인기", "3인 점수전", "마지막까지 순위가 계속 흔들립니다."],
      party4: ["카오스", "4인 파티", "네 가지 색이 뒤섞이는 대난전."],
      reverse: ["반전", "적을수록 승리", "강한 수가 오히려 함정이 됩니다."],
    },
  },
  zh: {
    title: "推荐模式",
    subtitle: "先从这里开始",
    status: {
      classic: "已选择经典8x8。拿不定主意就直接开始吧。",
      chaos3: "已选择3人积分战。局势会不断翻转。",
      party4: "已选择4人派对。适合截图分享的大混战。",
      reverse: "已选择反转模式。棋子更少的人获胜。",
      fallback: "已选择推荐模式。",
    },
    cards: {
      classic: ["经典", "先玩8x8", "接近传统黑白棋，新手也能马上玩。"],
      chaos3: ["人气", "3人积分战", "排名会一直摇摆到最后一手。"],
      party4: ["混战", "4人派对", "四色交锋，很适合分享截图。"],
      reverse: ["反转", "更少者胜", "平时的强手可能变成陷阱。"],
    },
  },
};

const SELECTORS = {
  language: "#languageSelect",
  players: "#playerCountSelect",
  board: "#boardSizeSelect",
  win: "#winModeSelect",
  corner: "#cornerBoostSelect",
  cpu: "#cpuModeSelect",
  status: "#onlineStatus",
};

function currentCopy() {
  const language = document.querySelector(SELECTORS.language)?.value || "ja";
  return PRESET_COPY[language] || PRESET_COPY.en;
}

function updatePresetCopy() {
  const copy = currentCopy();
  const heading = document.querySelector(".quick-presets-head");
  if (heading) {
    heading.querySelector("span").textContent = copy.title;
    heading.querySelector("strong").textContent = copy.subtitle;
  }

  for (const button of document.querySelectorAll(".preset-card")) {
    const card = copy.cards[button.dataset.preset];
    if (!card) continue;
    button.querySelector("span").textContent = card[0];
    button.querySelector("strong").textContent = card[1];
    button.querySelector("small").textContent = card[2];
  }
}

function selectValue(selector, value) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.value = value;
  node.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyPreset(button) {
  selectValue(SELECTORS.players, button.dataset.players);
  selectValue(SELECTORS.board, button.dataset.board);
  selectValue(SELECTORS.win, button.dataset.win);
  selectValue(SELECTORS.corner, button.dataset.corner || "");
  selectValue(SELECTORS.cpu, button.dataset.cpu || "none");

  for (const card of document.querySelectorAll(".preset-card")) {
    card.classList.toggle("is-selected", card === button);
  }

  const copy = currentCopy();
  const status = document.querySelector(SELECTORS.status);
  if (status) status.textContent = copy.status[button.dataset.preset] || copy.status.fallback;
}

for (const button of document.querySelectorAll(".preset-card")) {
  button.addEventListener("click", () => applyPreset(button));
}

document.querySelector(SELECTORS.language)?.addEventListener("change", updatePresetCopy);
updatePresetCopy();
