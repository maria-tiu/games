import type { ScoreEntry, ScoreSubmission } from '../types';

const API_BASE = 'http://localhost:8000/api';

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

export async function submitScore(data: ScoreSubmission): Promise<ScoreEntry> {
  const response = await fetch(`${API_BASE}/scores/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to submit score');
  }
  return response.json();
}
