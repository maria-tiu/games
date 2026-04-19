import type { Tetromino, TetrominoType } from '../types';

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    type: 'I',
    color: '#00f0f0',
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    type: 'O',
    color: '#f0f000',
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    type: 'T',
    color: '#a000f0',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  S: {
    type: 'S',
    color: '#00f000',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  Z: {
    type: 'Z',
    color: '#f00000',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
  J: {
    type: 'J',
    color: '#0000f0',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    type: 'L',
    color: '#f0a000',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
};

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function getRandomTetromino(): Tetromino {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  return { ...TETROMINOES[type], shape: TETROMINOES[type].shape.map((row) => [...row]) };
}
