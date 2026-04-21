const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ? (import.meta.env.VITE_API_BASE_URL as string).replace(/\/auth$/, '')
  : 'http://localhost:8000/api';

export interface UserGame {
  id: number;
  game_id: string;
  game_name: string;
  added_at: string;
}

export interface UserProfile {
  username: string;
  email: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw { detail: `Server error (HTTP ${res.status})` };
  }
  if (!res.ok) throw data;
  return data as T;
}

export async function fetchUserGames(token: string): Promise<UserGame[]> {
  const res = await fetch(`${API_BASE}/auth/games/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return handleResponse<UserGame[]>(res);
}

export async function addUserGame(
  token: string,
  game_id: string,
  game_name: string,
): Promise<UserGame> {
  const res = await fetch(`${API_BASE}/auth/games/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ game_id, game_name }),
  });
  return handleResponse<UserGame>(res);
}

export async function removeUserGame(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/games/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status !== 204) {
    await handleResponse<never>(res);
  }
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/profile/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return handleResponse<UserProfile>(res);
}

export async function updateUserProfile(
  token: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/profile/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<UserProfile>(res);
}
