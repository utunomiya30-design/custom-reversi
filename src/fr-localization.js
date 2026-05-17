const FR = {
  appTitle: "Reversi personnalisé",
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
  finalResult: "Résultat final",
  playAgainButton: "Rejouer",
  shareResultButton: "Partager le résultat",
  adSlot: "Publicité",
  largeAdSlot: "Interstitiel / Grande bannière",
};

const SELECT_TEXT = {
  playerCountSelect: { "2": "2 joueurs", "3": "3 joueurs", "4": "4 joueurs" },
  winModeSelect: { classic: "Classique", reverse: "Inversé", score: "Score" },
  cornerBoostSelect: { "": "Aucun", "1": "1P", "2": "2P", "3": "3P", "4": "4P" },
  cpuModeSelect: { none: "Aucun", opponents: "CPU dès 2P" },
};

const TEXT_SELECTORS = {
  appTitle: "[data-i18n='appTitle']",
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
  finalResult: "[data-i18n='finalResult']",
  playAgainButton: "[data-i18n='playAgainButton']",
  shareResultButton: "[data-i18n='shareResultButton']",
  adSlot: ".ad-slot-banner",
  largeAdSlot: ".ad-slot-result",
};

const REPLACEMENTS = [
  [/1P Black|1P 黒/g, "1P Noir"],
  [/2P White|2P 白/g, "2P Blanc"],
  [/3P Red|3P 赤/g, "3P Rouge"],
  [/4P Blue|4P 青/g, "4P Bleu"],
  [/ to move/g, " à jouer"],
  [/ のターン/g, " à jouer"],
  [/Game started|ゲーム開始/g, "Partie lancée"],
  [/ placed at /g, " a joué en "],
  [/ に置きました/g, " a joué"],
  [/ has no legal move and passed/g, " ne peut pas jouer et passe"],
  [/ は置けないためパス/g, " ne peut pas jouer et passe"],
  [/stones|個/g, "pions"],
  [/点/g, "pts"],
  [/Looking for an opponent\.\.\.|対戦相手を探しています\.\.\./g, "Recherche d'un adversaire..."],
  [/Random match|ランダムマッチ/g, "Match aléatoire"],
  [/Matchmaking failed|ランダムマッチに失敗しました。Firebaseのルール設定を確認してください。/g, "Le matchmaking a échoué. Vérifiez la configuration Firebase."],
  [/Room:/g, "Salon :"],
  [/あなたは/g, "Vous êtes"],
  [/現在は/g, "Tour actuel :"],
  [/のターンです/g, ""],
  [/マッチ成立:/g, "Match trouvé :"],
  [/対戦終了/g, "Partie terminée"],
  [/位 /g, "e "],
];

function isFrench() {
  return document.querySelector("#languageSelect")?.value === "fr";
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function translateSelect(id, labels) {
  const select = document.querySelector(`#${id}`);
  if (!select) return;
  for (const option of select.options) {
    if (Object.hasOwn(labels, option.value)) option.textContent = labels[option.value];
  }
}

function translateDynamicText(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    let value = node.nodeValue;
    for (const [pattern, replacement] of REPLACEMENTS) {
      value = value.replace(pattern, replacement);
    }
    node.nodeValue = value;
  }
}

function applyFrench() {
  if (!isFrench()) return;
  document.documentElement.lang = "fr";
  document.title = FR.appTitle;

  for (const [key, selector] of Object.entries(TEXT_SELECTORS)) {
    setText(selector, FR[key]);
  }

  const nameInput = document.querySelector("#playerNameInput");
  const nameLabel = nameInput?.closest("label")?.querySelector("span");
  if (nameLabel) nameLabel.textContent = FR.nameLabel;
  if (nameInput) nameInput.placeholder = FR.namePlaceholder;
  setText("#randomMatchButton", FR.randomMatchButton);

  for (const [id, labels] of Object.entries(SELECT_TEXT)) {
    translateSelect(id, labels);
  }

  translateDynamicText();
}

let applying = false;
function scheduleFrench() {
  if (applying) return;
  applying = true;
  window.setTimeout(() => {
    applying = false;
    applyFrench();
  }, 0);
}

document.querySelector("#languageSelect")?.addEventListener("change", scheduleFrench);
new MutationObserver(scheduleFrench).observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

applyFrench();
