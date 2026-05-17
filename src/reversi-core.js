const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

const EMPTY = 0;

function assertIntegerInSet(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
  }
}

function createEmptyBoard(size) {
  assertIntegerInSet(size, [4, 6, 8, 12, 16], "Board size");
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function isInside(board, row, col) {
  return row >= 0 && row < board.length && col >= 0 && col < board.length;
}

function isPlayerId(value, playerCount) {
  return Number.isInteger(value) && value >= 1 && value <= playerCount;
}

function getInitialPositions(size, playerCount) {
  const low = size / 2 - 1;
  const high = size / 2;

  if (playerCount === 2) {
    return [
      { row: low, col: low, player: 2 },
      { row: low, col: high, player: 1 },
      { row: high, col: low, player: 1 },
      { row: high, col: high, player: 2 },
    ];
  }

  if (playerCount === 3) {
    return mapSeedPattern(size, [
      [1, 2, 3, 0],
      [2, 3, 1, 0],
      [3, 1, 2, 0],
      [0, 0, 0, 0],
    ]);
  }

  if (size === 4) {
    return mapSeedPattern(size, [
      [3, 0, 0, 4],
      [0, 2, 0, 0],
      [0, 1, 0, 0],
      [3, 4, 2, 1],
    ]);
  }

  return mapSeedPattern(size, [
    [0, 0, 1, 4],
    [2, 4, 3, 0],
    [0, 1, 0, 0],
    [2, 0, 3, 0],
  ]);
}

function mapSeedPattern(size, pattern) {
  const start = size / 2 - 2;
  const positions = [];

  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      const player = pattern[row][col];
      if (player !== EMPTY) {
        positions.push({ row: start + row, col: start + col, player });
      }
    }
  }

  return positions;
}

function createInitialBoard({
  size = 8,
  playerCount = 2,
  cornerBoostPlayer = null,
  extraCenterStones = {},
} = {}) {
  assertIntegerInSet(size, [4, 6, 8, 12, 16], "Board size");
  assertIntegerInSet(playerCount, [2, 3, 4], "Player count");

  const board = createEmptyBoard(size);
  for (const stone of getInitialPositions(size, playerCount)) {
    board[stone.row][stone.col] = stone.player;
  }

  if (cornerBoostPlayer !== null) {
    if (!isPlayerId(cornerBoostPlayer, playerCount)) {
      throw new Error("cornerBoostPlayer must be a valid player id");
    }
    board[0][0] = cornerBoostPlayer;
    board[0][size - 1] = cornerBoostPlayer;
    board[size - 1][0] = cornerBoostPlayer;
    board[size - 1][size - 1] = cornerBoostPlayer;
  }

  applyExtraCenterStones(board, playerCount, extraCenterStones);
  return board;
}

function applyExtraCenterStones(board, playerCount, extraCenterStones) {
  const entries = Object.entries(extraCenterStones);
  if (entries.length === 0) return;

  const centerStart = board.length / 2 - 2;
  const centerEnd = board.length / 2 + 1;
  const candidates = [];

  for (let row = centerStart; row <= centerEnd; row += 1) {
    for (let col = centerStart; col <= centerEnd; col += 1) {
      if (isInside(board, row, col) && board[row][col] === EMPTY) {
        candidates.push({ row, col });
      }
    }
  }

  let cursor = 0;
  for (const [rawPlayer, rawCount] of entries) {
    const player = Number(rawPlayer);
    const count = Number(rawCount);
    if (!isPlayerId(player, playerCount) || !Number.isInteger(count) || count < 0) {
      throw new Error("extraCenterStones must map valid player ids to non-negative integers");
    }

    for (let i = 0; i < count && cursor < candidates.length; i += 1) {
      const cell = candidates[cursor];
      board[cell.row][cell.col] = player;
      cursor += 1;
    }
  }
}

