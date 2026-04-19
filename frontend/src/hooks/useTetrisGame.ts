import { useState, useCallback, useRef } from 'react';
import type { Board, Tetromino, Position } from '../types';
import {
  createEmptyBoard,
  isValidPosition,
  placePiece,
  clearLines,
  calculateScore,
  getDropInterval,
  getInitialPosition,
  rotateTetromino,
} from '../utils/gameHelpers';
import { getRandomTetromino } from '../utils/tetrominoes';

export interface TetrisGameState {
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

const initialState = (): TetrisGameState => {
  const next = getRandomTetromino();
  const current = getRandomTetromino();
  return {
    board: createEmptyBoard(),
    currentPiece: current,
    currentPosition: getInitialPosition(current),
    nextPiece: next,
    score: 0,
    level: 1,
    linesCleared: 0,
    isGameOver: false,
    isPaused: false,
  };
};

export function useTetrisGame() {
  const [gameState, setGameState] = useState<TetrisGameState>(initialState);
  const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetGame = useCallback(() => {
    if (dropTimerRef.current) {
      clearInterval(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    setGameState(initialState());
  }, []);

  const moveLeft = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;
      const newPos = { ...prev.currentPosition, x: prev.currentPosition.x - 1 };
      if (isValidPosition(prev.board, prev.currentPiece, newPos)) {
        return { ...prev, currentPosition: newPos };
      }
      return prev;
    });
  }, []);

  const moveRight = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;
      const newPos = { ...prev.currentPosition, x: prev.currentPosition.x + 1 };
      if (isValidPosition(prev.board, prev.currentPiece, newPos)) {
        return { ...prev, currentPosition: newPos };
      }
      return prev;
    });
  }, []);

  const rotate = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;
      const rotatedShape = rotateTetromino(prev.currentPiece.shape);
      const rotatedPiece = { ...prev.currentPiece, shape: rotatedShape };
      // Wall kick attempts
      const kicks = [0, 1, -1, 2, -2];
      for (const kick of kicks) {
        const kickPos = { ...prev.currentPosition, x: prev.currentPosition.x + kick };
        if (isValidPosition(prev.board, rotatedPiece, kickPos)) {
          return { ...prev, currentPiece: rotatedPiece, currentPosition: kickPos };
        }
      }
      return prev;
    });
  }, []);

  const lockPiece = useCallback((
    board: Board,
    piece: Tetromino,
    position: Position,
    score: number,
    level: number,
    linesTotal: number,
    nextPiece: Tetromino
  ): Partial<TetrisGameState> => {
    const newBoard = placePiece(board, piece, position);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
    const addedScore = calculateScore(linesCleared, level);
    const newLinesTotal = linesTotal + linesCleared;
    const newLevel = Math.floor(newLinesTotal / 10) + 1;
    const newScore = score + addedScore;

    const freshPiece = getRandomTetromino();
    const freshPosition = getInitialPosition(nextPiece);
    const isGameOver = !isValidPosition(clearedBoard, nextPiece, freshPosition);

    return {
      board: clearedBoard,
      currentPiece: isGameOver ? null : nextPiece,
      currentPosition: freshPosition,
      nextPiece: isGameOver ? null : freshPiece,
      score: newScore,
      level: newLevel,
      linesCleared: newLinesTotal,
      isGameOver,
    };
  }, []);

  const moveDown = useCallback((isHardDrop = false) => {
    setGameState((prev) => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;

      if (isHardDrop) {
        let dropY = prev.currentPosition.y;
        while (
          isValidPosition(prev.board, prev.currentPiece, { ...prev.currentPosition, y: dropY + 1 })
        ) {
          dropY++;
        }
        const dropPos = { ...prev.currentPosition, y: dropY };
        return {
          ...prev,
          ...lockPiece(
            prev.board,
            prev.currentPiece,
            dropPos,
            prev.score,
            prev.level,
            prev.linesCleared,
            prev.nextPiece!
          ),
        };
      }

      const newPos = { ...prev.currentPosition, y: prev.currentPosition.y + 1 };
      if (isValidPosition(prev.board, prev.currentPiece, newPos)) {
        return { ...prev, currentPosition: newPos };
      }

      return {
        ...prev,
        ...lockPiece(
          prev.board,
          prev.currentPiece,
          prev.currentPosition,
          prev.score,
          prev.level,
          prev.linesCleared,
          prev.nextPiece!
        ),
      };
    });
  }, [lockPiece]);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev.isGameOver) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  const getGhostPosition = useCallback((
    board: Board,
    piece: Tetromino,
    position: Position
  ): Position => {
    let ghostY = position.y;
    while (isValidPosition(board, piece, { ...position, y: ghostY + 1 })) {
      ghostY++;
    }
    return { ...position, y: ghostY };
  }, []);

  return {
    gameState,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    resetGame,
    togglePause,
    getGhostPosition,
    dropInterval: getDropInterval(gameState.level),
  };
}
