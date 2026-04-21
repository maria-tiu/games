import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, username, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">🎮 GAMES</div>
      <div className="navbar-auth">
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
