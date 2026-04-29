# 🎮 Games

A collection of classic browser games built with React + TypeScript (frontend) and Django REST Framework (backend).

## Games

| # | Game | Route |
|---|------|-------|
| 1 | Tetris | `/tetris` |
| 2 | Sliding Puzzle | `/sliding-puzzle` |
| 3 | 2048 | `/2048` |
| 4 | Breakout | `/breakout` |
| 5 | Mario | `/mario` |
| 6 | Pac-Man | `/pacman` |

Users can register, log in, build a personal playlist, and submit scores to a per-game leaderboard.

## Project Structure

```
games/
├── frontend/               # React 18 + TypeScript (Vite)
│   └── src/
│       ├── api/            # Fetch helpers for every endpoint
│       ├── components/     # Shared UI components
│       ├── context/        # React Contexts (Auth, Playlist, Theme)
│       ├── hooks/          # Custom hooks — game logic lives here
│       ├── pages/          # Route-level page components
│       ├── types/          # Shared TypeScript types
│       └── utils/          # Pure helper functions
└── backend/                # Django 6 + Django REST Framework
    ├── backend/            # Project settings & root URL conf
    └── <app>/              # Game models, serializers, views, URLs
```

## Getting Started

**Backend**

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver   # http://localhost:8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Further Reading

Full documentation lives in [`docs/wiki/`](docs/wiki/Home.md).
