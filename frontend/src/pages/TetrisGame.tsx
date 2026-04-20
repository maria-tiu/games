import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from '../components/Board';
import NextPiece from '../components/NextPiece';
import GameInfo from '../components/GameInfo';
import HighScores, { ScoreSubmitForm } from '../components/HighScores';
import { useTetrisGame } from '../hooks/useTetrisGame';
import { fetchHighScores, submitScore } from '../api/scores';
import type { ScoreEntry } from '../types';
import '../App.css';

export default function TetrisGame() {
  const {
    gameState,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    resetGame,
    togglePause,
    getGhostPosition,
    dropInterval,
  } = useTetrisGame();

  const navigate = useNavigate();
  const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const loadHighScores = useCallback(async () => {
    try {
      setScoresLoading(true);
      setScoresError(null);
      const data = await fetchHighScores();
      setHighScores(data);
    } catch {
      setScoresError('Could not load scores');
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHighScores();
  }, [loadHighScores]);

  useEffect(() => {
    if (gameState.isGameOver && gameState.score > 0 && !scoreSubmitted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSubmitForm(true);
    }
  }, [gameState.isGameOver, gameState.score, scoreSubmitted]);

  useEffect(() => {
    if (dropTimerRef.current) {
      clearInterval(dropTimerRef.current);
    }
    if (!gameState.isGameOver && !gameState.isPaused) {
      dropTimerRef.current = setInterval(() => {
        moveDown(false);
      }, dropInterval);
    }
    return () => {
      if (dropTimerRef.current) {
        clearInterval(dropTimerRef.current);
      }
    };
  }, [gameState.isGameOver, gameState.isPaused, dropInterval, moveDown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown(false);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          moveDown(true);
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, togglePause]);

  const handleStartGame = useCallback(() => {
    setShowSubmitForm(false);
    setScoreSubmitted(false);
    resetGame();
  }, [resetGame]);

  const handleSubmitScore = useCallback(async (name: string) => {
    setSubmitting(true);
    try {
      await submitScore({
        player_name: name,
        score: gameState.score,
        lines_cleared: gameState.linesCleared,
        level: gameState.level,
      });
      setScoreSubmitted(true);
      setShowSubmitForm(false);
      await loadHighScores();
    } catch {
      setShowSubmitForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [gameState.score, gameState.linesCleared, gameState.level, loadHighScores]);

  const ghostPosition =
    gameState.currentPiece
      ? getGhostPosition(gameState.board, gameState.currentPiece, gameState.currentPosition)
      : null;

  return (
    <div className="app">
      <button className="tetris-back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>
      <header className="app-header">
        <h1 className="app-title">TETRIS</h1>
      </header>
      <main className="game-container">
        <aside className="sidebar sidebar-left">
          <NextPiece piece={gameState.nextPiece} />
          <HighScores
            scores={highScores}
            loading={scoresLoading}
            error={scoresError}
          />
        </aside>

        <div className="board-wrapper">
          <GameBoard
            board={gameState.board}
            currentPiece={gameState.currentPiece}
            currentPosition={gameState.currentPosition}
            ghostPosition={ghostPosition}
          />
          {gameState.isPaused && !gameState.isGameOver && (
            <div className="overlay">
              <span>PAUSED</span>
            </div>
          )}
          {gameState.isGameOver && !showSubmitForm && (
            <div className="overlay game-over-overlay">
              <span>GAME OVER</span>
              <button className="btn btn-start" onClick={handleStartGame}>
                New Game
              </button>
            </div>
          )}
          {showSubmitForm && (
            <div className="overlay">
              <ScoreSubmitForm onSubmit={handleSubmitScore} submitting={submitting} />
            </div>
          )}
        </div>

        <aside className="sidebar sidebar-right">
          <GameInfo
            score={gameState.score}
            level={gameState.level}
            linesCleared={gameState.linesCleared}
            isGameOver={gameState.isGameOver}
            isPaused={gameState.isPaused}
            onStart={handleStartGame}
            onPause={togglePause}
          />
        </aside>
      </main>
    </div>
  );
}
