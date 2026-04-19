import React from 'react';
import './GameInfo.css';

interface GameInfoProps {
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({
  score,
  level,
  linesCleared,
  isGameOver,
  isPaused,
  onStart,
  onPause,
}) => {
  return (
    <div className="game-info">
      <div className="info-block">
        <span className="info-label">Score</span>
        <span className="info-value">{score}</span>
      </div>
      <div className="info-block">
        <span className="info-label">Level</span>
        <span className="info-value">{level}</span>
      </div>
      <div className="info-block">
        <span className="info-label">Lines</span>
        <span className="info-value">{linesCleared}</span>
      </div>
      <div className="info-controls">
        {isGameOver ? (
          <button className="btn btn-start" onClick={onStart}>
            New Game
          </button>
        ) : (
          <button className="btn btn-pause" onClick={onPause}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
        {!isGameOver && (
          <button className="btn btn-restart" onClick={onStart}>
            Restart
          </button>
        )}
      </div>
      <div className="controls-hint">
        <p>← → Move</p>
        <p>↑ Rotate</p>
        <p>↓ Soft Drop</p>
        <p>Space Hard Drop</p>
        <p>P Pause</p>
      </div>
    </div>
  );
};

export default GameInfo;
