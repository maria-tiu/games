import type { Board, Tetromino, Position, CellValue } from '../types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(0)
  );
}

export function rotateTetromino(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

export function isValidPosition(
  board: Board,
  piece: Tetromino,
  position: Position
): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const newR = position.y + r;
      const newC = position.x + c;
      if (newR < 0 || newR >= BOARD_HEIGHT || newC < 0 || newC >= BOARD_WIDTH) {
        return false;
      }
      if (board[newR][newC] !== 0) {
        return false;
      }
    }
  }
  return true;
}

export function placePiece(board: Board, piece: Tetromino, position: Position): Board {
  const newBoard: Board = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const newR = position.y + r;
      const newC = position.x + c;
      if (newR >= 0 && newR < BOARD_HEIGHT && newC >= 0 && newC < BOARD_WIDTH) {
        newBoard[newR][newC] = piece.color;
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard = board.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  const emptyRows: Board = Array.from({ length: linesCleared }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(0)
  );
  return { newBoard: [...emptyRows, ...newBoard], linesCleared };
}

export function calculateScore(linesCleared: number, level: number): number {
  const basePoints = [0, 100, 300, 500, 800];
  return (basePoints[linesCleared] ?? 0) * level;
}

export function getDropInterval(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 90);
}

export function getInitialPosition(piece: Tetromino): Position {
  return {
    x: Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2),
    y: 0,
  };
}
