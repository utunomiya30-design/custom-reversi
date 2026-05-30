import assert from "node:assert/strict";
import {
  applyMove,
  countStones,
  createInitialBoard,
  getLegalMoves,
} from "../src/reversi-core.js";

function countsFor(size, playerCount) {
  return countStones(createInitialBoard({ size, playerCount }), playerCount);
}

assert.deepEqual(countsFor(8, 2), { 1: 2, 2: 2 });
assert.deepEqual(countsFor(8, 3), { 1: 3, 2: 3, 3: 3 });
assert.deepEqual(countsFor(16, 4), { 1: 4, 2: 4, 3: 4, 4: 4 });

{
  const board = [
    [1, 2, 3, 2, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  const result = applyMove(board, 0, 4, 1);
  assert.equal(result.ok, true);
  assert.deepEqual(result.board[0], [1, 1, 1, 1, 1]);
}

{
  const board = createInitialBoard({ size: 16, playerCount: 4 });
  for (let player = 1; player <= 4; player += 1) {
    assert.ok(
      getLegalMoves(board, player).length > 0,
      `${player}P should have at least one legal opening move`,
    );
  }
}

console.log("reversi-core tests passed");
