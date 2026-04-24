import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { use2048Game } from '../hooks/use2048Game';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import GameInfoButton from '../components/GameInfoButton';
import { useGameSound } from '../hooks/useGameSound';
import './Game2048.css';

function getTileClass(value: number | null): string {
  if (value === null) return '';
  if (value <= 2048) return `tile-${value}`;
  return 'tile-high';
}

export default function Game2048() {
  const { state, move, reset, continueGame } = use2048Game();
  const { isLoggedIn, username, token } = useAuth();
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const { isMuted, startMusic, playTileMove, playMerge, playWin: playSoundWin, playGameOver, toggleMute } = useGameSound('2048');
  const hasStartedRef = useRef(false);
  const prevScoreRef = useRef(0);
  const wonPlayedRef = useRef(false);
  const gameOverPlayedRef = useRef(false);

  // Auto-submit score when game ends (game over OR user wins and hasn't continued).
  // This covers: reaching 2048 then clicking "New Game", and truly running out of moves.
  useEffect(() => {
    const gameEnded = state.gameOver || (state.won && !state.continueAfterWin);
    if (gameEnded && state.score > 0 && !scoreSubmitted && isLoggedIn && username && token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScoreSubmitted(true);
      submitScore(
        {
          game_id: '2048',
          player_name: username,
          score: state.score,
          lines_cleared: 0,
          level: 1,
        },
        token,
      ).catch(() => {});
    }
  }, [state.gameOver, state.won, state.continueAfterWin, state.score, scoreSubmitted, isLoggedIn, username, token]);

  useEffect(() => {
    if (state.score > prevScoreRef.current) {
      playMerge();
    }
    prevScoreRef.current = state.score;
  }, [state.score, playMerge]);

  useEffect(() => {
    if (state.won && !wonPlayedRef.current) {
      wonPlayedRef.current = true;
      playSoundWin();
    }
  }, [state.won, playSoundWin]);

  useEffect(() => {
    if (state.gameOver && !gameOverPlayedRef.current) {
      gameOverPlayedRef.current = true;
      playGameOver();
    }
  }, [state.gameOver, playGameOver]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
          playTileMove();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
          playTileMove();
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
          playTileMove();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
          playTileMove();
          move('down');
          break;
      }
    },
    [move, startMusic, playTileMove],
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
      if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return; // ignore tiny swipes
      if (absDx > absDy) {
        playTileMove();
        move(dx > 0 ? 'right' : 'left');
      } else {
        playTileMove();
        move(dy > 0 ? 'down' : 'up');
      }
    },
    [move, startMusic, playTileMove],
  );

  const showOverlay =
    state.gameOver || (state.won && !state.continueAfterWin);

  const handleReset = useCallback(() => {
    setScoreSubmitted(false);
    wonPlayedRef.current = false;
    gameOverPlayedRef.current = false;
    prevScoreRef.current = 0;
    reset();
  }, [reset]);

  return (
    <div className="game-2048">
      <button
        className="game-2048-back-btn"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>

      <div className="game-2048-header">
        <h1 className="game-2048-title">
          2048
          <GameInfoButton gameId="2048" />
        </h1>
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
        <button
          className="sound-toggle-btn"
          onClick={() => toggleMute(!state.gameOver && !state.won)}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="game-2048-controls">
        <p className="game-2048-subtitle">
          Join the tiles, get to&nbsp;<strong>2048!</strong>
        </p>
        <button className="btn-2048" onClick={handleReset}>
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
                <button className="btn-2048" onClick={handleReset}>
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="game-2048-overlay-title you-win-text">
                  You Win!
                </div>
                <button className="btn-2048" onClick={() => { setScoreSubmitted(false); continueGame(); }}>
                  Keep Going
                </button>
                <button className="btn-2048" onClick={handleReset}>
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
