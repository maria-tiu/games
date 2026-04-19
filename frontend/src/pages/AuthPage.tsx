import React, { useState } from 'react';
import {
  login,
  register,
  requestPasswordReset,
  confirmPasswordReset,
  type ApiError,
} from '../api/auth';
import './AuthPage.css';

type Tab = 'login' | 'signup' | 'forgot' | 'reset';

interface AuthPageProps {
  onAuth: (token: string, username: string) => void;
}

function formatErrors(err: ApiError): string {
  return Object.values(err)
    .flat()
    .join(' ');
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPassword2, setSignupPassword2] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await login(loginUsername.trim(), loginPassword);
      onAuth(data.token, data.username);
    } catch (err) {
      setError(formatErrors(err as ApiError) || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await register(
        signupUsername.trim(),
        signupEmail.trim(),
        signupPassword,
        signupPassword2,
      );
      onAuth(data.token, data.username);
    } catch (err) {
      setError(formatErrors(err as ApiError) || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await requestPasswordReset(forgotEmail.trim());
      setSuccessMsg(data.detail);
      if (data.reset_token) {
        setResetToken(data.reset_token);
        setTab('reset');
      }
    } catch (err) {
      setError(formatErrors(err as ApiError) || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await confirmPasswordReset(resetToken, newPassword, newPassword2);
      setSuccessMsg(data.detail + ' You can now log in.');
      setTab('login');
      setResetToken('');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setError(formatErrors(err as ApiError) || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    clearMessages();
    setTab(t);
  };

  return (
    <div className="auth-page">
      {/* Scanline overlay */}
      <div className="auth-scanlines" aria-hidden="true" />

      <div className="auth-container">
        <div className="auth-logo">
          <span className="auth-logo-text">GAME</span>
          <span className="auth-logo-accent">ZONE</span>
        </div>
        <p className="auth-tagline">INSERT COIN TO CONTINUE</p>

        {tab !== 'forgot' && tab !== 'reset' && (
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`}
              onClick={() => switchTab('login')}
              type="button"
            >
              Login
            </button>
            <button
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => switchTab('signup')}
              type="button"
            >
              Sign Up
            </button>
          </div>
        )}

        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {successMsg && <div className="auth-alert auth-alert--success">{successMsg}</div>}

        {/* LOGIN */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <label className="auth-label">
              <span>Username</span>
              <input
                className="auth-input"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </label>
            <label className="auth-label">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : '▶ PLAY'}
            </button>
            <button
              className="auth-btn auth-btn--ghost"
              type="button"
              onClick={() => switchTab('forgot')}
            >
              Forgot Password?
            </button>
          </form>
        )}

        {/* SIGN UP */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            <label className="auth-label">
              <span>Username</span>
              <input
                className="auth-input"
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </label>
            <label className="auth-label">
              <span>Email</span>
              <input
                className="auth-input"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="auth-label">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="auth-label">
              <span>Confirm Password</span>
              <input
                className="auth-input"
                type="password"
                value={signupPassword2}
                onChange={(e) => setSignupPassword2(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
            </label>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : '★ CREATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form className="auth-form" onSubmit={handleForgot} noValidate>
            <div className="auth-back-row">
              <button
                className="auth-btn-back"
                type="button"
                onClick={() => switchTab('login')}
              >
                ← Back to Login
              </button>
            </div>
            <p className="auth-form-desc">
              Enter your email address and we'll send you a reset link.
            </p>
            <label className="auth-label">
              <span>Email</span>
              <input
                className="auth-input"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </label>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={loading}>
              {loading ? 'Sending…' : '✉ SEND RESET LINK'}
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {tab === 'reset' && (
          <form className="auth-form" onSubmit={handleReset} noValidate>
            <div className="auth-back-row">
              <button
                className="auth-btn-back"
                type="button"
                onClick={() => switchTab('forgot')}
              >
                ← Back
              </button>
            </div>
            <p className="auth-form-desc">Enter your reset token and choose a new password.</p>
            <label className="auth-label">
              <span>Reset Token</span>
              <input
                className="auth-input"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste your reset token"
                required
              />
            </label>
            <label className="auth-label">
              <span>New Password</span>
              <input
                className="auth-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="auth-label">
              <span>Confirm New Password</span>
              <input
                className="auth-input"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                required
              />
            </label>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={loading}>
              {loading ? 'Resetting…' : '🔑 RESET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
