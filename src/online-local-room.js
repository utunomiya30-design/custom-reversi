import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  set,
  update,
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
const ROOMS_PATH = "manualRoomsV1";
const SEAT_PREFIX = "custom-reversi-seat:";
const CLIENT_PREFIX = "custom-reversi-client:";

function createRoomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

function createInitialRoom({ roomId, rules, hostClientId }) {
  return {
    id: roomId,
    version: 1,
    rules,
    board: null,
    currentPlayer: 1,
    finished: false,
    winner: null,
    players: {
      1: hostClientId,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

class LocalRoomClient {
  constructor({ roomId, clientId = crypto.randomUUID(), assignedPlayer = null, ready = Promise.resolve() }) {
    this.roomId = roomId;
    this.clientId = clientId;
    this.ready = ready;
    this.room = null;
    this.unsubscribe = null;
    this.heartbeatTimer = null;
    this.listeners = new Set();
    if (assignedPlayer) this.storeAssignedPlayer(assignedPlayer);
  }

  static createRoom({ rules }) {
    const roomId = createRoomId();
    const clientId = crypto.randomUUID();
    const room = createInitialRoom({ roomId, rules, hostClientId: clientId });
    sessionStorage.setItem(`${CLIENT_PREFIX}${roomId}`, clientId);
    const ready = set(ref(database, `${ROOMS_PATH}/${roomId}`), room);
    const client = new LocalRoomClient({ roomId, clientId, assignedPlayer: 1, ready });
    client.startHeartbeat(1);
    return client;
  }

  static joinRoom({ roomId, forceNewClient = false }) {
    const normalizedRoomId = String(roomId || "").trim().toLowerCase();
    const clientKey = `${CLIENT_PREFIX}${normalizedRoomId}`;
    if (forceNewClient) {
      sessionStorage.removeItem(clientKey);
      sessionStorage.removeItem(`${SEAT_PREFIX}${normalizedRoomId}`);
    }
    const clientId = sessionStorage.getItem(clientKey) ?? crypto.randomUUID();
    sessionStorage.setItem(clientKey, clientId);
    const client = new LocalRoomClient({ roomId: normalizedRoomId, clientId });
    client.ready = client.claimNextSeat();
    return client;
  }

  getRoom() {
    return this.room;
  }

  getAssignedPlayer() {
    const rawSeat = sessionStorage.getItem(`${SEAT_PREFIX}${this.roomId}`);
    if (!rawSeat) return null;

    try {
      const seat = JSON.parse(rawSeat);
      return seat.clientId === this.clientId ? seat.player : null;
    } catch {
      sessionStorage.removeItem(`${SEAT_PREFIX}${this.roomId}`);
      return null;
    }
  }

  storeAssignedPlayer(player) {
    sessionStorage.setItem(`${SEAT_PREFIX}${this.roomId}`, JSON.stringify({
      player,
      clientId: this.clientId,
    }));
  }

  async claimNextSeat() {
    let claimedSeat = null;
    await runTransaction(ref(database, `${ROOMS_PATH}/${this.roomId}`), (room) => {
      if (!room) return room;

      const existingSeat = Object.entries(room.players ?? {})
        .find(([, clientId]) => clientId === this.clientId);
      if (existingSeat) {
        claimedSeat = Number(existingSeat[0]);
        return room;
      }

      room.players = room.players ?? {};
      for (let player = 1; player <= room.rules.playerCount; player += 1) {
        if (!room.players[player]) {
          room.players[player] = this.clientId;
          claimedSeat = player;
          room.updatedAt = Date.now();
          break;
        }
      }
      return room;
    });

    if (claimedSeat) this.storeAssignedPlayer(claimedSeat);
    if (claimedSeat) this.startHeartbeat(claimedSeat);
    return claimedSeat;
  }

  startHeartbeat(player = this.getAssignedPlayer()) {
    if (!player) return;
    const presencePath = `${ROOMS_PATH}/${this.roomId}/presence/${player}`;
    const presenceRef = ref(database, presencePath);
    const touch = () => update(presenceRef, {
      clientId: this.clientId,
      player,
      connected: true,
      lastSeen: Date.now(),
    }).catch((error) => console.warn("Presence update failed", error));

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.ready.then(async () => {
      await touch();
      onDisconnect(presenceRef).update({
        clientId: this.clientId,
        player,
        connected: false,
        lastSeen: Date.now(),
      });
      this.heartbeatTimer = setInterval(touch, 5000);
    }).catch((error) => console.warn("Presence setup failed", error));
  }

  setGameState({ board, currentPlayer, finished, winner, lastMessage }) {
    this.ready.then(() => runTransaction(ref(database, `${ROOMS_PATH}/${this.roomId}`), (room) => {
      if (!room) return room;
      room.board = board;
      room.currentPlayer = currentPlayer;
      room.finished = finished;
      room.lastMessage = lastMessage ?? room.lastMessage ?? "";
      room.winner = winner ?? null;
      room.version = (room.version ?? 0) + 1;
      room.updatedAt = Date.now();
      return room;
    })).catch((error) => console.warn("Manual room sync failed", error));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    if (!this.unsubscribe) {
      this.unsubscribe = onValue(ref(database, `${ROOMS_PATH}/${this.roomId}`), (snapshot) => {
        this.room = snapshot.val();
        for (const currentListener of this.listeners) currentListener(this.room);
      });
    }
    return () => this.listeners.delete(listener);
  }

  close() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    const player = this.getAssignedPlayer();
    if (player) {
      update(ref(database, `${ROOMS_PATH}/${this.roomId}/presence/${player}`), {
        clientId: this.clientId,
        player,
        connected: false,
        lastSeen: Date.now(),
      }).catch(() => {});
    }
    this.unsubscribe = null;
    this.listeners.clear();
  }
}

export { LocalRoomClient };
