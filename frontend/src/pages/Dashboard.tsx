import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePlaylist } from '../context/usePlaylist';
import { fetchHighScores } from '../api/scores';
import type { ScoreEntry } from '../types';
import GameInfoButton from '../components/GameInfoButton';
import { GAME_INSTRUCTIONS } from '../data/gameInstructions';
import { useUISound } from '../hooks/useUISound';
import { useGameSound } from '../hooks/useGameSound';
import './Dashboard.css';

interface Game {
  id: string;
  name: string;
  players: number;
  route: string;
}

const GAMES: Game[] = [
  { id: 'tetris',         name: 'Tetris',         players: 1, route: '/tetris'         },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle',  players: 1, route: '/sliding-puzzle' },
  { id: '2048',           name: '2048',            players: 1, route: '/2048'           },
  { id: 'breakout',       name: 'Breakout',        players: 1, route: '/breakout'       },
  { id: 'mario',          name: 'Mario',           players: 1, route: '/mario'          },
  { id: 'pacman',  name: 'Pac-Man', players: 1, route: '/pacman' },
  { id: 'chess',   name: 'Chess',   players: 1, route: '/chess'  },
  { id: 'geometry-dash', name: 'Geometry Dash', players: 1, route: '/geometry-dash' },
];

export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const { isInPlaylist, addGame } = usePlaylist();
  const navigate = useNavigate();
  const [addingGame, setAddingGame] = useState<string | null>(null);
  const [allScores, setAllScores] = useState<Record<string, ScoreEntry[]>>({});
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ bottom: number; right: number } | null>(null);
  const { playClick, playHover } = useUISound();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isMuted: soundIsMuted, startMusic, stopMusic, toggleMute } = useGameSound('dashboard');
  const musicStartedRef = useRef(false);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!musicStartedRef.current) {
        musicStartedRef.current = true;
        startMusic();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      }
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      stopMusic();
    };
  }, [startMusic, stopMusic]);

  useEffect(() => {
    const map: Record<string, ScoreEntry[]> = {};
    const fetches = GAMES.map((game) =>
      fetchHighScores(game.id)
        .then((scores) => {
          map[game.id] = scores;
        })
        .catch(() => {
          // ignore — best score column will simply be empty for this game
        })
    );
    Promise.all(fetches).then(() => setAllScores({ ...map }));
  }, []);

  const handlePlay = (game: Game) => {
    if (!isLoggedIn) return;
    playClick();
    navigate(game.route);
  };

  const handleAddToPlaylist = async (game: Game) => {
    if (!isLoggedIn || addingGame) return;
    playClick();
    setAddingGame(game.id);
    try {
      await addGame(game.id, game.name);
    } catch {
      // ignore errors
    } finally {
      setAddingGame(null);
    }
  };

  const handleScoreMouseEnter = (gameId: string, e: React.MouseEvent<HTMLTableCellElement>) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({
      bottom: window.innerHeight - rect.top + 6,
      right: window.innerWidth - rect.right,
    });
    setHoveredGame(gameId);
  };

  const handlePopupMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleScoreMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => setHoveredGame(null), 150);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-title-row">
        <h2 className="dashboard-title">Board of Games</h2>
        <button
          className="sound-toggle-btn dashboard-sound-btn"
          onClick={() => toggleMute()}
          title={soundIsMuted ? 'Unmute music' : 'Mute music'}
          aria-label={soundIsMuted ? 'Unmute music' : 'Mute music'}
        >
          {soundIsMuted ? '🔇' : '🔊'}
        </button>
      </div>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Number of players</th>
              <th>Playlist</th>
              <th>Play now</th>
              <th>Best score</th>
            </tr>
          </thead>
          <tbody>
            {GAMES.map((game) => {
              const inPlaylist = isInPlaylist(game.id);
              const scores = allScores[game.id] ?? [];
              const best = scores[0];
              const hasInstructions = game.id in GAME_INSTRUCTIONS;
              return (
                <tr key={game.id} onMouseEnter={playHover} className="dashboard-row">
                  <td className="game-name">
                    {game.name}
                    {hasInstructions && <GameInfoButton gameId={game.id} />}
                  </td>
                  <td>{game.players}</td>
                  <td>
                    <button
                      className={`btn-action ${inPlaylist ? 'btn-added' : 'btn-add'}`}
                      disabled={!isLoggedIn || inPlaylist || addingGame === game.id}
                      onClick={() => void handleAddToPlaylist(game)}
                      title={
                        !isLoggedIn
                          ? 'Login to add to playlist'
                          : inPlaylist
                          ? 'Already in your playlist'
                          : 'Add to playlist'
                      }
                    >
                      {inPlaylist ? 'Added ✓' : addingGame === game.id ? '…' : 'Add'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-action btn-play"
                      disabled={!isLoggedIn}
                      onClick={() => handlePlay(game)}
                      title={!isLoggedIn ? 'Login to play' : `Play ${game.name}`}
                    >
                      Play
                    </button>
                  </td>
                  <td
                    className="game-score score-cell"
                    onMouseEnter={(e) => handleScoreMouseEnter(game.id, e)}
                    onMouseLeave={handleScoreMouseLeave}
                  >
                    {best ? (
                      <>
                        <span>{best.score}</span>
                        <div className="game-best-player">{best.player_name}</div>
                      </>
                    ) : (
                      <span className="game-score-none">—</span>
                    )}
                    {hoveredGame === game.id && scores.length > 0 && popupPos && (
                      <div
                        className="score-popup"
                        style={{ bottom: `${popupPos.bottom}px`, right: `${popupPos.right}px` }}
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handleScoreMouseLeave}
                      >
                        <div className="score-popup-title">Top 10 Scores</div>
                        <ol className="score-popup-list">
                          {scores.map((s, idx) => (
                            <li key={s.id} className="score-popup-item">
                              <span className="score-popup-rank">#{idx + 1}</span>
                              <span className="score-popup-name">{s.player_name}</span>
                              <span className="score-popup-value">{s.score}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isLoggedIn && (
        <p className="dashboard-login-hint">
          Please <a href="/auth">login or sign up</a> to start to play.
        </p>
      )}

    </div>
  );
}
