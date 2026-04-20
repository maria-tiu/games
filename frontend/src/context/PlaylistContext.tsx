import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface GameEntry {
  id: string;
  name: string;
  players: number;
  route: string;
}

// eslint-disable-next-line react-refresh/only-export-components -- shared game list used by Dashboard and ProfilePage
export const ALL_GAMES: GameEntry[] = [
  { id: 'tetris', name: 'Tetris', players: 1, route: '/tetris' },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle', players: 1, route: '/sliding-puzzle' },
];

export interface PlaylistContextType {
  playlist: string[];
  addToPlaylist: (gameId: string) => void;
  removeFromPlaylist: (gameId: string) => void;
  isInPlaylist: (gameId: string) => boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- context file exports both provider and context
export const PlaylistContext = createContext<PlaylistContextType | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gamePlaylist');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const addToPlaylist = useCallback((gameId: string) => {
    setPlaylist((prev) => {
      if (prev.includes(gameId)) return prev;
      const next = [...prev, gameId];
      localStorage.setItem('gamePlaylist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromPlaylist = useCallback((gameId: string) => {
    setPlaylist((prev) => {
      const next = prev.filter((id) => id !== gameId);
      localStorage.setItem('gamePlaylist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isInPlaylist = useCallback((gameId: string) => playlist.includes(gameId), [playlist]);

  return (
    <PlaylistContext.Provider value={{ playlist, addToPlaylist, removeFromPlaylist, isInPlaylist }}>
      {children}
    </PlaylistContext.Provider>
  );
}
