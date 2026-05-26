import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIiqR-0frAfSNlMeXNfUqwNPs2fgsVQBw",
  authDomain: "custom-reversi.firebaseapp.com",
  databaseURL: "https://custom-reversi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "custom-reversi",
  storageBucket: "custom-reversi.firebasestorage.app",
  messagingSenderId: "735539430711",
  appId: "1:735539430711:web:c324fa54c6f6b9d899c6b2",
};

const RANDOM_QUEUE_PATH = "randomQueueV5/current";
const RANDOM_ROOMS_PATH = "randomRoomsV5";
const WAITING_ROOM_TTL = 1000 * 60 * 10;

const COPY = {
  ja: {
    win: {
      classic: "盤面が埋まる、または全員が置けなくなった時点で、石が一番多い人が勝ちです。",
      reverse: "終了時に石が一番少ない人が勝ちです。ただし石が0個で全滅した人は勝てません。",
      score: "角は高得点、角の隣はマイナスなど、マスごとの点数合計で勝敗を決めます。",
    },
    restart: "リノベーションは、今の設定のまま盤面だけを最初から作り直すボタンです。",
    waiting: (count) => `現在 ${count} 人がランダムマッチで待機中`,
    waitingError: "待機人数を確認できませんでした",
  },
  en: {
    win: {
      classic: "The player with the most stones wins when the board is full or no one can move.",
      reverse: "The player with the fewest stones wins, but players with 0 stones are eliminated.",
      score: "Each square has a value. Corners score high, corner-neighbors are risky, and total points decide the winner.",
    },
    restart: "Restart rebuilds the board from the beginning while keeping the current settings.",
    waiting: (count) => `${count} player${count === 1 ? "" : "s"} waiting for Random Match`,
    waitingError: "Could not check waiting players",
  },
  fr: {
    win: {
      classic: "Quand le plateau est plein ou que plus personne ne peut jouer, le plus grand nombre de pions gagne.",
      reverse: "Le plus petit nombre de pions gagne, mais un joueur à 0 pion est éliminé.",
      score: "Chaque case vaut des points. Les coins rapportent gros, leurs voisines sont risquées, et le total décide.",
    },
    restart: "Redémarrer reconstruit le plateau depuis le début avec les mêmes réglages.",
    waiting: (count) => `${count} joueur${count === 1 ? "" : "s"} en attente de match aléatoire`,
    waitingError: "Impossible de vérifier l'attente",
  },
  es: {
    win: {
      classic: "Cuando el tablero se llena o nadie puede mover, gana quien tenga más fichas.",
      reverse: "Gana quien tenga menos fichas, pero quien llegue a 0 queda eliminado.",
      score: "Cada casilla vale puntos. Las esquinas valen mucho, las vecinas restan, y gana el total más alto.",
    },
    restart: "Reiniciar crea una partida nueva manteniendo la configuración actual.",
    waiting: (count) => `${count} jugador${count === 1 ? "" : "es"} esperando partida aleatoria`,
    waitingError: "No se pudo comprobar la espera",
  },
  de: {
    win: {
      classic: "Wenn das Brett voll ist oder niemand ziehen kann, gewinnt die Person mit den meisten Steinen.",
      reverse: "Die wenigsten Steine gewinnen, aber wer 0 Steine hat, ist ausgeschieden.",
      score: "Jedes Feld hat Punkte. Ecken sind stark, Nachbarfelder riskant, die Gesamtsumme gewinnt.",
    },
    restart: "Neustart baut das Brett mit denselben Einstellungen von vorne auf.",
    waiting: (count) => `${count} Spieler wartet/warten auf Zufallsmatch`,
    waitingError: "Wartende Spieler konnten nicht geprüft werden",
  },
  ko: {
    win: {
      classic: "보드가 가득 차거나 모두 둘 수 없게 되면 돌이 가장 많은 사람이 승리합니다.",
      reverse: "돌이 가장 적은 사람이 승리하지만, 돌이 0개가 된 사람은 탈락합니다.",
      score: "칸마다 점수가 있습니다. 코너는 고득점, 코너 옆은 위험하며 총점으로 승부합니다.",
    },
    restart: "리노베이션은 현재 설정을 유지한 채 보드만 처음부터 다시 만드는 버튼입니다.",
    waiting: (count) => `랜덤 매치 대기 중 ${count}명`,
    waitingError: "대기 인원을 확인할 수 없습니다",
  },
  zh: {
    win: {
      classic: "棋盘填满或所有人都无法落子时，棋子最多的人获胜。",
      reverse: "棋子最少的人获胜，但棋子为0的人会被淘汰。",
      score: "每个格子都有分值。角落高分，角旁有风险，最终按总分决定胜负。",
    },
    restart: "重新开始会保留当前设置，只把棋盘从头生成。",
    waiting: (count) => `当前 ${count} 人正在等待随机匹配`,
    waitingError: "无法确认等待人数",
  },
};

