import React from 'react';
import type { CellValue } from '../types';
import './Cell.css';

interface CellProps {
  value: CellValue;
  isGhost?: boolean;
}

const Cell: React.FC<CellProps> = ({ value, isGhost }) => {
  const style: React.CSSProperties = value !== 0
    ? {
        backgroundColor: isGhost ? 'transparent' : (value as string),
        border: isGhost
          ? `2px solid ${value as string}`
          : '2px solid rgba(255,255,255,0.15)',
        boxShadow: isGhost ? 'none' : `inset 0 0 6px rgba(255,255,255,0.3)`,
        opacity: isGhost ? 0.4 : 1,
      }
    : {};
  return <div className={`cell${value !== 0 ? ' filled' : ''}`} style={style} />;
};

export default Cell;
