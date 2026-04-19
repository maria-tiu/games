import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, username, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">🎮 GAMES</div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/auth">Your board</Link></li>
      </ul>
      <div className="navbar-auth">
        {isLoggedIn ? (
          <>
            <span className="navbar-username">👤 {username}</span>
            <button className="navbar-logout-btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/auth" className="navbar-login-link">Login / Sign Up</Link>
        )}
      </div>
    </nav>
  );
}
