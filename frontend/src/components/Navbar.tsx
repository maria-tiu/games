import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand-link">🎮 GAMES</Link>
      <div className="navbar-auth">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {isLoggedIn ? (
          <>
            <Link to="/profile" className="navbar-username">👤 {username}</Link>
            <button className="navbar-logout-btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/auth" className="navbar-login-link">Login / Sign Up</Link>
        )}
      </div>
    </nav>
  );
}
