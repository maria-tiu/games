import { StrictMode, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AuthPage from './pages/AuthPage.tsx'
import { logout } from './api/auth.ts'

function Root() {
  const stored = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('authUsername');

  const [token, setToken] = useState<string | null>(stored);
  const [username, setUsername] = useState<string | null>(storedUser);

  const handleAuth = useCallback((tok: string, user: string) => {
    localStorage.setItem('authToken', tok);
    localStorage.setItem('authUsername', user);
    setToken(tok);
    setUsername(user);
  }, []);

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await logout(token);
      } catch {
        // ignore errors on logout
      }
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    setToken(null);
    setUsername(null);
  }, [token]);

  if (!token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <App username={username ?? ''} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