function collectFlipsInDirection(board, row, col, player, direction) {
  const [rowStep, colStep] = direction;
  const flips = [];
  let nextRow = row + rowStep;
  let nextCol = col + colStep;

  while (isInside(board, nextRow, nextCol)) {
    const cell = board[nextRow][nextCol];

    if (cell === EMPTY) return [];
    if (cell === player) return flips.length > 0 ? flips : [];

    flips.push({ row: nextRow, col: nextCol });
    nextRow += rowStep;
    nextCol += colStep;
  }

  return [];
}

function getFlips(board, row, col, player) {
  if (!isInside(board, row, col) || board[row][col] !== EMPTY) return [];

  return DIRECTIONS.flatMap((direction) => (
    collectFlipsInDirection(board, row, col, player, direction)
  ));
}

function isLegalMove(board, row, col, player) {
  return getFlips(board, row, col, player).length > 0;
}

function getLegalMoves(board, player) {
  const moves = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      const flips = getFlips(board, row, col, player);
      if (flips.length > 0) {
        moves.push({ row, col, flips });
      }
    }
  }

  return moves;
}

function applyMove(board, row, col, player) {
  const flips = getFlips(board, row, col, player);
  if (flips.length === 0) {
    return {
      ok: false,
      board,
      flips: [],
      reason: "illegal_move",
    };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[row][col] = player;
  for (const flip of flips) {
    nextBoard[flip.row][flip.col] = player;
  }

  return {
    ok: true,
    board: nextBoard,
    flips,
    placed: { row, col, player },
  };
}

function countStones(board, playerCount) {
  const counts = Object.fromEntries(
    Array.from({ length: playerCount }, (_, index) => [index + 1, 0]),
  );

  for (const row of board) {
    for (const cell of row) {
      if (cell !== EMPTY) counts[cell] += 1;
    }
  }

  return counts;
}

function hasAnyLegalMove(board, playerCount) {
  for (let player = 1; player <= playerCount; player += 1) {
    if (getLegalMoves(board, player).length > 0) return true;
  }
  return false;
}

function getNextPlayer(board, currentPlayer, playerCount) {
  for (let offset = 1; offset <= playerCount; offset += 1) {
    const candidate = ((currentPlayer - 1 + offset) % playerCount) + 1;
    if (getLegalMoves(board, candidate).length > 0) {
      return {
        player: candidate,
        passedPlayers: offset - 1,
      };
    }
  }

  return {
    player: null,
    passedPlayers: playerCount,
  };
}

function createScoreMap(size) {
  const map = Array.from({ length: size }, () => Array(size).fill(1));
  const last = size - 1;
  const corners = [[0, 0], [0, last], [last, 0], [last, last]];
  const cornerNeighbors = [
    [0, 1], [1, 0], [1, 1],
    [0, last - 1], [1, last], [1, last - 1],
    [last - 1, 0], [last, 1], [last - 1, 1],
    [last - 1, last], [last, last - 1], [last - 1, last - 1],
  ];

  for (const [row, col] of cornerNeighbors) map[row][col] = -5;
  for (const [row, col] of corners) map[row][col] = 10;
  return map;
}

function scoreBoard(board, playerCount, scoreMap = createScoreMap(board.length)) {
  const scores = Object.fromEntries(
    Array.from({ length: playerCount }, (_, index) => [index + 1, 0]),
  );

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      const player = board[row][col];
      if (player !== EMPTY) scores[player] += scoreMap[row][col];
    }
  }

  return scores;
}

function rankPlayers(values, mode = "classic") {
  const entries = Object.entries(values).map(([player, value]) => ({
    player: Number(player),
    value,
  }));

  if (mode === "reverse") {
    return entries
      .filter((entry) => entry.value > 0)
      .sort((a, b) => a.value - b.value || a.player - b.player);
  }

  return entries.sort((a, b) => b.value - a.value || a.player - b.player);
}

export {
  EMPTY,
  DIRECTIONS,
  createEmptyBoard,
  createInitialBoard,
  cloneBoard,
  getFlips,
  isLegalMove,
  getLegalMoves,
  applyMove,
  countStones,
  hasAnyLegalMove,
  getNextPlayer,
  createScoreMap,
  scoreBoard,
  rankPlayers,
};
