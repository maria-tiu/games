import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setMessage(null);
    setError(null);
  };

  const switchMode = (next: AuthMode) => {
    reset();
    setMode(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'login') {
      if (!username || !password) {
        setError('Please fill in all fields.');
        return;
      }
      login(username);
      navigate('/');
    } else if (mode === 'signup') {
      if (!username || !email || !password || !confirm) {
        setError('Please fill in all fields.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      login(username);
      navigate('/');
    } else {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setMessage('Password reset link sent! Check your email.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
          <button
            className={`auth-tab ${mode === 'reset' ? 'active' : ''}`}
            onClick={() => switchMode('reset')}
          >
            Reset Password
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'login' && (
            <>
              <h2 className="auth-title">Login</h2>
              <label className="auth-label">
                Username
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  autoComplete="username"
                />
              </label>
              <label className="auth-label">
                Password
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </label>
              <button className="auth-submit-btn" type="submit">Login</button>
              <p className="auth-switch">
                No account?{' '}
                <button type="button" className="auth-link-btn" onClick={() => switchMode('signup')}>
                  Sign Up
                </button>
              </p>
              <p className="auth-switch">
                Forgot password?{' '}
                <button type="button" className="auth-link-btn" onClick={() => switchMode('reset')}>
                  Reset Password
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="auth-title">Sign Up</h2>
              <label className="auth-label">
                Username
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                />
              </label>
              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </label>
              <label className="auth-label">
                Password
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </label>
              <label className="auth-label">
                Confirm Password
                <input
                  className="auth-input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </label>
              <button className="auth-submit-btn" type="submit">Create Account</button>
              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" className="auth-link-btn" onClick={() => switchMode('login')}>
                  Login
                </button>
              </p>
            </>
          )}

          {mode === 'reset' && (
            <>
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-description">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </label>
              <button className="auth-submit-btn" type="submit">Send Reset Link</button>
              <p className="auth-switch">
                Remember your password?{' '}
                <button type="button" className="auth-link-btn" onClick={() => switchMode('login')}>
                  Login
                </button>
              </p>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
