import {
  EMPTY,
  applyMove,
  countStones,
  createInitialBoard,
  createScoreMap,
  getLegalMoves,
  getNextPlayer,
  rankPlayers,
  scoreBoard,
} from "./reversi-core.js";
import { LocalRoomClient } from "./online-local-room.js?v=20260524-reconnect-1";

const COLORS = { 1: "#141414", 2: "#f7f3ea", 3: "#f02f2f", 4: "#176cff" };
const LANG = {
  ja: {
    title: "カスタム・リバーシ", lead: "人数、盤面、勝利条件を変えて、その場で遊べるローカル対戦版です。",
    labels: ["", "1P 黒", "2P 白", "3P 赤", "4P 青"], turn: "のターン", stones: "個", points: "点",
    players: "参加人数", board: "盤面サイズ", win: "勝利条件", corner: "角スタート", cpu: "CPUプレイヤー", bg: "背景画像",
    start: "ゲーム開始", share: "このルールをシェア", room: "オンライン部屋", roomLead: "部屋を作ってURLを共有すると、別タブや別ブラウザから参加できます。",
    createRoom: "部屋を作る", roomCode: "部屋コード", join: "参加する", invite: "招待URLをコピー", restart: "リノベーション", back: "トップに戻る",
    none: "なし", cpuOpp: "2P以降をCPU", classic: "通常", reverse: "逆転", score: "スコア", copied: "URLをコピーしました",
    thinking: "CPU思考中", started: "ゲーム開始", placed: "が置きました", pass: "は置けないためパス", final: "最終結果", resultShare: "この結果をSNSで自慢する",
    ad: "Advertisement", largeAd: "Interstitial / Large Banner", seat: "担当", wait: "参加待ち", spectator: "観戦中", blocked: "オンライン対戦では自分のターンだけ操作できます", notFound: "部屋が見つかりません",
  },
  en: {
    title: "Custom Reversi", lead: "Tune the player count, board size, and win condition, then play local multiplayer right away.",
    labels: ["", "1P Black", "2P White", "3P Red", "4P Blue"], turn: "to move", stones: "stones", points: "pts",
    players: "Players", board: "Board", win: "Win mode", corner: "Corner start", cpu: "CPU players", bg: "Background",
    start: "Start game", share: "Share this rule", room: "Online room", roomLead: "Create a room and share the URL with another tab or browser.",
    createRoom: "Create room", roomCode: "Room code", join: "Join room", invite: "Copy invite URL", restart: "Restart", back: "Back to top",
    none: "None", cpuOpp: "CPU from 2P", classic: "Classic", reverse: "Reverse", score: "Score", copied: "URL copied",
    thinking: "CPU thinking", started: "Game started", placed: "placed at", pass: "has no legal move and passed", final: "Final Result", resultShare: "Share this result",
    ad: "Advertisement", largeAd: "Interstitial / Large Banner", seat: "Seat", wait: "Waiting", spectator: "Spectating", blocked: "Online games only allow moves on your own turn", notFound: "Room not found",
  },
};
const ALIASES = { fr: "en", es: "en", de: "en", ko: "en", zh: "en" };

const $ = (id) => document.querySelector(id);
const els = {
  setup: $("#setupPanel"), play: $("#playPanel"), result: $("#resultPanel"), form: $("#settingsForm"),
  lang: $("#languageSelect"), players: $("#playerCountSelect"), board: $("#boardSizeSelect"), win: $("#winModeSelect"), corner: $("#cornerBoostSelect"), cpu: $("#cpuModeSelect"), bg: $("#backgroundInput"), pieceImage: $("#pieceImageInput"), pieceImagePlayer: $("#pieceImagePlayerSelect"),
  share: $("#shareRuleButton"), createRoom: $("#createRoomButton"), joinRoom: $("#joinRoomButton"), roomCode: $("#roomCodeInput"), online: $("#onlineStatus"), gameOnline: $("#gameOnlineStatus"),
  canvas: $("#gameCanvas"), turn: $("#turnLabel"), log: $("#moveLog"), scores: $("#scoreRow"), invite: $("#inviteButton"), restart: $("#restartButton"), back: $("#backButton"), ranks: $("#rankingList"), resultShare: $("#shareResultButton"),
};
const ctx = els.canvas.getContext("2d");
let state = null;
let bgUrl = null;
let bgImage = null;
const pieceImages = new Map();
const pieceImageUrls = new Map();
let cpuTimer = null;
let roomClient = null;
let assignedPlayer = null;
let unsub = null;
let suppressRoomSync = false;
const OFFLINE_GRACE_MS = 15000;
const OFFLINE_CPU_DELAY_MS = 1600;
let offlineCpuPlayers = new Set();

