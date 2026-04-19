import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- context file exports both provider and context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  const login = (name: string) => setUsername(name);
  const logout = () => setUsername(null);

  return (
    <AuthContext.Provider value={{ isLoggedIn: username !== null, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
