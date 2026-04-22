import type { ScoreEntry, ScoreSubmission } from '../types';

const _envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const API_BASE = _envBase
  ? _envBase.replace(/\/auth$/, '')
  : 'http://localhost:8000/api';

export async function fetchHighScores(gameId?: string): Promise<ScoreEntry[]> {
  const url = gameId
    ? `${API_BASE}/scores/?game_id=${encodeURIComponent(gameId)}`
    : `${API_BASE}/scores/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }
  return response.json();
}

export async function submitScore(data: ScoreSubmission, token?: string): Promise<ScoreEntry> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  const response = await fetch(`${API_BASE}/scores/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to submit score');
  }
  return response.json();
}

export async function fetchMyScores(token: string): Promise<ScoreEntry[]> {
  const response = await fetch(`${API_BASE}/auth/my-scores/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user scores');
  }
  return response.json();
}

export async function fetchMyScoreHistory(token: string, gameId: string): Promise<ScoreEntry[]> {
  const response = await fetch(`${API_BASE}/auth/my-scores/${encodeURIComponent(gameId)}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch score history');
  }
  return response.json();
}
