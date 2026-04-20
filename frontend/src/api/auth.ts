const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/auth';

export interface AuthResponse {
  token: string;
  username: string;
}

export interface ApiError {
  [key: string]: string | string[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // Response body is not JSON (e.g. a Django 500 HTML page)
    throw { detail: `Server error (HTTP ${res.status})` } as ApiError;
  }
  if (!res.ok) {
    throw data as ApiError;
  }
  return data as T;
}

export async function register(
  username: string,
  email: string,
  password: string,
  password2: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, password2 }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${BASE_URL}/logout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });
}

export async function requestPasswordReset(email: string): Promise<{ detail: string; reset_token?: string }> {
  const res = await fetch(`${BASE_URL}/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function confirmPasswordReset(
  reset_token: string,
  new_password: string,
  new_password2: string,
): Promise<{ detail: string }> {
  const res = await fetch(`${BASE_URL}/password-reset-confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset_token, new_password, new_password2 }),
  });
  return handleResponse(res);
}
