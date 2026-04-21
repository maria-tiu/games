import { useState, useCallback } from 'react';

export type Board = (number | null)[][];

export interface Game2048State {
  board: Board;
  score: number;
  best: number;
  gameOver: boolean;
  won: boolean;
  continueAfterWin: boolean;
}

function createEmptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array(4).fill(null) as (number | null)[]);
}

function getEmptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === null) cells.push([r, c]);
    }
  }
  return cells;
}

function spawnTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const next = board.map((row) => [...row]);
  next[r][c] = value;
  return next;
}

function initBoard(): Board {
  let board = createEmptyBoard();
  board = spawnTile(board);
  board = spawnTile(board);
  return board;
}

/** Slide a single row to the left, merging equal adjacent tiles. Returns [newRow, scoreGained]. */
function slideRowLeft(row: (number | null)[]): [(number | null)[], number] {
  const tiles = row.filter((v) => v !== null) as number[];
  let score = 0;
  const merged: (number | null)[] = [];
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const val = tiles[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(tiles[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(null);
  return [merged, score];
}

function rotateClockwise(board: Board): Board {
  const n = 4;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => board[n - 1 - c][r])
  );
}

function rotateCounterClockwise(board: Board): Board {
  const n = 4;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => board[c][n - 1 - r])
  );
}

function rotate180(board: Board): Board {
  return rotateClockwise(rotateClockwise(board));
}

type Direction = 'left' | 'right' | 'up' | 'down';

function moveBoard(board: Board, direction: Direction): [Board, number] {
  let rotated: Board;
  // Rotate so the target direction becomes "left"
  switch (direction) {
    case 'left':
      rotated = board;
      break;
    case 'right':
      rotated = rotate180(board);
      break;
    case 'up':
      rotated = rotateClockwise(board);
      break;
    case 'down':
      rotated = rotateCounterClockwise(board);
      break;
  }

  let totalScore = 0;
  const slid = rotated.map((row) => {
    const [newRow, score] = slideRowLeft(row);
    totalScore += score;
    return newRow;
  });

  // Rotate back
  let result: Board;
  switch (direction) {
    case 'left':
      result = slid;
      break;
    case 'right':
      result = rotate180(slid);
      break;
    case 'up':
      result = rotateCounterClockwise(slid);
      break;
    case 'down':
      result = rotateClockwise(slid);
      break;
  }

  return [result, totalScore];
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v === 2048));
}

function isGameOver(board: Board): boolean {
  if (getEmptyCells(board).length > 0) return false;
  const dirs: Direction[] = ['left', 'right', 'up', 'down'];
  return dirs.every((dir) => boardsEqual(board, moveBoard(board, dir)[0]));
}

const BEST_KEY = '2048-best';

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // ignore
  }
}

function makeInitialState(): Game2048State {
  return {
    board: initBoard(),
    score: 0,
    best: loadBest(),
    gameOver: false,
    won: false,
    continueAfterWin: false,
  };
}

export function use2048Game() {
  const [state, setState] = useState<Game2048State>(makeInitialState);

  const move = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.gameOver) return prev;
      if (prev.won && !prev.continueAfterWin) return prev;

      const [moved, gained] = moveBoard(prev.board, direction);
      if (boardsEqual(prev.board, moved)) return prev; // no change

      const withTile = spawnTile(moved);
      const newScore = prev.score + gained;
      const newBest = Math.max(prev.best, newScore);
      if (newBest > prev.best) saveBest(newBest);

      const justWon = !prev.won && hasWon(withTile);
      const over = isGameOver(withTile);

      return {
        ...prev,
        board: withTile,
        score: newScore,
        best: newBest,
        won: prev.won || justWon,
        gameOver: over,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...makeInitialState(),
      best: prev.best,
    }));
  }, []);

  const continueGame = useCallback(() => {
    setState((prev) => ({ ...prev, continueAfterWin: true }));
  }, []);

  return { state, move, reset, continueGame };
}
