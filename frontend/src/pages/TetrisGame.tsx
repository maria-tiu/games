import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from '../components/Board';
import NextPiece from '../components/NextPiece';
import GameInfo from '../components/GameInfo';
import HighScores, { ScoreSubmitForm } from '../components/HighScores';
import { useTetrisGame } from '../hooks/useTetrisGame';
import { useTetrisSound } from '../hooks/useTetrisSound';
import { useAuth } from '../context/useAuth';
import { fetchHighScores, submitScore } from '../api/scores';
import { isValidPosition } from '../utils/gameHelpers';
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

  const {
    isMuted,
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playMove,
    playRotate,
    playDrop,
    playClear,
    playLevelUp,
    playGameOver,
    toggleMute,
  } = useTetrisSound();

  const { isLoggedIn, username, token } = useAuth();
  const navigate = useNavigate();
  const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Track previous game state values to detect events
  const prevLinesRef = useRef(gameState.linesCleared);
  const prevLevelRef = useRef(gameState.level);
  const prevIsGameOverRef = useRef(gameState.isGameOver);
  const prevIsPausedRef = useRef(gameState.isPaused);

  const loadHighScores = useCallback(async () => {
    try {
      setScoresLoading(true);
      setScoresError(null);
      const data = await fetchHighScores('tetris');
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
      if (isLoggedIn && username && token) {
        // Auto-submit score for logged-in users
        setSubmitting(true);
        submitScore(
          {
            game_id: 'tetris',
            player_name: username,
            score: gameState.score,
            lines_cleared: gameState.linesCleared,
            level: gameState.level,
          },
          token,
        )
          .then(() => {
            setScoreSubmitted(true);
            return loadHighScores();
          })
          .catch(() => {})
          .finally(() => setSubmitting(false));
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowSubmitForm(true);
      }
    }
  }, [gameState.isGameOver, gameState.score, scoreSubmitted, isLoggedIn, username, token, gameState.linesCleared, gameState.level, loadHighScores]);

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
    const linesNow = gameState.linesCleared;
    const levelNow = gameState.level;
    const isGameOverNow = gameState.isGameOver;
    const isPausedNow = gameState.isPaused;

    const linesAdded = linesNow - prevLinesRef.current;
    const levelUp = levelNow > prevLevelRef.current;
    const justGameOver = isGameOverNow && !prevIsGameOverRef.current;
    const justPaused = isPausedNow && !prevIsPausedRef.current;
    const justResumed = !isPausedNow && prevIsPausedRef.current;

    prevLinesRef.current = linesNow;
    prevLevelRef.current = levelNow;
    prevIsGameOverRef.current = isGameOverNow;
    prevIsPausedRef.current = isPausedNow;

    if (linesAdded > 0) {
      playClear(linesAdded);
    }
    if (levelUp) {
      playLevelUp();
    }
    if (justGameOver) {
      stopMusic();
      playGameOver();
    }
    if (justPaused) {
      pauseMusic();
    }
    if (justResumed && !isGameOverNow) {
      resumeMusic();
    }
  }, [
    gameState.linesCleared,
    gameState.level,
    gameState.isGameOver,
    gameState.isPaused,
    playClear,
    playLevelUp,
    playGameOver,
    stopMusic,
    pauseMusic,
    resumeMusic,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          if (
            gameState.currentPiece && !gameState.isGameOver && !gameState.isPaused &&
            isValidPosition(gameState.board, gameState.currentPiece, {
              ...gameState.currentPosition, x: gameState.currentPosition.x - 1,
            })
          ) playMove();
          moveLeft();
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (
            gameState.currentPiece && !gameState.isGameOver && !gameState.isPaused &&
            isValidPosition(gameState.board, gameState.currentPiece, {
              ...gameState.currentPosition, x: gameState.currentPosition.x + 1,
            })
          ) playMove();
          moveRight();
          break;
        }
        case 'ArrowDown':
          e.preventDefault();
          moveDown(false);
          break;
        case 'ArrowUp': {
          e.preventDefault();
          if (gameState.currentPiece && !gameState.isGameOver && !gameState.isPaused) {
            playRotate();
          }
          rotate();
          break;
        }
        case ' ':
          e.preventDefault();
          if (gameState.currentPiece && !gameState.isGameOver && !gameState.isPaused) {
            playDrop();
          }
          moveDown(true);
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        case 'm':
        case 'M':
          toggleMute(!gameState.isGameOver && !gameState.isPaused);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    moveLeft, moveRight, moveDown, rotate, togglePause, toggleMute,
    playMove, playRotate, playDrop,
    gameState.currentPiece, gameState.isGameOver, gameState.isPaused,
    gameState.board, gameState.currentPosition,
  ]);

  const handleStartGame = useCallback(() => {
    setShowSubmitForm(false);
    setScoreSubmitted(false);
    // Reset prev refs so events are detected correctly for the new game
    prevLinesRef.current = 0;
    prevLevelRef.current = 1;
    prevIsGameOverRef.current = false;
    prevIsPausedRef.current = false;
    resetGame();
    startMusic();
  }, [resetGame, startMusic]);

  const handleSubmitScore = useCallback(async (name: string) => {
    setSubmitting(true);
    try {
      await submitScore(
        {
          game_id: 'tetris',
          player_name: name,
          score: gameState.score,
          lines_cleared: gameState.linesCleared,
          level: gameState.level,
        },
        token ?? undefined,
      );
      setScoreSubmitted(true);
      setShowSubmitForm(false);
      await loadHighScores();
    } catch {
      setShowSubmitForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [gameState.score, gameState.linesCleared, gameState.level, token, loadHighScores]);

  const ghostPosition =
    gameState.currentPiece
      ? getGhostPosition(gameState.board, gameState.currentPiece, gameState.currentPosition)
      : null;

  return (
    <div className="app">
      <button className="tetris-back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>
      <header className="app-header">
        <h1 className="app-title">TETRIS</h1>
        <button
          className="tetris-mute-btn"
          onClick={() => toggleMute(!gameState.isGameOver && !gameState.isPaused)}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
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
