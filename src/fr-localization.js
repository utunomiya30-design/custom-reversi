const LOCALES = {
  fr: {
    appTitle: "Reversi personnalisé",
    languageLabel: "Langue",
    lead: "Modifiez le nombre de joueurs, la taille du plateau et les conditions de victoire, puis jouez sur place.",
    playersLabel: "Joueurs",
    boardLabel: "Plateau",
    winModeLabel: "Condition de victoire",
    cornerBoostLabel: "Départ en coin",
    cpuModeLabel: "Joueurs CPU",
    nameLabel: "Votre nom",
    namePlaceholder: "ex. Ogi",
    backgroundLabel: "Image de fond",
    startButton: "Démarrer",
    shareRuleButton: "Partager cette règle",
    onlineTitle: "Salon en ligne",
    onlineLead: "Créez un salon et partagez l'URL pour jouer depuis un autre onglet ou navigateur.",
    createRoomButton: "Créer un salon",
    randomMatchButton: "Match aléatoire",
    roomCodeLabel: "Code du salon",
    joinRoomButton: "Rejoindre",
    nowPlaying: "Partie en cours",
    inviteButton: "Copier l'invitation",
    restartButton: "Recommencer",
    backButton: "Retour",
    resultKicker: "Résultat",
    finalResult: "Résultat final",
    playAgainButton: "Rejouer",
    shareResultButton: "Partager le résultat",
    adSlot: "Publicité",
    largeAdSlot: "Interstitiel / Grande bannière",
    playerOptions: { "2": "2 joueurs", "3": "3 joueurs", "4": "4 joueurs" },
    winOptions: { classic: "Classique", reverse: "Inversé", score: "Score" },
    cornerOptions: { "": "Aucun", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
    cpuOptions: { none: "Aucun", opponents: "CPU dès 2P" },
    players: ["", "1P Noir", "2P Blanc", "3P Rouge", "4P Bleu"],
    turn: "à jouer",
    gameStarted: "Partie lancée",
    placed: "a joué",
    pass: "ne peut pas jouer et passe",
    stones: "pions",
    points: "pts",
    looking: "Recherche d'un adversaire...",
    failed: "Le matchmaking a échoué. Vérifiez la configuration Firebase.",
    room: "Salon :",
    youAre: "Vous êtes",
    current: "Tour actuel :",
    found: "Match trouvé :",
    finished: "Partie terminée",
    rank: "e",
  },
  es: {
    appTitle: "Reversi personalizado",
    languageLabel: "Idioma",
    lead: "Cambia el tamaño del tablero, el número de jugadores y la condición de victoria, y juega al instante.",
    playersLabel: "Jugadores",
    boardLabel: "Tablero",
    winModeLabel: "Condición de victoria",
    cornerBoostLabel: "Inicio en esquinas",
    cpuModeLabel: "Jugadores CPU",
    nameLabel: "Tu nombre",
    namePlaceholder: "p. ej. Ogi",
    backgroundLabel: "Imagen de fondo",
    startButton: "Iniciar partida",
    shareRuleButton: "Compartir esta regla",
    onlineTitle: "Sala en línea",
    onlineLead: "Crea una sala y comparte la URL para jugar desde otra pestaña o navegador.",
    createRoomButton: "Crear sala",
    randomMatchButton: "Partida aleatoria",
    roomCodeLabel: "Código de sala",
    joinRoomButton: "Unirse",
    nowPlaying: "Partida en curso",
    inviteButton: "Copiar invitación",
    restartButton: "Reiniciar",
    backButton: "Volver",
    resultKicker: "Resultado",
    finalResult: "Resultado final",
    playAgainButton: "Jugar otra vez",
    shareResultButton: "Compartir resultado",
    adSlot: "Publicidad",
    largeAdSlot: "Intersticial / Banner grande",
    playerOptions: { "2": "2 jugadores", "3": "3 jugadores", "4": "4 jugadores" },
    winOptions: { classic: "Clásico", reverse: "Invertido", score: "Puntuación" },
    cornerOptions: { "": "Ninguno", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
    cpuOptions: { none: "Ninguno", opponents: "CPU desde 2P" },
    players: ["", "1P Negro", "2P Blanco", "3P Rojo", "4P Azul"],
    turn: "juega",
    gameStarted: "Partida iniciada",
    placed: "colocó",
    pass: "no puede mover y pasa",
    stones: "fichas",
    points: "pts",
    looking: "Buscando oponente...",
    failed: "La búsqueda de partida falló. Revisa la configuración de Firebase.",
    room: "Sala:",
    youAre: "Eres",
    current: "Turno actual:",
    found: "Partida encontrada:",
    finished: "Partida terminada",
    rank: "º",
  },
  de: {
    appTitle: "Custom Reversi",
    languageLabel: "Sprache",
    lead: "Ändere Brettgröße, Spielerzahl und Siegbedingung und spiele sofort los.",
    playersLabel: "Spieler",
    boardLabel: "Brett",
    winModeLabel: "Siegbedingung",
    cornerBoostLabel: "Eckenstart",
    cpuModeLabel: "CPU-Spieler",
    nameLabel: "Dein Name",
    namePlaceholder: "z. B. Ogi",
    backgroundLabel: "Hintergrundbild",
    startButton: "Spiel starten",
    shareRuleButton: "Diese Regel teilen",
    onlineTitle: "Online-Raum",
    onlineLead: "Erstelle einen Raum und teile die URL, um in einem anderen Tab oder Browser mitzuspielen.",
    createRoomButton: "Raum erstellen",
    randomMatchButton: "Zufallsmatch",
    roomCodeLabel: "Raumcode",
    joinRoomButton: "Beitreten",
    nowPlaying: "Partie läuft",
    inviteButton: "Einladung kopieren",
    restartButton: "Neu starten",
    backButton: "Zurück",
    resultKicker: "Ergebnis",
    finalResult: "Endergebnis",
    playAgainButton: "Noch einmal spielen",
    shareResultButton: "Ergebnis teilen",
    adSlot: "Werbung",
    largeAdSlot: "Interstitial / Großes Banner",
    playerOptions: { "2": "2 Spieler", "3": "3 Spieler", "4": "4 Spieler" },
    winOptions: { classic: "Klassisch", reverse: "Umgekehrt", score: "Punkte" },
    cornerOptions: { "": "Keine", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
    cpuOptions: { none: "Keine", opponents: "CPU ab 2P" },
    players: ["", "1P Schwarz", "2P Weiß", "3P Rot", "4P Blau"],
    turn: "ist am Zug",
    gameStarted: "Spiel gestartet",
    placed: "setzt",
    pass: "kann nicht setzen und passt",
    stones: "Steine",
    points: "Pkt.",
    looking: "Gegner wird gesucht...",
    failed: "Matchmaking fehlgeschlagen. Prüfe die Firebase-Konfiguration.",
    room: "Raum:",
    youAre: "Du bist",
    current: "Aktuell am Zug:",
    found: "Match gefunden:",
    finished: "Partie beendet",
    rank: ".",
  },
  ko: {
    appTitle: "커스텀 리버시",
    languageLabel: "언어",
    lead: "보드 크기, 플레이어 수, 승리 조건을 자유롭게 바꿔 바로 즐길 수 있는 리버시입니다.",
    playersLabel: "플레이어 수",
    boardLabel: "보드 크기",
    winModeLabel: "승리 조건",
    cornerBoostLabel: "코너 시작",
    cpuModeLabel: "CPU 플레이어",
    nameLabel: "내 이름",
    namePlaceholder: "예: Ogi",
    backgroundLabel: "배경 이미지",
    startButton: "게임 시작",
    shareRuleButton: "이 규칙 공유",
    onlineTitle: "온라인 방",
    onlineLead: "방을 만들고 URL을 공유하면 다른 탭이나 브라우저에서 참가할 수 있습니다.",
    createRoomButton: "방 만들기",
    randomMatchButton: "랜덤 매치",
    roomCodeLabel: "방 코드",
    joinRoomButton: "참가하기",
    nowPlaying: "게임 중",
    inviteButton: "초대 URL 복사",
    restartButton: "다시 시작",
    backButton: "돌아가기",
    resultKicker: "결과",
    finalResult: "최종 결과",
    playAgainButton: "다시 플레이",
    shareResultButton: "결과 공유",
    adSlot: "광고",
    largeAdSlot: "전면 광고 / 큰 배너",
    playerOptions: { "2": "2명", "3": "3명", "4": "4명" },
    winOptions: { classic: "일반", reverse: "역전", score: "점수" },
    cornerOptions: { "": "없음", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
    cpuOptions: { none: "없음", opponents: "2P부터 CPU" },
    players: ["", "1P 검정", "2P 흰색", "3P 빨강", "4P 파랑"],
    turn: "차례",
    gameStarted: "게임 시작",
    placed: "착수",
    pass: "둘 곳이 없어 패스",
    stones: "개",
    points: "점",
    looking: "상대를 찾는 중...",
    failed: "랜덤 매치에 실패했습니다. Firebase 설정을 확인해 주세요.",
    room: "방:",
    youAre: "내 색상:",
    current: "현재 차례:",
    found: "매치 성립:",
    finished: "대전 종료",
    rank: "위",
  },
  zh: {
    appTitle: "自定义黑白棋",
    languageLabel: "语言",
    lead: "可以自由更改棋盘大小、玩家人数和胜利条件，马上开始游玩的黑白棋。",
    playersLabel: "玩家人数",
    boardLabel: "棋盘大小",
    winModeLabel: "胜利条件",
    cornerBoostLabel: "角落开局",
    cpuModeLabel: "CPU 玩家",
    nameLabel: "你的名字",
    namePlaceholder: "例如：Ogi",
    backgroundLabel: "背景图片",
    startButton: "开始游戏",
    shareRuleButton: "分享此规则",
    onlineTitle: "在线房间",
    onlineLead: "创建房间并分享 URL 后，可从其他标签页或浏览器加入。",
    createRoomButton: "创建房间",
    randomMatchButton: "随机匹配",
    roomCodeLabel: "房间代码",
    joinRoomButton: "加入",
    nowPlaying: "游戏中",
    inviteButton: "复制邀请 URL",
    restartButton: "重新开始",
    backButton: "返回",
    resultKicker: "结果",
    finalResult: "最终结果",
    playAgainButton: "再玩一次",
    shareResultButton: "分享结果",
    adSlot: "广告",
    largeAdSlot: "插屏广告 / 大横幅",
    playerOptions: { "2": "2人", "3": "3人", "4": "4人" },
    winOptions: { classic: "普通", reverse: "反转", score: "得分" },
    cornerOptions: { "": "无", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
    cpuOptions: { none: "无", opponents: "2P 起为 CPU" },
    players: ["", "1P 黑", "2P 白", "3P 红", "4P 蓝"],
    turn: "的回合",
    gameStarted: "游戏开始",
    placed: "落子",
    pass: "无法落子，跳过",
    stones: "枚",
    points: "分",
    looking: "正在寻找对手...",
    failed: "随机匹配失败。请检查 Firebase 设置。",
    room: "房间:",
    youAre: "你是",
    current: "当前回合:",
    found: "匹配成功:",
    finished: "对战结束",
    rank: "名",
  },
};

const TEXT_SELECTORS = {
  appTitle: "[data-i18n='appTitle']",
  languageLabel: "[data-i18n='languageLabel']",
  lead: "[data-i18n='lead']",
  playersLabel: "[data-i18n='playersLabel']",
  boardLabel: "[data-i18n='boardLabel']",
  winModeLabel: "[data-i18n='winModeLabel']",
  cornerBoostLabel: "[data-i18n='cornerBoostLabel']",
  cpuModeLabel: "[data-i18n='cpuModeLabel']",
  backgroundLabel: "[data-i18n='backgroundLabel']",
  startButton: "[data-i18n='startButton']",
  shareRuleButton: "[data-i18n='shareRuleButton']",
  onlineTitle: "[data-i18n='onlineTitle']",
  onlineLead: "[data-i18n='onlineLead']",
  createRoomButton: "[data-i18n='createRoomButton']",
  roomCodeLabel: "[data-i18n='roomCodeLabel']",
  joinRoomButton: "[data-i18n='joinRoomButton']",
  nowPlaying: "[data-i18n='nowPlaying']",
  inviteButton: "[data-i18n='inviteButton']",
  restartButton: "[data-i18n='restartButton']",
  backButton: "[data-i18n='backButton']",
  resultKicker: "[data-i18n='resultKicker']",
  finalResult: "[data-i18n='finalResult']",
  playAgainButton: "[data-i18n='playAgainButton']",
  shareResultButton: "[data-i18n='shareResultButton']",
  adSlot: ".ad-slot-banner",
  largeAdSlot: ".ad-slot-result",
};

const BASE_PLAYERS = [
  [/(1P Black|1P 黒|1P Noir|1P Negro|1P Schwarz|1P 검정|1P 黑)/g, 1],
  [/(2P White|2P 白|2P Blanc|2P Blanco|2P Weiß|2P 흰색|2P 白)/g, 2],
  [/(3P Red|3P 赤|3P Rouge|3P Rojo|3P Rot|3P 빨강|3P 红)/g, 3],
  [/(4P Blue|4P 青|4P Bleu|4P Azul|4P Blau|4P 파랑|4P 蓝)/g, 4],
];

function currentText() {
  return LOCALES[document.querySelector("#languageSelect")?.value] ?? null;
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && typeof value === "string") node.textContent = value;
}

function translateSelect(id, labels) {
  const select = document.querySelector(id);
  if (!select) return;
  for (const option of select.options) {
    if (Object.hasOwn(labels, option.value)) option.textContent = labels[option.value];
  }
}

function localizePlayers(value, text) {
  let next = value;
  for (const [pattern, player] of BASE_PLAYERS) next = next.replace(pattern, text.players[player]);
  return next;
}

function localizeDynamic(value, text) {
  let next = localizePlayers(value, text);
  next = next.replace(/\bto move\b|のターン|à jouer|juega|ist am Zug|차례|的回合/g, text.turn);
  next = next.replace(/Game started|ゲーム開始|Partie lancée|Partida iniciada|Spiel gestartet|게임 시작|游戏开始/g, text.gameStarted);
  next = next.replace(/placed at|に置きました|a joué en|a joué|colocó|setzt|착수|落子/g, text.placed);
  next = next.replace(/has no legal move and passed|は置けないためパス|ne peut pas jouer et passe|no puede mover y pasa|kann nicht setzen und passt|둘 곳이 없어 패스|无法落子，跳过/g, text.pass);
  next = next.replace(/(\d+)\s*(stones|個|pions|fichas|Steine|개|枚)/g, `$1 ${text.stones}`);
  next = next.replace(/(\d+)\s*(点|pts|Pkt\.|점|分)/g, `$1 ${text.points}`);
  next = next.replace(/Looking for an opponent\.\.\.|対戦相手を探しています\.\.\.|Recherche d'un adversaire\.\.\.|Buscando oponente\.\.\.|Gegner wird gesucht\.\.\.|상대를 찾는 중\.\.\.|正在寻找对手\.\.\./g, text.looking);
  next = next.replace(/Random match|ランダムマッチ|Match aléatoire|Partida aleatoria|Zufallsmatch|랜덤 매치|随机匹配/g, text.randomMatchButton);
  next = next.replace(/Matchmaking failed|ランダムマッチに失敗しました。Firebaseのルール設定を確認してください。/g, text.failed);
  next = next.replace(/Room:|Salon :|Sala:|Raum:|방:|房间:/g, text.room);
  next = next.replace(/あなたは|Vous êtes|Eres|Du bist|내 색상:|你是/g, text.youAre);
  next = next.replace(/現在は|Tour actuel :|Turno actual:|Aktuell am Zug:|현재 차례:|当前回合:/g, text.current);
  next = next.replace(/マッチ成立:|Match trouvé :|Partida encontrada:|Match gefunden:|매치 성립:|匹配成功:/g, text.found);
  next = next.replace(/対戦終了|Partie terminée|Partida terminada|Partie beendet|대전 종료|对战结束/g, text.finished);
  next = next.replace(/(\d+)\s*(位|e|º|\.|위|名)(\s|$)/g, `$1${text.rank}$3`);
  return next;
}

function translateDynamicText(root, text) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const next = localizeDynamic(node.nodeValue, text);
    if (next !== node.nodeValue) node.nodeValue = next;
  }
}

function applyLocale() {
  const text = currentText();
  if (!text) return;
  document.documentElement.lang = document.querySelector("#languageSelect")?.value || "ja";
  document.title = text.appTitle;

  for (const [key, selector] of Object.entries(TEXT_SELECTORS)) setText(selector, text[key]);

  const nameInput = document.querySelector("#playerNameInput");
  const nameLabel = nameInput?.closest("label")?.querySelector("span");
  if (nameLabel) nameLabel.textContent = text.nameLabel;
  if (nameInput) nameInput.placeholder = text.namePlaceholder;
  setText("#randomMatchButton", text.randomMatchButton);

  translateSelect("#playerCountSelect", text.playerOptions);
  translateSelect("#winModeSelect", text.winOptions);
  translateSelect("#cornerBoostSelect", text.cornerOptions);
  translateSelect("#cpuModeSelect", text.cpuOptions);

  for (const selector of ["#turnLabel", "#moveLog", "#onlineStatus", "#gameOnlineStatus", "#scoreRow", "#rankingList"]) {
    translateDynamicText(document.querySelector(selector), text);
  }
}

let applying = false;
function scheduleLocale() {
  if (applying) return;
  applying = true;
  window.setTimeout(() => {
    applying = false;
    applyLocale();
  }, 0);
}

document.querySelector("#languageSelect")?.addEventListener("change", scheduleLocale);
new MutationObserver(scheduleLocale).observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

applyLocale();
