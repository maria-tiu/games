import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePlaylist } from '../context/usePlaylist';
import { fetchHighScores } from '../api/scores';
import type { ScoreEntry } from '../types';
import './Dashboard.css';

interface Game {
  id: string;
  name: string;
  players: number;
  route: string;
}

const GAMES: Game[] = [
  { id: 'tetris', name: 'Tetris', players: 1, route: '/tetris' },
];

export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const { isInPlaylist, addGame } = usePlaylist();
  const navigate = useNavigate();
  const [addingGame, setAddingGame] = useState<string | null>(null);
  const [bestScores, setBestScores] = useState<Record<string, ScoreEntry>>({});

  useEffect(() => {
    fetchHighScores()
      .then((scores) => {
        // The API returns scores sorted descending by score; pick the top entry per game.
        // Currently there is only one game (tetris) so we just take scores[0].
        if (scores.length > 0) {
          setBestScores({ tetris: scores[0] });
        }
      })
      .catch(() => {
        // ignore — best score column will simply be empty
      });
  }, []);

  const handlePlay = (game: Game) => {
    if (!isLoggedIn) return;
    navigate(game.route);
  };

  const handleAddToPlaylist = async (game: Game) => {
    if (!isLoggedIn || addingGame) return;
    setAddingGame(game.id);
    try {
      await addGame(game.id, game.name);
    } catch {
      // ignore errors
    } finally {
      setAddingGame(null);
    }
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Board of Games</h2>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Number of players</th>
              <th>Add to playlist</th>
              <th>Play now</th>
              <th>Best score</th>
            </tr>
          </thead>
          <tbody>
            {GAMES.map((game) => {
              const inPlaylist = isInPlaylist(game.id);
              const best = bestScores[game.id];
              return (
                <tr key={game.id}>
                  <td className="game-name">{game.name}</td>
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
                      {inPlaylist ? 'Added ✓' : addingGame === game.id ? 'Adding…' : 'Add to playlist'}
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
                  <td className="game-score">
                    {best ? (
                      <>
                        <span>{best.score}</span>
                        <div className="game-best-player">{best.player_name}</div>
                      </>
                    ) : (
                      <span className="game-score-none">—</span>
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
