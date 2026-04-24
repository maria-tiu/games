import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import { useGameSound } from '../hooks/useGameSound';
import './SlidingPuzzle.css';

type Board = number[];

const SHUFFLE_MOVES_MULTIPLIER = 100;

function createSolvedBoard(size: number): Board {
  const total = size * size;
  return Array.from({ length: total }, (_, i) => (i + 1) % total);
}

function isSolved(board: Board, size: number): boolean {
  const solved = createSolvedBoard(size);
  return board.every((val, i) => val === solved[i]);
}

function shuffle(board: Board, size: number): Board {
  const b = [...board];
  let blankIdx = b.indexOf(0);
  const moves = size * size * SHUFFLE_MOVES_MULTIPLIER;
  for (let i = 0; i < moves; i++) {
    const row = Math.floor(blankIdx / size);
    const col = blankIdx % size;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(blankIdx - size);
    if (row < size - 1) neighbors.push(blankIdx + size);
    if (col > 0) neighbors.push(blankIdx - 1);
    if (col < size - 1) neighbors.push(blankIdx + 1);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    [b[blankIdx], b[pick]] = [b[pick], b[blankIdx]];
    blankIdx = pick;
  }
  // Ensure not already solved after shuffle
  if (isSolved(b, size)) return shuffle(board, size);
  return b;
}

function canMove(tileIdx: number, blankIdx: number, size: number): boolean {
  const tileRow = Math.floor(tileIdx / size);
  const tileCol = tileIdx % size;
  const blankRow = Math.floor(blankIdx / size);
  const blankCol = blankIdx % size;
  return (
    (tileRow === blankRow && Math.abs(tileCol - blankCol) === 1) ||
    (tileCol === blankCol && Math.abs(tileRow - blankRow) === 1)
  );
}

const SIZES = [3, 4, 5];
const TILE_SIZE: Record<number, number> = { 3: 100, 4: 80, 5: 64 };

