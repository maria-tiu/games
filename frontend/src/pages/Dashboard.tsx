import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePlaylist } from '../context/usePlaylist';
import { fetchHighScores } from '../api/scores';
import type { ScoreEntry } from '../types';
import GameInstructionsModal from '../components/GameInstructionsModal';
import { GAME_INSTRUCTIONS } from '../data/gameInstructions';
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
  const [instructionsGameId, setInstructionsGameId] = useState<string | null>(null);

  useEffect(() => {
    fetchHighScores()
      .then((scores) => {
        if (scores.length > 0) {
          // The scores API currently returns only Tetris scores (no game_id field).
          // We populate the map using each game's own id as the key so the table
          // stays data-driven even if more games with separate endpoints are added.
          const map: Record<string, ScoreEntry> = {};
          for (const game of GAMES) {
            const top = scores[0]; // API returns scores sorted by score desc
            if (top) map[game.id] = top;
          }
          setBestScores(map);
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
              const hasInstructions = game.id in GAME_INSTRUCTIONS;
              return (
                <tr key={game.id}>
                  <td className="game-name">
                    {game.name}
                    {hasInstructions && (
                      <button
                        className="btn-info"
                        onClick={() => setInstructionsGameId(game.id)}
                        title={`How to play ${game.name}`}
                        aria-label={`How to play ${game.name}`}
                      >
                        ?
                      </button>
                    )}
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

      {instructionsGameId && (
        <GameInstructionsModal
          gameId={instructionsGameId}
          onClose={() => setInstructionsGameId(null)}
        />
      )}
    </div>
  );
}
