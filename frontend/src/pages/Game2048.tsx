import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { use2048Game } from '../hooks/use2048Game';
import './Game2048.css';

function getTileClass(value: number | null): string {
  if (value === null) return '';
  if (value <= 2048) return `tile-${value}`;
  return 'tile-high';
}

export default function Game2048() {
  const { state, move, reset, continueGame } = use2048Game();
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move('down');
          break;
      }
    },
    [move],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return; // ignore tiny swipes
      if (absDx > absDy) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
    },
    [move],
  );

  const showOverlay =
    state.gameOver || (state.won && !state.continueAfterWin);

  return (
    <div className="game-2048">
      <button
        className="game-2048-back-btn"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>

      <div className="game-2048-header">
        <h1 className="game-2048-title">2048</h1>
        <div className="game-2048-scores">
          <div className="score-box">
            <div className="score-box-label">Score</div>
            <div className="score-box-value">{state.score}</div>
          </div>
          <div className="score-box">
            <div className="score-box-label">Best</div>
            <div className="score-box-value">{state.best}</div>
          </div>
        </div>
      </div>

      <div className="game-2048-controls">
        <p className="game-2048-subtitle">
          Join the tiles, get to&nbsp;<strong>2048!</strong>
        </p>
        <button className="btn-2048" onClick={reset}>
          New Game
        </button>
      </div>

      <div
        className="game-2048-board-wrapper"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="game-2048-grid">
          {state.board.map((row, r) =>
            row.map((cell, c) =>
              cell === null ? (
                <div key={`${r}-${c}`} className="game-2048-cell" />
              ) : (
                <div
                  key={`${r}-${c}`}
                  className={`game-2048-tile ${getTileClass(cell)}`}
                >
                  {cell}
                </div>
              ),
            ),
          )}
        </div>

        {showOverlay && (
          <div className="game-2048-overlay">
            {state.gameOver ? (
              <>
                <div className="game-2048-overlay-title game-over-text">
                  Game Over!
                </div>
                <button className="btn-2048" onClick={reset}>
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="game-2048-overlay-title you-win-text">
                  You Win!
                </div>
                <button className="btn-2048" onClick={continueGame}>
                  Keep Going
                </button>
                <button className="btn-2048" onClick={reset}>
                  New Game
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="game-2048-instructions">
        Use <strong>arrow keys</strong> or <strong>WASD</strong> to move tiles.
        On mobile, <strong>swipe</strong> to move. When two tiles with the same
        number touch, they merge into one!
      </p>
    </div>
  );
}
