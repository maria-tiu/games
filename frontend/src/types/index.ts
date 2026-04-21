export type CellValue = 0 | string;
export type BoardRow = CellValue[];
export type Board = BoardRow[];

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  shape: number[][];
  color: string;
  type: TetrominoType;
}

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface GameState {
  board: Board;
  currentPiece: Tetromino | null;
  currentPosition: Position;
  nextPiece: Tetromino | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface ScoreEntry {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  lines_cleared: number;
  level: number;
  created_at: string;
}

export interface ScoreSubmission {
  game_id: string;
  player_name: string;
  score: number;
  lines_cleared: number;
  level: number;
}
