import React from 'react';
import type { CellValue } from '../types';
import './Cell.css';

interface CellProps {
  value: CellValue;
  isGhost?: boolean;
}

const Cell: React.FC<CellProps> = ({ value, isGhost }) => {
  const style: React.CSSProperties = value !== 0
    ? isGhost
      ? {
          border: `2px solid ${value as string}`,
          opacity: 0.35,
        }
      : {
          backgroundColor: value as string,
          backgroundImage: `linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.25) 100%)`,
          boxShadow: `
            inset 3px 3px 5px rgba(255,255,255,0.45),
            inset -3px -3px 5px rgba(0,0,0,0.45),
            2px 2px 4px rgba(0,0,0,0.5)
          `,
          border: `1px solid rgba(255,255,255,0.15)`,
          borderRadius: '3px',
        }
    : {};
  return <div className={`cell${value !== 0 ? ' filled' : ''}`} style={style} />;
};

export default Cell;
