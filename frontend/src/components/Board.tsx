import React, { useMemo } from 'react';
import Cell from './Cell';
import type { Board, Tetromino, Position, CellValue } from '../types';
import './Board.css';

interface BoardProps {
  board: Board;
  currentPiece: Tetromino | null;
  currentPosition: Position;
  ghostPosition: Position | null;
}

const GameBoard: React.FC<BoardProps> = ({
  board,
  currentPiece,
  currentPosition,
  ghostPosition,
}) => {
  const displayBoard = useMemo<Board>(() => {
    const newBoard = board.map((row) => [...row]);

    // Draw ghost piece
    if (currentPiece && ghostPosition) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (!currentPiece.shape[r][c]) continue;
          const boardR = ghostPosition.y + r;
          const boardC = ghostPosition.x + c;
          if (boardR >= 0 && boardR < newBoard.length && boardC >= 0 && boardC < newBoard[0].length) {
            if (newBoard[boardR][boardC] === 0) {
              newBoard[boardR][boardC] = `ghost:${currentPiece.color}` as CellValue;
            }
          }
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (!currentPiece.shape[r][c]) continue;
          const boardR = currentPosition.y + r;
          const boardC = currentPosition.x + c;
          if (boardR >= 0 && boardR < newBoard.length && boardC >= 0 && boardC < newBoard[0].length) {
            newBoard[boardR][boardC] = currentPiece.color;
          }
        }
      }
    }

    return newBoard;
  }, [board, currentPiece, currentPosition, ghostPosition]);

  return (
    <div className="game-board">
      {displayBoard.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isGhost = typeof cell === 'string' && cell.startsWith('ghost:');
          const color: CellValue = isGhost ? (cell as string).replace('ghost:', '') : cell;
          return (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              value={color}
              isGhost={isGhost}
            />
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
