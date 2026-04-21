import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { fetchUserGames, addUserGame, removeUserGame } from '../api/profile';
import type { UserGame } from '../api/profile';

export interface PlaylistContextType {
  playlist: UserGame[];
  loading: boolean;
  addGame: (gameId: string, gameName: string) => Promise<void>;
  removeGame: (id: number) => Promise<void>;
  isInPlaylist: (gameId: string) => boolean;
  getPlaylistEntry: (gameId: string) => UserGame | undefined;
}

// eslint-disable-next-line react-refresh/only-export-components -- context file exports both provider and context
export const PlaylistContext = createContext<PlaylistContextType | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  // Store playlist keyed by the token so stale data from a previous session is
  // never shown while the new fetch is in-flight.
  const [data, setData] = useState<{ token: string; playlist: UserGame[] } | null>(null);
  // Initialize loading to true when there is a token so we show a loading state
  // from the very first render without needing a synchronous setState in useEffect.
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    fetchUserGames(token)
      .then((games) => {
        if (mounted) {
          setData({ token, playlist: games });
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  // Playlist is empty when not logged in or while a new token's fetch is in-flight.
  const playlist = data?.token === token ? data.playlist : [];

  const addGame = async (gameId: string, gameName: string) => {
    if (!token) return;
    const game = await addUserGame(token, gameId, gameName);
    setData((prev) => {
      if (!prev || prev.token !== token) return { token, playlist: [game] };
      if (prev.playlist.find((g) => g.id === game.id)) return prev;
      return { token, playlist: [...prev.playlist, game] };
    });
  };

  const removeGame = async (id: number) => {
    if (!token) return;
    await removeUserGame(token, id);
    setData((prev) => {
      if (!prev) return null;
      return { ...prev, playlist: prev.playlist.filter((g) => g.id !== id) };
    });
  };

  const isInPlaylist = (gameId: string) => playlist.some((g) => g.game_id === gameId);

  const getPlaylistEntry = (gameId: string) => playlist.find((g) => g.game_id === gameId);

  return (
    <PlaylistContext.Provider value={{ playlist, loading, addGame, removeGame, isInPlaylist, getPlaylistEntry }}>
      {children}
    </PlaylistContext.Provider>
  );
}