function dict() { return LANG[els.lang.value] ?? LANG[ALIASES[els.lang.value]] ?? LANG.en; }
function label(player) { return dict().labels[player]; }
function option(select, value, text) { const o = document.createElement("option"); o.value = value; o.textContent = text; select.append(o); }
function replaceOptions(select, items) { select.replaceChildren(); for (const item of items) option(select, item[0], item[1]); }
function settings() {
  return {
    language: els.lang.value,
    playerCount: Number(els.players.value) || 2,
    boardSize: Number(els.board.value) || 8,
    winMode: els.win.value || "classic",
    cornerBoostPlayer: els.corner.value ? Number(els.corner.value) : null,
    cpuMode: els.cpu.value || "none",
  };
}
function applySettings(s) {
  els.lang.value = s.language ?? "ja";
  populateOptions(s);
  els.players.value = String(s.playerCount ?? 2);
  els.board.value = String(s.boardSize ?? 8);
  els.win.value = s.winMode ?? "classic";
  els.corner.value = s.cornerBoostPlayer ? String(s.cornerBoostPlayer) : "";
  els.cpu.value = s.cpuMode ?? "none";
  translate();
}
function populateOptions(s = settings()) {
  const d = dict();
  replaceOptions(els.players, [["2", d.labels[1] ? (els.lang.value === "ja" ? "2人" : "2 players") : "2"], ["3", els.lang.value === "ja" ? "3人" : "3 players"], ["4", els.lang.value === "ja" ? "4人" : "4 players"]]);
  replaceOptions(els.win, [["classic", d.classic], ["reverse", d.reverse], ["score", d.score]]);
  replaceOptions(els.corner, [["", d.none], ["1", "1P"], ["2", "2P"], ["3", "3P"], ["4", "4P"]]);
  replaceOptions(els.cpu, [["none", d.none], ["opponents", d.cpuOpp]]);
  els.players.value = String(s.playerCount ?? 2); els.win.value = s.winMode ?? "classic"; els.corner.value = s.cornerBoostPlayer ? String(s.cornerBoostPlayer) : ""; els.cpu.value = s.cpuMode ?? "none";
  syncCornerOptions();
  syncPieceImagePlayers();
}
function translate() {
  const d = dict();
  document.documentElement.lang = els.lang.value;
  document.title = d.title;
  document.querySelector("h1").textContent = d.title;
  document.querySelector("[data-i18n='lead']").textContent = d.lead;
  document.querySelector("[data-i18n='playersLabel']").textContent = d.players;
  document.querySelector("[data-i18n='boardLabel']").textContent = d.board;
  document.querySelector("[data-i18n='winModeLabel']").textContent = d.win;
  document.querySelector("[data-i18n='cornerBoostLabel']").textContent = d.corner;
  document.querySelector("[data-i18n='cpuModeLabel']").textContent = d.cpu;
  document.querySelector("[data-i18n='backgroundLabel']").textContent = d.bg;
  document.querySelector("[data-i18n='startButton']").textContent = d.start;
  document.querySelector("[data-i18n='shareRuleButton']").textContent = d.share;
  document.querySelector("[data-i18n='onlineTitle']").textContent = d.room;
  document.querySelector("[data-i18n='onlineLead']").textContent = d.roomLead;
  document.querySelector("[data-i18n='createRoomButton']").textContent = d.createRoom;
  document.querySelector("[data-i18n='roomCodeLabel']").textContent = d.roomCode;
  document.querySelector("[data-i18n='joinRoomButton']").textContent = d.join;
  els.invite.textContent = d.invite; els.restart.textContent = d.restart; els.back.textContent = d.back; els.resultShare.textContent = d.resultShare;
  document.querySelector("[data-i18n='finalResult']").textContent = d.final;
  document.querySelector(".ad-slot").textContent = d.ad; document.querySelector(".large-ad-slot").textContent = d.largeAd;
  if (state) { state.language = els.lang.value; render(); }
}
function syncPieceImagePlayers() { if (!els.pieceImagePlayer) return; for (const o of els.pieceImagePlayer.options) o.disabled = Number(o.value) > (Number(els.players.value) || 2); if (Number(els.pieceImagePlayer.value) > (Number(els.players.value) || 2)) els.pieceImagePlayer.value = "1"; }
function syncCornerOptions() { const count = Number(els.players.value) || 2; for (const o of els.corner.options) o.disabled = o.value !== "" && Number(o.value) > count; if (Number(els.corner.value) > count) els.corner.value = ""; }
function encodeRules(s) { return btoa(unescape(encodeURIComponent(JSON.stringify(s)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decodeRules(v) { try { return JSON.parse(decodeURIComponent(escape(atob(v.replace(/-/g, "+").replace(/_/g, "/"))))); } catch { return null; } }
function shareUrl() { const u = new URL(location.href); u.searchParams.set("rules", encodeRules(settings())); if (roomClient) { u.searchParams.set("room", roomClient.roomId); u.searchParams.set("join", "1"); } navigator.clipboard?.writeText(u.toString()); announce(dict().copied); return u.toString(); }
function announce(msg) { if (state && !state.finished) { els.turn.textContent = msg; setTimeout(renderStatus, 900); } else alert(msg); }
function createState(s) { const next = { ...s, board: createInitialBoard({ size: s.boardSize, playerCount: s.playerCount, cornerBoostPlayer: s.cornerBoostPlayer }), currentPlayer: 1, scoreMap: createScoreMap(s.boardSize), finished: false, lastMessage: dict().started }; next.currentPlayer = getNextPlayer(next.board, next.playerCount, next.playerCount).player ?? 1; return next; }
function startGame({ syncOnline = true } = {}) { clearCpu(); state = createState(settings()); els.setup.classList.add("is-hidden"); els.result.classList.add("is-hidden"); els.play.classList.remove("is-hidden"); render(); if (syncOnline) syncRoom(); queueCpu(); }
function clearCpu() { if (cpuTimer) clearTimeout(cpuTimer); cpuTimer = null; }
function isOfflineCpu(p) { return offlineCpuPlayers.has(p); }
function isCpu(p) { return (state?.cpuMode === "opponents" && p >= 2) || isOfflineCpu(p); }
function activePlayers(room) { const now = Date.now(); return Object.keys(room?.players ?? {}).map(Number).filter((p) => { const presence = room?.presence?.[p]; return presence?.connected && now - Number(presence.lastSeen ?? 0) < OFFLINE_GRACE_MS; }); }
function stewardPlayer(room) { const active = activePlayers(room); return active.length ? Math.min(...active) : assignedPlayer; }
function canCpuRun() { if (!roomClient) return true; const room = roomClient.getRoom(); return room ? assignedPlayer === stewardPlayer(room) : assignedPlayer === 1; }
function updateOfflineCpuPlayers(room) { const next = new Set(); if (room?.board) { const now = Date.now(); for (let p = 1; p <= room.rules.playerCount; p++) { if (p === assignedPlayer) continue; const presence = room.presence?.[p]; const active = presence?.connected && now - Number(presence.lastSeen ?? 0) < OFFLINE_GRACE_MS; if (!active) next.add(p); } } offlineCpuPlayers = next; }
function queueCpu() { clearCpu(); if (!state || state.finished || !isCpu(state.currentPlayer) || !canCpuRun()) return; const offline = isOfflineCpu(state.currentPlayer); els.turn.textContent = `${label(state.currentPlayer)} ${dict().thinking}${offline ? " (CPU)" : ""}`; cpuTimer = setTimeout(cpuMove, offline ? OFFLINE_CPU_DELAY_MS : 420); }
function chooseCpuMove() { const moves = getLegalMoves(state.board, state.currentPlayer); if (!moves.length) return null; const last = state.boardSize - 1; return moves.map(m => ({ ...m, score: m.flips.length + (((m.row === 0 || m.row === last) && (m.col === 0 || m.col === last)) ? 20 : 0) })).sort((a, b) => b.score - a.score)[0]; }
function cell(row, col) { return `${String.fromCharCode(65 + col)}${row + 1}`; }
function moveMessage(p, row, col) { const d = dict(); return els.lang.value === "ja" ? `${label(p)} ${cell(row, col)} ${d.placed}` : `${label(p)} ${d.placed} ${cell(row, col)}`; }
function passMessage(p) { return `${label(p)} ${dict().pass}`; }
function passedPlayers(prev, next) { const out = []; if (!next) return out; let p = (prev % state.playerCount) + 1; while (p !== next) { out.push(p); p = (p % state.playerCount) + 1; } return out; }
function advance(prev, row, col) { const next = getNextPlayer(state.board, prev, state.playerCount); const msgs = [moveMessage(prev, row, col), ...passedPlayers(prev, next.player).map(passMessage)]; state.lastMessage = msgs.join(" / "); if (!next.player) { finish(); return false; } state.currentPlayer = next.player; return true; }
function cpuMove() { cpuTimer = null; if (!state || state.finished || !isCpu(state.currentPlayer)) return; const m = chooseCpuMove(); if (!m) { const n = getNextPlayer(state.board, state.currentPlayer, state.playerCount); state.lastMessage = passMessage(state.currentPlayer); if (!n.player) return finish(); state.currentPlayer = n.player; render(); syncRoom(); return queueCpu(); } const prev = state.currentPlayer; const res = applyMove(state.board, m.row, m.col, prev); if (!res.ok) return; state.board = res.board; if (!advance(prev, m.row, m.col)) return; render(); syncRoom(); queueCpu(); }
function render() { renderStatus(); els.log.textContent = state?.lastMessage ?? ""; renderScores(); draw(); updateOnlineStatus(); }
function renderStatus() { if (!state || state.finished) return; els.turn.textContent = `${label(state.currentPlayer)} ${dict().turn}`; }
function renderScores() { const values = state.winMode === "score" ? scoreBoard(state.board, state.playerCount, state.scoreMap) : countStones(state.board, state.playerCount); const unit = state.winMode === "score" ? dict().points : dict().stones; els.scores.replaceChildren(); for (let p = 1; p <= state.playerCount; p++) { const div = document.createElement("div"); div.className = "score-pill"; div.innerHTML = `<span class="stone-dot" style="background:${COLORS[p]}"></span><strong>${label(p)}</strong><span>${values[p]} ${unit}</span>`; els.scores.append(div); } }
function draw() { const size = state.boardSize, c = els.canvas.width / size; ctx.clearRect(0, 0, els.canvas.width, els.canvas.height); ctx.fillStyle = "rgba(32, 93, 71, 0.92)"; ctx.fillRect(0, 0, els.canvas.width, els.canvas.height); if (bgImage) { ctx.globalAlpha = 0.34; ctx.drawImage(bgImage, 0, 0, els.canvas.width, els.canvas.height); ctx.globalAlpha = 1; } ctx.strokeStyle = "rgba(255,255,255,.46)"; for (let i = 0; i <= size; i++) { const x = Math.round(i * c) + .5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, els.canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(els.canvas.width, x); ctx.stroke(); } const legal = new Set(getLegalMoves(state.board, state.currentPlayer).map(m => `${m.row},${m.col}`)); for (let r = 0; r < size; r++) for (let col = 0; col < size; col++) { const p = state.board[r][col], x = col * c + c / 2, y = r * c + c / 2; if (p) stone(x, y, c * .38, COLORS[p], p === 2, pieceImages.get(p)); else if (legal.has(`${r},${col}`)) hint(x, y, c * .13); } }
function stone(x, y, radius, color, light, image = null) { const lighting = color === COLORS[3] ? { highlight: "#ff9a9a", shadow: "#b40000", edge: "rgba(180,0,0,.28)" } : color === COLORS[4] ? { highlight: "#9fc3ff", shadow: "#003aa8", edge: "rgba(0,58,168,.28)" } : null; const g = ctx.createRadialGradient(x - radius * .3, y - radius * .35, radius * .1, x, y, radius); g.addColorStop(0, lighting?.highlight ?? (light ? "#fff" : "#555")); g.addColorStop(.58, color); g.addColorStop(1, lighting?.shadow ?? color); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); if (image?.complete) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius * .9, 0, Math.PI * 2); ctx.clip(); const side = radius * 1.8; ctx.drawImage(image, x - side / 2, y - side / 2, side, side); ctx.restore(); const shine = ctx.createRadialGradient(x - radius * .38, y - radius * .42, 1, x, y, radius); shine.addColorStop(0, "rgba(255,255,255,.52)"); shine.addColorStop(.38, "rgba(255,255,255,.12)"); shine.addColorStop(1, "rgba(0,0,0,.18)"); ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = lighting?.edge ?? (light ? "rgba(0,0,0,.32)" : "rgba(0,0,0,.5)"); ctx.lineWidth = image ? 1.4 : (lighting ? 1.2 : 2.5); ctx.stroke(); }
function hint(x, y, r) { ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function clickBoard(e) { if (!state || state.finished || isCpu(state.currentPlayer)) return; if (roomClient && assignedPlayer !== state.currentPlayer) return announce(dict().blocked); const rect = els.canvas.getBoundingClientRect(); const scale = els.canvas.width / rect.width; const c = els.canvas.width / state.boardSize; const row = Math.floor((e.clientY - rect.top) * scale / c); const col = Math.floor((e.clientX - rect.left) * scale / c); const prev = state.currentPlayer; const res = applyMove(state.board, row, col, prev); if (!res.ok) return; state.board = res.board; if (!advance(prev, row, col)) return; render(); syncRoom(); queueCpu(); }
function finish() { clearCpu(); state.finished = true; const values = state.winMode === "score" ? scoreBoard(state.board, state.playerCount, state.scoreMap) : countStones(state.board, state.playerCount); const ranking = rankPlayers(values, state.winMode === "reverse" ? "reverse" : "classic"); const unit = state.winMode === "score" ? dict().points : dict().stones; els.ranks.replaceChildren(); ranking.forEach((entry, i) => { const li = document.createElement("li"); li.innerHTML = `<span>#${i + 1} ${label(entry.player)}</span><span class="rank-value">${entry.value} ${unit}</span>`; els.ranks.append(li); }); els.play.classList.add("is-hidden"); els.result.classList.remove("is-hidden"); syncRoom(); }
function setRoomClient(client, key) { if (unsub) unsub(); if (roomClient) roomClient.close(); roomClient = client; unsub = roomClient.subscribe(applyRoom); assignedPlayer = roomClient.getAssignedPlayer(); els.roomCode.value = roomClient.roomId.toUpperCase(); els.online.textContent = `${key}: ${roomClient.roomId.toUpperCase()}`; updateRoomUrl(); }
function applyRoom(room) { if (!room || suppressRoomSync) return; assignedPlayer = roomClient.getAssignedPlayer(); updateOfflineCpuPlayers(room); applySettings(room.rules); if (!room.board) return updateOnlineStatus(); state = { ...room.rules, board: room.board, currentPlayer: room.currentPlayer, scoreMap: createScoreMap(room.rules.boardSize), finished: room.finished, lastMessage: room.lastMessage ?? "" }; els.setup.classList.add("is-hidden"); els.play.classList.toggle("is-hidden", room.finished); els.result.classList.toggle("is-hidden", !room.finished); room.finished ? finish() : render(); queueCpu(); }
function syncRoom() { if (!roomClient || !state || suppressRoomSync) return; suppressRoomSync = true; roomClient.setGameState({ board: state.board, currentPlayer: state.currentPlayer, finished: state.finished, lastMessage: state.lastMessage }); suppressRoomSync = false; updateOnlineStatus(); }
function updateRoomUrl() { if (!roomClient) return; const u = new URL(location.href); u.searchParams.set("room", roomClient.roomId); u.searchParams.set("rules", encodeRules(settings())); u.searchParams.delete("join"); history.replaceState(null, "", u); }
function updateOnlineStatus() { if (!roomClient) return els.gameOnline.textContent = ""; const room = roomClient.getRoom(); if (!room) return; const count = activePlayers(room).length; const offline = [...offlineCpuPlayers].map(label).join(", "); els.gameOnline.textContent = `${assignedPlayer ? `${dict().seat}: ${label(assignedPlayer)}` : dict().spectator} / ${dict().wait}: ${count}/${room.rules.playerCount} / Room: ${room.id.toUpperCase()}${offline ? ` / CPU: ${offline}` : ""}`; }
function createRoom() { setRoomClient(LocalRoomClient.createRoom({ rules: settings() }), dict().createRoom); startGame(); }
function joinRoom(id) { try { const forceNewClient = new URLSearchParams(location.search).get("join") === "1"; setRoomClient(LocalRoomClient.joinRoom({ roomId: id.toLowerCase(), forceNewClient }), dict().join); } catch { els.online.textContent = dict().notFound; } }

els.form.addEventListener("submit", e => { e.preventDefault(); startGame(); });
els.lang.addEventListener("change", () => { const s = settings(); populateOptions(s); translate(); });
els.players.addEventListener("change", () => { syncCornerOptions(); syncPieceImagePlayers(); });
els.share.addEventListener("click", shareUrl); els.invite.addEventListener("click", shareUrl); els.resultShare.addEventListener("click", shareUrl);
els.createRoom.addEventListener("click", createRoom); els.joinRoom.addEventListener("click", () => els.roomCode.value && joinRoom(els.roomCode.value));
els.roomCode.addEventListener("input", () => els.roomCode.value = els.roomCode.value.replace(/[^a-z0-9]/gi, "").toUpperCase());
els.restart.addEventListener("click", startGame); els.back.addEventListener("click", () => { clearCpu(); els.play.classList.add("is-hidden"); els.result.classList.add("is-hidden"); els.setup.classList.remove("is-hidden"); });
els.canvas.addEventListener("click", clickBoard);
els.bg.addEventListener("change", e => { if (bgUrl) URL.revokeObjectURL(bgUrl); const f = e.target.files[0]; if (!f) return; bgUrl = URL.createObjectURL(f); bgImage = new Image(); bgImage.onload = () => state && draw(); bgImage.src = bgUrl; });
els.pieceImage?.addEventListener("change", e => { const f = e.target.files[0]; const player = Number(els.pieceImagePlayer?.value || 1); if (pieceImageUrls.has(player)) URL.revokeObjectURL(pieceImageUrls.get(player)); if (!f) { pieceImages.delete(player); pieceImageUrls.delete(player); if (state) draw(); return; } const url = URL.createObjectURL(f); const img = new Image(); img.onload = () => { pieceImages.set(player, img); if (state) draw(); }; img.src = url; pieceImageUrls.set(player, url); });
els.pieceImagePlayer?.addEventListener("change", () => { if (els.pieceImage) els.pieceImage.value = ""; });

populateOptions(); translate();
const params = new URLSearchParams(location.search);
const rules = params.get("rules");
if (rules) { const s = decodeRules(rules); if (s) applySettings(s); }
const room = params.get("room");
if (room) { els.roomCode.value = room.toUpperCase(); joinRoom(room); }

