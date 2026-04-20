import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Dashboard.css';

interface Game {
  id: string;
  name: string;
  players: number;
  route: string;
  score: number;
}

const GAMES: Game[] = [
  { id: 'tetris', name: 'Tetris', players: 1, route: '/tetris', score: 0 },
];

export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handlePlay = (game: Game) => {
    if (!isLoggedIn) return;
    navigate(game.route);
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
              <th>Your score</th>
            </tr>
          </thead>
          <tbody>
            {GAMES.map((game) => (
              <tr key={game.id}>
                <td className="game-name">{game.name}</td>
                <td>{game.players}</td>
                <td>
                  <button
                    className="btn-action btn-add"
                    disabled={!isLoggedIn}
                    title={!isLoggedIn ? 'Login to add to playlist' : 'Add to playlist'}
                  >
                    Add to playlist
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
                <td className="game-score">{game.score}</td>
              </tr>
            ))}
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
