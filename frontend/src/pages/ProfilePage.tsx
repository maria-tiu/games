import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePlaylist } from '../context/usePlaylist';
import { fetchUserProfile, updateUserProfile } from '../api/profile';
import type { UserProfile } from '../api/profile';
import './ProfilePage.css';

const GAME_ROUTES: Record<string, string> = {
  tetris: '/tetris',
  breakout: '/breakout',
};

function formatErrors(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const obj = err as Record<string, unknown>;
  return Object.values(obj)
    .map((v) => (Array.isArray(v) ? v.join(' ') : String(v)))
    .join(' ');
}

export default function ProfilePage() {
  const { isLoggedIn, username, token, updateUsername } = useAuth();
  const { playlist, removeGame } = usePlaylist();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit state
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth', { replace: true });
      return;
    }
    if (!token) return;
    fetchUserProfile(token)
      .then((p) => {
        setProfile(p);
        setNewUsername(p.username);
        setNewEmail(p.email);
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [isLoggedIn, token, navigate]);

  const handleSaveUsername = async () => {
    if (!token || !profile) return;
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const updated = await updateUserProfile(token, { username: newUsername.trim() });
      setProfile(updated);
      updateUsername(updated.username);
      setNewUsername(updated.username);
      setEditingUsername(false);
      setSuccessMsg('Nickname updated successfully.');
    } catch (err) {
      setError(formatErrors(err) || 'Failed to update nickname.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!token || !profile) return;
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const updated = await updateUserProfile(token, { email: newEmail.trim() });
      setProfile(updated);
      setNewEmail(updated.email);
      setEditingEmail(false);
      setSuccessMsg('Email updated successfully.');
    } catch (err) {
      setError(formatErrors(err) || 'Failed to update email.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGame = async (id: number) => {
    setRemovingId(id);
    try {
      await removeGame(id);
    } catch {
      // ignore errors
    } finally {
      setRemovingId(null);
    }
  };

  const handlePlay = (gameId: string) => {
    const route = GAME_ROUTES[gameId];
    if (route) navigate(route);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="profile-page">
      <h2 className="profile-title">My Profile</h2>

      {error && <div className="profile-alert profile-alert--error">{error}</div>}
      {successMsg && <div className="profile-alert profile-alert--success">{successMsg}</div>}

      {loadingProfile ? (
        <p className="profile-loading">Loading profile…</p>
      ) : (
        <div className="profile-info">
          <div className="profile-field">
            <span className="profile-field-label">Nickname</span>
            {editingUsername ? (
              <div className="profile-field-edit">
                <input
                  className="profile-input"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn-profile btn-save"
                  onClick={() => void handleSaveUsername()}
                  disabled={saving || !newUsername.trim()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="btn-profile btn-cancel"
                  onClick={() => {
                    setEditingUsername(false);
                    setNewUsername(profile?.username ?? username ?? '');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-field-value">
                <span>{profile?.username ?? username}</span>
                <button
                  className="btn-profile btn-edit"
                  onClick={() => setEditingUsername(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            {editingEmail ? (
              <div className="profile-field-edit">
                <input
                  className="profile-input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn-profile btn-save"
                  onClick={() => void handleSaveEmail()}
                  disabled={saving || !newEmail.trim()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="btn-profile btn-cancel"
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmail(profile?.email ?? '');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-field-value">
                <span>{profile?.email ?? '—'}</span>
                <button
                  className="btn-profile btn-edit"
                  onClick={() => setEditingEmail(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="profile-section-title">My Game Playlist</h3>

      {playlist.length === 0 ? (
        <p className="profile-empty">
          No games in your playlist yet.{' '}
          <a href="/" className="profile-link">Browse games</a> to add some!
        </p>
      ) : (
        <div className="profile-table-wrapper">
          <table className="profile-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Play now</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {playlist.map((entry) => (
                <tr key={entry.id}>
                  <td className="game-name">{entry.game_name}</td>
                  <td>
                    <button
                      className="btn-action btn-play"
                      onClick={() => handlePlay(entry.game_id)}
                      title={`Play ${entry.game_name}`}
                    >
                      Play
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-action btn-remove"
                      disabled={removingId === entry.id}
                      onClick={() => void handleRemoveGame(entry.id)}
                      title={`Remove ${entry.game_name} from playlist`}
                    >
                      {removingId === entry.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
