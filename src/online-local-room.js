const STORAGE_PREFIX = "custom-reversi-room:";
const SEAT_PREFIX = "custom-reversi-seat:";
const CLIENT_PREFIX = "custom-reversi-client:";

function createRoomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

function readRoom(roomId) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
  return raw ? JSON.parse(raw) : null;
}

function writeRoom(roomId, room) {
  localStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(room));
}

function createInitialRoom({ rules, hostClientId }) {
  return {
    id: createRoomId(),
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
  constructor({ roomId, clientId = crypto.randomUUID(), assignedPlayer = null }) {
    this.roomId = roomId;
    this.clientId = clientId;
    if (assignedPlayer) {
      this.storeAssignedPlayer(assignedPlayer);
    }
    this.channel = new BroadcastChannel(`custom-reversi:${roomId}`);
    this.listeners = new Set();
    this.channel.addEventListener("message", (event) => {
      if (event.data?.type === "room-updated") {
        this.emit(readRoom(this.roomId));
      }
    });
  }

  static createRoom({ rules }) {
    const clientId = crypto.randomUUID();
    const room = createInitialRoom({ rules, hostClientId: clientId });
    writeRoom(room.id, room);
    sessionStorage.setItem(`${CLIENT_PREFIX}${room.id}`, clientId);
    return new LocalRoomClient({ roomId: room.id, clientId, assignedPlayer: 1 });
  }

  static joinRoom({ roomId, forceNewClient = false }) {
    const room = readRoom(roomId);
    if (!room) {
      throw new Error("room_not_found");
    }
    const clientKey = `${CLIENT_PREFIX}${roomId}`;
    if (forceNewClient) {
      sessionStorage.removeItem(clientKey);
      sessionStorage.removeItem(`${SEAT_PREFIX}${roomId}`);
    }
    const clientId = sessionStorage.getItem(clientKey) ?? crypto.randomUUID();
    sessionStorage.setItem(clientKey, clientId);
    const client = new LocalRoomClient({ roomId, clientId });
    client.claimNextSeat();
    return client;
  }

  getRoom() {
    return readRoom(this.roomId);
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

  claimNextSeat() {
    const room = this.getRoom();
    if (!room) throw new Error("room_not_found");

    const assigned = this.getAssignedPlayer();
    if (assigned) return assigned;

    const existingSeat = Object.entries(room.players)
      .find(([, clientId]) => clientId === this.clientId);
    if (existingSeat) {
      const player = Number(existingSeat[0]);
      this.storeAssignedPlayer(player);
      return player;
    }

    for (let player = 1; player <= room.rules.playerCount; player += 1) {
      if (!room.players[player]) {
        room.players[player] = this.clientId;
        this.storeAssignedPlayer(player);
        room.updatedAt = Date.now();
        this.updateRoom(room);
        return player;
      }
    }

    return null;
  }

  setGameState({ board, currentPlayer, finished, winner, lastMessage }) {
    const room = this.getRoom();
    if (!room) throw new Error("room_not_found");
    room.board = board;
    room.currentPlayer = currentPlayer;
    room.finished = finished;
    room.lastMessage = lastMessage ?? room.lastMessage ?? "";
    room.winner = winner ?? null;
    room.version += 1;
    room.updatedAt = Date.now();
    this.updateRoom(room);
  }

  updateRoom(room) {
    writeRoom(this.roomId, room);
    this.channel.postMessage({ type: "room-updated", roomId: this.roomId });
    this.emit(room);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getRoom());
    return () => this.listeners.delete(listener);
  }

  emit(room) {
    for (const listener of this.listeners) {
      listener(room);
    }
  }

  close() {
    this.channel.close();
    this.listeners.clear();
  }
}

export { LocalRoomClient };