export default function SlidingPuzzle() {
  const navigate = useNavigate();
  const { isLoggedIn, username, token } = useAuth();
  const [size, setSize] = useState(4);
  const [board, setBoard] = useState<Board>(() => shuffle(createSolvedBoard(4), 4));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const { isMuted, startMusic, stopMusic, playTileSlide, playWin: playSoundWin, toggleMute } = useGameSound('sliding-puzzle');
  const hasStartedRef = useRef(false);

  const startNewGame = useCallback((newSize?: number) => {
    const s = newSize ?? size;
    if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
    setBoard(shuffle(createSolvedBoard(s), s));
    setMoves(0);
    setWon(false);
    setSeconds(0);
    setRunning(true);
  }, [size]);

  const handleSizeChange = (s: number) => {
    setSize(s);
    const solved = createSolvedBoard(s);
    setBoard(shuffle(solved, s));
    setMoves(0);
    setWon(false);
    setSeconds(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || won) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [running, won]);

  const submitPuzzleScore = useCallback((completedMoves: number) => {
    if (!isLoggedIn || !username || !token) return;
    const puzzleScore = Math.max(0, 1000 - completedMoves);
    submitScore(
      { game_id: 'sliding-puzzle', player_name: username, score: puzzleScore, lines_cleared: completedMoves, level: size },
      token,
    ).catch(() => {});
  }, [isLoggedIn, username, token, size]);

  const handleTileClick = (idx: number) => {
    if (won) return;
    if (!hasStartedRef.current) { hasStartedRef.current = true; startMusic(); }
    const blankIdx = board.indexOf(0);
    if (!canMove(idx, blankIdx, size)) return;
    playTileSlide();
    const newBoard = [...board];
    [newBoard[blankIdx], newBoard[idx]] = [newBoard[idx], newBoard[blankIdx]];
    const newMoves = moves + 1;
    setBoard(newBoard);
    setMoves(newMoves);
    if (isSolved(newBoard, size)) {
      setWon(true);
      setRunning(false);
      submitPuzzleScore(newMoves);
      playSoundWin();
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (won) return;
    const blankIdx = board.indexOf(0);
    const blankRow = Math.floor(blankIdx / size);
    const blankCol = blankIdx % size;
    let targetIdx = -1;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (blankCol < size - 1) targetIdx = blankIdx + 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (blankCol > 0) targetIdx = blankIdx - 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (blankRow < size - 1) targetIdx = blankIdx + size;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (blankRow > 0) targetIdx = blankIdx - size;
        break;
    }
    if (targetIdx >= 0) {
      const newBoard = [...board];
      [newBoard[blankIdx], newBoard[targetIdx]] = [newBoard[targetIdx], newBoard[blankIdx]];
      const newMoves = moves + 1;
      setBoard(newBoard);
      setMoves(newMoves);
      if (isSolved(newBoard, size)) {
        setWon(true);
        setRunning(false);
        submitPuzzleScore(newMoves);
      }
    }
  }, [board, size, moves, won, submitPuzzleScore]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => { stopMusic(); };
  }, [stopMusic]);

  const tileSize = TILE_SIZE[size] ?? 64;
  const solved = createSolvedBoard(size);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="sliding-puzzle-page">
      <button className="sliding-puzzle-back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>

      <header className="sliding-puzzle-header">
        <h1 className="sliding-puzzle-title">SLIDING PUZZLE</h1>
        <button
          className="sound-toggle-btn sliding-puzzle-sound-btn"
          onClick={() => toggleMute(!won && running)}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </header>

      <main className="sliding-puzzle-main">
        <div className="sliding-puzzle-info">
          <div className="sliding-puzzle-stat">
            <span className="sliding-puzzle-stat-label">Moves</span>
            <span className="sliding-puzzle-stat-value">{moves}</span>
          </div>
          <div className="sliding-puzzle-stat">
            <span className="sliding-puzzle-stat-label">Time</span>
            <span className="sliding-puzzle-stat-value">{formatTime(seconds)}</span>
          </div>
        </div>

        <div className="sliding-puzzle-size-selector">
          <span className="sliding-puzzle-size-label">Size:</span>
          {SIZES.map((s) => (
            <button
              key={s}
              className={`sliding-puzzle-size-btn${size === s ? ' active' : ''}`}
              onClick={() => handleSizeChange(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        <div className="sliding-puzzle-board-wrapper">
          <div
            className="sliding-puzzle-board"
            style={{ gridTemplateColumns: `repeat(${size}, ${tileSize}px)` }}
          >
            {board.map((val, idx) => (
              <div
                key={idx}
                className={`sliding-puzzle-tile${val === 0 ? ' empty' : ''}${val !== 0 && val === solved[idx] ? ' solved' : ''}`}
                style={{ width: tileSize, height: tileSize, fontSize: tileSize < 80 ? 16 : 22 }}
                onClick={() => handleTileClick(idx)}
                role={val !== 0 ? 'button' : undefined}
                aria-label={val !== 0 ? `Tile ${val}` : 'Empty space'}
                tabIndex={val !== 0 ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleTileClick(idx);
                }}
              >
                {val !== 0 ? val : ''}
              </div>
            ))}
          </div>

          {won && (
            <div className="sliding-puzzle-won-overlay">
              <div className="sliding-puzzle-won-title">🎉 PUZZLE SOLVED!</div>
              <div className="sliding-puzzle-won-moves">
                Completed in {moves} moves · {formatTime(seconds)}
              </div>
              <button
                className="sliding-puzzle-btn sliding-puzzle-btn-new"
                onClick={() => startNewGame()}
              >
                New Game
              </button>
            </div>
          )}
        </div>

        <div className="sliding-puzzle-controls">
          <button
            className="sliding-puzzle-btn sliding-puzzle-btn-new"
            onClick={() => startNewGame()}
          >
            New Game
          </button>
        </div>

        <p className="sliding-puzzle-instructions">
          Click a tile adjacent to the empty space to move it, or use arrow keys.
          Arrange all tiles in order from 1 to {size * size - 1}.
        </p>
      </main>
    </div>
  );
}
