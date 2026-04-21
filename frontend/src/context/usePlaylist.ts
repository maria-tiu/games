import { useContext } from 'react';
import { PlaylistContext } from './PlaylistContext';

export function usePlaylist() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used within a PlaylistProvider component');
  return ctx;
}

