import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePlaylist } from '../context/usePlaylist';
import { ALL_GAMES } from '../context/PlaylistContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { username } = useAuth();
  const { playlist, removeFromPlaylist } = usePlaylist();
  const navigate = useNavigate();

  const playlistGames = ALL_GAMES.filter((g) => playlist.includes(g.id));

  return (
    <div className="profile-page">
      <h2 className="profile-title">Profile</h2>
      <p className="profile-username">Logged in as <span>{username}</span></p>

      <h3 className="profile-section-title">My Playlist</h3>
      <div className="profile-playlist">
        {playlistGames.length === 0 ? (
          <p className="profile-playlist-empty">
            No games in your playlist yet. Head to the <Link to="/" className="profile-dashboard-link">dashboard</Link> to add some!
          </p>
        ) : (
          playlistGames.map((game) => (
            <div key={game.id} className="profile-playlist-card">
              <div>
                <div className="profile-playlist-card-name">{game.name}</div>
                <div className="profile-playlist-card-players">{game.players} player{game.players !== 1 ? 's' : ''}</div>
              </div>
              <div className="profile-playlist-card-actions">
                <button
                  className="profile-btn profile-btn-play"
                  onClick={() => navigate(game.route)}
                >
                  Play
                </button>
                <button
                  className="profile-btn profile-btn-remove"
                  onClick={() => removeFromPlaylist(game.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
