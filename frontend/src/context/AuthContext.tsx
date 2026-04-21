import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { logout as apiLogout } from '../api/auth';

export interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  token: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- context file exports both provider and context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('authUsername'));

  const login = (tok: string, user: string) => {
    localStorage.setItem('authToken', tok);
    localStorage.setItem('authUsername', user);
    setToken(tok);
    setUsername(user);
  };

  const logout = () => {
    if (token) {
      apiLogout(token).catch(() => {});
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    setToken(null);
    setUsername(null);
  };

  const updateUsername = (newUsername: string) => {
    localStorage.setItem('authUsername', newUsername);
    setUsername(newUsername);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: token !== null, username, token, login, logout, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}
