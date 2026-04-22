# Architecture

This page describes the technical architecture of the **Games** platform.

---

## High-Level Overview

```
Browser
  └─ React SPA (Vite)          http://localhost:5173
       └─ REST API calls ─────► Django REST Framework   http://localhost:8000
                                   └─ SQLite database
```

The application follows a classic **client–server** architecture. The React frontend is a
single-page application (SPA) that communicates with the Django backend through a REST API.

---

## Project Layout

```
games/
├── frontend/               # React + TypeScript (Vite)
│   ├── src/
│   │   ├── api/            # Fetch helpers for every endpoint
│   │   ├── components/     # Shared UI components (Board, Navbar, Footer, …)
│   │   ├── context/        # React Contexts (Auth, Playlist, Theme)
│   │   ├── data/           # Static data (game instructions)
│   │   ├── hooks/          # Custom React hooks (game logic)
│   │   ├── pages/          # Route-level page components
│   │   ├── types/          # Shared TypeScript types
│   │   └── utils/          # Pure helper functions (game algorithms)
│   ├── index.html
│   └── vite.config.ts
│
└── backend/                # Django REST Framework
    ├── backend/            # Django project settings & root URL conf
    └── tetris/             # The single Django app
        ├── models.py       # Score, UserGame
        ├── serializers.py  # DRF serializers
        ├── views.py        # APIView / GenericAPIView classes
        ├── urls.py         # URL patterns for /api/
        ├── admin.py
        └── migrations/
```

---

## Frontend Architecture

### Framework & Build Tool

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI library |
| TypeScript | 5 | Static typing |
| Vite | 5 | Dev server & bundler |
| React Router | v6 | Client-side routing |

### Routing

All routes are declared in `src/main.tsx`. The root layout (`/`) wraps the Dashboard,
Auth, and Profile pages with a shared `<Layout>` component (Navbar + Footer).
Game pages are rendered outside the layout so they take the full viewport.

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `Dashboard` | Board of Games (inside Layout) |
| `/auth` | `AuthPage` | Login / Register (inside Layout) |
| `/profile` | `ProfilePage` | User playlist & settings (inside Layout) |
| `/tetris` | `TetrisGame` | Full-screen game |
| `/sliding-puzzle` | `SlidingPuzzle` | Full-screen game |
| `/2048` | `Game2048` | Full-screen game |
| `/breakout` | `BreakoutGame` | Full-screen game (Canvas) |
| `/mario` | `MarioGame` | Full-screen game (Canvas) |
| `/pacman` | `PacmanGame` | Full-screen game (Canvas) |
| `*` | Redirect → `/` | Catch-all |

### State Management

Global state is handled through three React Contexts:

| Context | File | Responsibility |
|---------|------|----------------|
| `AuthContext` | `context/AuthContext.tsx` | Token, username, login/logout |
| `PlaylistContext` | `context/PlaylistContext.tsx` | User's game playlist |
| `ThemeContext` | `context/ThemeContext.tsx` | Dark / light theme preference |

Session state (auth token, username, theme) is persisted in **localStorage** so it
survives page refreshes.

### Game Logic

Game-specific logic lives in custom hooks or directly in page components:

| Game | Logic Location |
|------|---------------|
| Tetris | `hooks/useTetrisGame.ts` + `utils/gameHelpers.ts` + `utils/tetrominoes.ts` |
| 2048 | `hooks/use2048Game.ts` |
| Sliding Puzzle | State inside `pages/SlidingPuzzle.tsx` |
| Breakout | Canvas loop inside `pages/BreakoutGame.tsx` |
| Mario | Canvas loop inside `pages/MarioGame.tsx` |
| Pac-Man | Canvas loop inside `pages/PacmanGame.tsx` |

Canvas-based games (Breakout, Mario, Pac-Man) use the HTML5 Canvas API via a `useRef`
to the `<canvas>` element and a `requestAnimationFrame` loop managed by `useRef` /
`useEffect`.

### Audio

Tetris uses a dedicated `hooks/useTetrisSound.ts` hook built on the **Web Audio API**.
All other audio effects are also synthesised through the Web Audio API — no audio
files are loaded.

### Theming

CSS custom properties defined in `src/theme.css` drive the entire colour scheme.
The `ThemeContext` applies a `data-theme="dark"` or `data-theme="light"` attribute to
`<html>`, which CSS selectors use to switch variable values.

---

## Backend Architecture

### Framework

| Tool | Version | Purpose |
|------|---------|---------|
| Django | 6.0 | Web framework |
| Django REST Framework | 3.17 | REST API toolkit |
| django-cors-headers | 4.9 | CORS for local dev (allows `localhost:5173`) |

### Django App: `tetris`

Although the Django app is named `tetris` (from the initial game implementation), it
now handles all games and user accounts for the whole platform.

### Data Models

#### `Score`

Stores a single game result.

| Field | Type | Description |
|-------|------|-------------|
| `user` | FK → `User` (nullable) | Linked user, or `null` for anonymous scores |
| `game_id` | CharField(50) | Identifier matching the frontend route key (e.g. `"tetris"`, `"pacman"`) |
| `player_name` | CharField(50) | Display name used in the leaderboard |
| `score` | IntegerField | Numeric score |
| `lines_cleared` | IntegerField | Lines cleared (Tetris-specific; 0 for other games) |
| `level` | IntegerField | Level reached (1 for games without levels) |
| `created_at` | DateTimeField | Auto-set on creation |

Default ordering: `-score` (highest score first).

#### `UserGame`

Represents a game added to a user's playlist.

| Field | Type | Description |
|-------|------|-------------|
| `user` | FK → `User` | Owner |
| `game_id` | CharField(50) | Game identifier |
| `game_name` | CharField(100) | Human-readable name |
| `added_at` | DateTimeField | Auto-set on creation |

Unique constraint: `(user, game_id)` — a game can only be in a playlist once.

### Authentication

Token-based authentication using **DRF's built-in `TokenAuthentication`**.
The token is returned on register/login and must be sent in the `Authorization` header
as `Token <token>` for protected endpoints.

Password reset uses Django's `default_token_generator` (HMAC-based, time-limited).
The `uid.token` string is returned in the API response (development mode only — in
production it would be emailed).

### CORS

`CORS_ALLOWED_ORIGINS` in `settings.py` allows requests from `http://localhost:5173`
and `http://127.0.0.1:5173`. Update this list when deploying to production.
