import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as apiLogin,
  register,
  requestPasswordReset,
  confirmPasswordReset,
} from '../api/auth';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

type Tab = 'login' | 'signup' | 'forgot' | 'reset';

const NETWORK_ERROR_MSG = 'Service unavailable. Please try again later.';

// A05/A10 – Input length limits (mirrors backend constraints to prevent unnecessary round-trips)
const MAX_USERNAME_LEN = 150;
const MAX_EMAIL_LEN = 254;
const MAX_PASSWORD_LEN = 128;
const MAX_RESET_TOKEN_LEN = 200;

// A07 – Authentication Failures: client-side password strength feedback
type PasswordStrength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score >= 3) return 'strong';
  if (score >= 2) return 'fair';
  return 'weak';
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
};

function formatErrors(err: unknown): string {
  if (err instanceof Error) {
    return NETWORK_ERROR_MSG;
  }
  if (err && typeof err === 'object') {
    return Object.values(err as Record<string, unknown>)
      .flat()
      .filter((v): v is string => typeof v === 'string')
      .join(' · ');
  }
  return '';
}

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      const data = await apiLogin(loginUsername.trim(), loginPassword);
      login(data.token, data.username);
      navigate('/');
    } catch (err) {
      setError(formatErrors(err) || 'Login failed.');
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
      login(data.token, data.username);
      navigate('/');
    } catch (err) {
      setError(formatErrors(err) || 'Registration failed.');
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
      setError(formatErrors(err) || 'Request failed.');
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
      setError(formatErrors(err) || 'Password reset failed.');
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
              {/* A05/A10 – maxLength mirrors the backend limit to prevent oversized payloads */}
              <input
                className="auth-input"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                maxLength={MAX_USERNAME_LEN}
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
                maxLength={MAX_PASSWORD_LEN}
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
                maxLength={MAX_USERNAME_LEN}
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
                maxLength={MAX_EMAIL_LEN}
                required
              />
            </label>
            <label className="auth-label">
              <span>Password</span>
              {/* A07 – Authentication Failures: real-time password strength feedback */}
              <input
                className="auth-input"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LEN}
                required
              />
              {signupPassword.length > 0 && (() => {
                const strength = getPasswordStrength(signupPassword);
                return (
                  <span className={`auth-password-strength auth-password-strength--${strength}`}>
                    {STRENGTH_LABEL[strength]}
                  </span>
                );
              })()}
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
                maxLength={MAX_PASSWORD_LEN}
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
                maxLength={MAX_EMAIL_LEN}
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
              {/* autocomplete="off" prevents browsers from suggesting saved tokens in this field */}
              <input
                className="auth-input"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste your reset token"
                autoComplete="off"
                maxLength={MAX_RESET_TOKEN_LEN}
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
                maxLength={MAX_PASSWORD_LEN}
                required
              />
              {newPassword.length > 0 && (() => {
                const strength = getPasswordStrength(newPassword);
                return (
                  <span className={`auth-password-strength auth-password-strength--${strength}`}>
                    {STRENGTH_LABEL[strength]}
                  </span>
                );
              })()}
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
                maxLength={MAX_PASSWORD_LEN}
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
