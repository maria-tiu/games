import React from 'react';
import Cell from './Cell';
import type { Tetromino } from '../types';
import './NextPiece.css';

interface NextPieceProps {
  piece: Tetromino | null;
}

const PREVIEW_SIZE = 4;

const NextPiece: React.FC<NextPieceProps> = ({ piece }) => {
  const grid: (string | 0)[][] = Array.from({ length: PREVIEW_SIZE }, () =>
    Array(PREVIEW_SIZE).fill(0)
  );

  if (piece) {
    const rowOffset = Math.floor((PREVIEW_SIZE - piece.shape.length) / 2);
    const colOffset = Math.floor((PREVIEW_SIZE - piece.shape[0].length) / 2);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          grid[rowOffset + r][colOffset + c] = piece.color;
        }
      }
    }
  }

  return (
    <div className="next-piece">
      <h3>Next</h3>
      <div className="next-piece-grid">
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <Cell key={`${ri}-${ci}`} value={cell} />
          ))
        )}
      </div>
    </div>
  );
};

export default NextPiece;
