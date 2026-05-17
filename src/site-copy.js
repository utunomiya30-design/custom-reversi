const INTRO_COPY = {
  ja: "盤面サイズ、人数、勝利条件を自由に変えて遊べるリバーシです。ランダムマッチでは先に待っている相手のルールに自動で合わせて、すぐにオンライン対戦できます。",
  en: "A customizable Reversi game where you can change the board size, player count, and win condition. Random Match automatically uses the waiting opponent's rules so you can jump into an online game quickly.",
  fr: "Un Reversi personnalisable où vous pouvez modifier la taille du plateau, le nombre de joueurs et la condition de victoire. Le match aléatoire adopte automatiquement les règles de l'adversaire en attente pour lancer vite une partie en ligne.",
  es: "Un Reversi personalizable donde puedes cambiar el tamaño del tablero, el número de jugadores y la condición de victoria. La partida aleatoria usa automáticamente las reglas del rival que ya está esperando para entrar rápido en línea.",
  de: "Ein anpassbares Reversi, bei dem du Brettgröße, Spielerzahl und Siegbedingung ändern kannst. Das Zufallsmatch übernimmt automatisch die Regeln des wartenden Gegners, damit du schnell online spielen kannst.",
  ko: "보드 크기, 플레이어 수, 승리 조건을 자유롭게 바꿔 즐기는 리버시입니다. 랜덤 매치는 먼저 기다리는 상대의 규칙에 자동으로 맞춰 빠르게 온라인 대전을 시작합니다.",
  zh: "这是一款可自定义棋盘大小、玩家人数和胜利条件的黑白棋。随机匹配会自动采用正在等待的对手规则，让你更快进入在线对战。",
};

function updateIntroCopy() {
  const language = document.querySelector("#languageSelect")?.value || "ja";
  const intro = document.querySelector("#setupIntro");
  if (intro) intro.textContent = INTRO_COPY[language] ?? INTRO_COPY.en;
}

document.querySelector("#languageSelect")?.addEventListener("change", () => {
  window.setTimeout(updateIntroCopy, 0);
});

updateIntroCopy();
