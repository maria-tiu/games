# User Profile

The **Profile** page (`/profile`) is available to authenticated users and serves as a
personal hub for managing account details and the game playlist.

---

## Access

- Accessible only when logged in.
- The username in the Navbar is a clickable link that navigates to `/profile`.
- Unauthenticated visitors are redirected to the Dashboard.

---

## Features

### 1 — Personal Information

Displays the current **username** and **email address** with inline edit controls.
The user can:

- Update their **username** (must be unique across all accounts).
- Update their **email address** (must be unique).

Changes call `PATCH /api/auth/profile/` and update `AuthContext` / `localStorage` on success.

### 2 — My Scores

A summary of the user's most recent score for each game they have played,
fetched from `GET /api/auth/my-scores/`. The section is hidden if no scores exist yet.

### 3 — My Playlist

A table of games the user has added to their playlist, mirroring the Dashboard table
but with a **Remove** button instead of an **Add** button.

Removing a game calls `DELETE /api/auth/games/<id>/` and refreshes the list.

Each game row also has a **Play** button that navigates directly to the game.

### 4 — Theme Toggle

A dark / light mode toggle (same as in the Navbar) is also available on the Profile page
so users can change the theme from a consistent place.

---

## Component: `ProfilePage` (`pages/ProfilePage.tsx`)

The component:

1. On mount, loads the user's profile (`GET /api/auth/profile/`), playlist
   (`GET /api/auth/games/`), and personal scores (`GET /api/auth/my-scores/`).
2. Renders the three sections described above.
3. Uses `PlaylistContext` to keep the playlist state in sync with the Dashboard —
   removing a game from the profile also removes it from the context so the Dashboard
   "Add" button becomes active again.

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/profile/` | GET | Load username & email |
| `/api/auth/profile/` | PATCH | Save username / email changes |
| `/api/auth/games/` | GET | Load playlist |
| `/api/auth/games/<id>/` | DELETE | Remove game from playlist |
| `/api/auth/my-scores/` | GET | Load personal scores |

See the [API Reference](API-Reference.md) for full details.
