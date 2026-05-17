const INTRO_COPY = {
  ja: "盤面サイズ、人数、勝利条件を自由に変えて遊べるリバーシです。友だちと同じ設定でランダムマッチを押すと、オンライン対戦もできます。",
  en: "A customizable Reversi game where you can change the board size, player count, and win condition. Pick the same settings as a friend and press Random Match to play online.",
  fr: "Un Reversi personnalisable où vous pouvez modifier la taille du plateau, le nombre de joueurs et la condition de victoire. Choisissez les mêmes réglages qu'un ami, puis lancez un match aléatoire pour jouer en ligne.",
  es: "Un Reversi personalizable donde puedes cambiar el tamaño del tablero, el número de jugadores y la condición de victoria. Elige los mismos ajustes que un amigo y pulsa Partida aleatoria para jugar en línea.",
  de: "Ein anpassbares Reversi, bei dem du Brettgröße, Spielerzahl und Siegbedingung ändern kannst. Wähle dieselben Einstellungen wie ein Freund und starte ein Zufallsmatch, um online zu spielen.",
  ko: "보드 크기, 플레이어 수, 승리 조건을 자유롭게 바꿔 즐기는 리버시입니다. 친구와 같은 설정을 고르고 랜덤 매치를 누르면 온라인 대전도 할 수 있습니다.",
  zh: "这是一款可自定义棋盘大小、玩家人数和胜利条件的黑白棋。和朋友选择相同设置后点击随机匹配，就可以在线对战。",
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