function $(selector) {
  return document.querySelector(selector);
}

function text() {
  return COPY[$("#languageSelect")?.value] ?? COPY.en;
}

function ensureWinDescription() {
  let node = $("#winModeDescription");
  if (node) return node;
  node = document.createElement("p");
  node.id = "winModeDescription";
  node.className = "field-description";
  node.setAttribute("aria-live", "polite");
  $("#winModeSelect")?.after(node);
  return node;
}

function ensureRestartDescription() {
  let node = $("#restartDescription");
  if (node) return node;
  node = document.createElement("p");
  node.id = "restartDescription";
  node.className = "play-hint";
  $(".play-actions")?.after(node);
  return node;
}

function ensureWaitingCount() {
  let node = $("#randomWaitingCount");
  if (node) return node;
  node = document.createElement("p");
  node.id = "randomWaitingCount";
  node.className = "waiting-count";
  node.setAttribute("aria-live", "polite");
  $("#onlineStatus")?.before(node);
  return node;
}

function updateRuleHelp() {
  const lang = text();
  const winMode = $("#winModeSelect")?.value || "classic";
  const winDescription = ensureWinDescription();
  const nextWin = lang.win[winMode] ?? lang.win.classic;
  if (winDescription.textContent !== nextWin) winDescription.textContent = nextWin;

  const restartDescription = ensureRestartDescription();
  if (restartDescription.textContent !== lang.restart) restartDescription.textContent = lang.restart;
}

function countJoined(room) {
  return Object.values(room?.players ?? {}).filter(Boolean).length;
}

function showWaitingCount(count) {
  const node = ensureWaitingCount();
  const next = text().waiting(count);
  if (node.textContent !== next) node.textContent = next;
}

function watchWaitingCount() {
  let unsubscribeRoom = null;
  let unsubscribeQueue = null;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase(app);

  function stop() {
    if (unsubscribeRoom) {
      unsubscribeRoom();
      unsubscribeRoom = null;
    }
    if (unsubscribeQueue) {
      unsubscribeQueue();
      unsubscribeQueue = null;
    }
    showWaitingCount(0);
  }

  function start() {
    if (unsubscribeQueue) return;
    unsubscribeQueue = onValue(ref(database, RANDOM_QUEUE_PATH), (snapshot) => {
      if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
      }

      const queue = snapshot.val();
      if (!queue?.roomId || Date.now() - queue.createdAt > WAITING_ROOM_TTL) {
        showWaitingCount(0);
        return;
      }

      unsubscribeRoom = onValue(ref(database, `${RANDOM_ROOMS_PATH}/${queue.roomId}`), (roomSnapshot) => {
        const room = roomSnapshot.val();
        const joined = countJoined(room);
        const target = Number(room?.rules?.playerCount) || 2;
        showWaitingCount(room && joined < target ? joined : 0);
      }, () => showWaitingCount(0));
    }, () => {
      const node = ensureWaitingCount();
      node.textContent = text().waitingError;
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) start();
    else stop();
  });
}

for (const selector of ["#languageSelect", "#winModeSelect"]) {
  $(selector)?.addEventListener("change", updateRuleHelp);
}

updateRuleHelp();
showWaitingCount(0);
watchWaitingCount();
