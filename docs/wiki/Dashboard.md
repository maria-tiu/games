# Dashboard (Board of Games)

The Dashboard is the main landing page of the **Games** platform, accessible at the
root path `/`.

---

## Purpose

The Dashboard gives users an at-a-glance view of all available games and lets them:

- See the **best score** (and the player who achieved it) for each game
- **Add** a game to their personal playlist (requires login)
- **Play** a game immediately (requires login)
- Read in-app **instructions** for any game via an info button

---

## UI Layout

The page renders a table with one row per game:

| Column | Content |
|--------|---------|
| **Game** | Game name + ℹ️ instructions button |
| **Number of players** | Always `1` for single-player games |
| **Playlist** | "Add" button — becomes "Added ✓" once added |
| **Play now** | "Play" button → navigates to the game route |
| **Best score** | Highest score on record + player name |

A login hint (`"Please login or sign up to start to play."`) is displayed below the
table when the user is not authenticated.

---

## Game Catalogue

The list of games is defined in `pages/Dashboard.tsx`:

```typescript
const GAMES = [
  { id: 'tetris',         name: 'Tetris',         players: 1, route: '/tetris'         },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle',  players: 1, route: '/sliding-puzzle' },
  { id: '2048',           name: '2048',            players: 1, route: '/2048'           },
  { id: 'breakout',       name: 'Breakout',        players: 1, route: '/breakout'       },
  { id: 'mario',          name: 'Mario',           players: 1, route: '/mario'          },
  { id: 'pacman',         name: 'Pac-Man',         players: 1, route: '/pacman'         },
];
```

---

## Best Scores

On mount, the Dashboard fires a `GET /api/scores/?game_id=<id>` request for every game
in parallel, then displays the top score (index `[0]`) and the associated player name
in the **Best score** column. If no score exists yet, a `—` placeholder is shown.

---

## Playlist Integration

The **Playlist** column uses `PlaylistContext` (`context/PlaylistContext.tsx`):

- `isInPlaylist(gameId)` — returns `true` if the game is already in the user's playlist
- `addGame(gameId, gameName)` — calls `POST /api/auth/games/` and updates local state

Once a game is added the button changes to "Added ✓" and is permanently disabled for
that session.

---

## Game Instructions Modal

Each game row includes a small ℹ️ button (`components/GameInfoButton.tsx`) that opens
a modal (`components/GameInstructionsModal.tsx`).

Instructions are stored as static data in `data/gameInstructions.ts` (no API call).
Each entry contains:

- `title` — modal heading
- `description` — one-paragraph overview of the game
- `controls` — array of `{ key, action }` pairs shown in a table
- `tips` — optional list of strategy tips

---

## Theme Toggle

The Navbar (rendered by the parent `<Layout>`) exposes a dark/light theme toggle that
persists to `localStorage` via `ThemeContext`. The Dashboard itself is fully themed
through CSS custom properties.

---

## Access Control

| Action | Guest | Logged-in user |
|--------|-------|----------------|
| View game list | ✅ | ✅ |
| View best scores | ✅ | ✅ |
| Add to playlist | ❌ (button disabled) | ✅ |
| Play a game | ❌ (button disabled) | ✅ |
