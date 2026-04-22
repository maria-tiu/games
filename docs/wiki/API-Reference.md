# API Reference

All endpoints are prefixed with `/api/`. The server runs on `http://localhost:8000` in development.

---

## Authentication

Protected endpoints require a **Token** in the `Authorization` header:

```
Authorization: Token <token>
```

---

## Scores

### `GET /api/scores/`

Returns the top-10 high scores across all games, or filtered by `game_id`.

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `game_id` | string (optional) | Filter scores for a specific game (e.g. `tetris`, `pacman`) |

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "game_id": "tetris",
    "player_name": "Alice",
    "score": 15000,
    "lines_cleared": 40,
    "level": 5,
    "created_at": "2026-04-20T12:34:56Z"
  }
]
```

---

### `POST /api/scores/`

Submit a new score. Available to both anonymous and authenticated users.
When authenticated, the score is linked to the user account.

**Request body**

```json
{
  "game_id": "tetris",
  "player_name": "Alice",
  "score": 1500,
  "lines_cleared": 15,
  "level": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `game_id` | string | Yes | Must match one of the game identifiers |
| `player_name` | string | Yes | Max 50 characters |
| `score` | integer | Yes | |
| `lines_cleared` | integer | No | Defaults to `0` |
| `level` | integer | No | Defaults to `1` |

**Response `201 Created`** — same shape as the GET response item.

---

## Authentication Endpoints

### `POST /api/auth/register/`

Create a new user account.

**Request body**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecurePass1!",
  "password2": "SecurePass1!"
}
```

**Response `201 Created`**

```json
{
  "token": "<auth-token>",
  "username": "alice"
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure (duplicate username/email, passwords don't match, weak password) |

---

### `POST /api/auth/login/`

Authenticate an existing user and return a token.

**Request body**

```json
{
  "username": "alice",
  "password": "SecurePass1!"
}
```

**Response `200 OK`**

```json
{
  "token": "<auth-token>",
  "username": "alice"
}
```

**Errors**

| Status | Message |
|--------|---------|
| `401` | `"Username not found."` |
| `401` | `"Incorrect password."` |

---

### `POST /api/auth/logout/`

🔒 *Requires authentication.*

Invalidates the current token.

**Response `204 No Content`**

---

### `POST /api/auth/password-reset/`

Request a password-reset token for the given email address.

**Request body**

```json
{ "email": "alice@example.com" }
```

**Response `200 OK`**

```json
{
  "detail": "Password reset link sent.",
  "reset_token": "<uid>.<token>"
}
```

> **Note**: `reset_token` is only included in the response body when `DEBUG = True`.
> In production it would be delivered by email only.

---

### `POST /api/auth/password-reset-confirm/`

Set a new password using the reset token.

**Request body**

```json
{
  "reset_token": "<uid>.<token>",
  "new_password": "NewSecurePass1!",
  "new_password2": "NewSecurePass1!"
}
```

**Response `200 OK`**

```json
{ "detail": "Password has been reset." }
```

**Errors**

| Status | Message |
|--------|---------|
| `400` | `"Invalid reset token."` |
| `400` | `"Invalid or expired reset token."` |
| `400` | Passwords don't match / weak password |

---

## User Profile

### `GET /api/auth/profile/`

🔒 *Requires authentication.*

Returns the current user's profile.

**Response `200 OK`**

```json
{
  "username": "alice",
  "email": "alice@example.com"
}
```

---

### `PATCH /api/auth/profile/`

🔒 *Requires authentication.*

Update the current user's username and/or email. Send only the fields you want to change.

**Request body (example)**

```json
{ "username": "alice2" }
```

**Response `200 OK`** — updated profile object.

---

## User Game Playlist

### `GET /api/auth/games/`

🔒 *Requires authentication.*

Returns all games in the current user's playlist.

**Response `200 OK`**

```json
[
  {
    "id": 3,
    "game_id": "tetris",
    "game_name": "Tetris",
    "added_at": "2026-04-21T09:00:00Z"
  }
]
```

---

### `POST /api/auth/games/`

🔒 *Requires authentication.*

Add a game to the user's playlist. Idempotent — adding a game that is already in the
playlist returns `200` instead of `201`.

**Request body**

```json
{
  "game_id": "pacman",
  "game_name": "Pac-Man"
}
```

**Response `201 Created` / `200 OK`** — the UserGame object.

---

### `DELETE /api/auth/games/<id>/`

🔒 *Requires authentication.*

Remove a game from the playlist by its playlist entry `id`.

**Response `204 No Content`**

**Errors**

| Status | Condition |
|--------|-----------|
| `404` | Entry not found or belongs to another user |

---

## User Scores

### `GET /api/auth/my-scores/`

🔒 *Requires authentication.*

Returns the most-recent score per game for the authenticated user (matched by user FK
or by `player_name` for legacy anonymous scores).

**Response `200 OK`** — array of Score objects (one per game played).

---

## Game ID Reference

| `game_id` value | Game name |
|----------------|-----------|
| `tetris` | Tetris |
| `sliding-puzzle` | Sliding Puzzle |
| `2048` | 2048 |
| `breakout` | Breakout |
| `mario` | Mario |
| `pacman` | Pac-Man |
