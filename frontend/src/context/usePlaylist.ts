import { useContext } from 'react';
import { PlaylistContext } from './PlaylistContext';
import type { PlaylistContextType } from './PlaylistContext';

export function usePlaylist(): PlaylistContextType {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used within a PlaylistProvider');
  return ctx;
}
