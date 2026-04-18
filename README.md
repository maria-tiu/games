# 🎮 Games

A collection of classic games built with modern web technologies.

## Game #1 — Tetris

![Tetris Screenshot](https://github.com/user-attachments/assets/b3b226d2-4df2-4ae5-aa33-06a5aa6344e9)

A fully playable Tetris game with:

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Django REST Framework

### Features

- All 7 tetrominoes (I, O, T, S, Z, J, L) with authentic colors
- Ghost piece showing where the active piece will land
- Next-piece preview
- Score, level, and lines-cleared tracking
- Progressive difficulty — speed increases every 10 lines
- Pause / resume
- High-score leaderboard (top 10) persisted via the REST API
- Keyboard controls:
  | Key | Action |
  |-----|--------|
  | ← → | Move left / right |
  | ↑ | Rotate |
  | ↓ | Soft drop |
  | Space | Hard drop |
  | P | Pause / Resume |

---

## Project Structure

```
games/
├── frontend/   # React + TypeScript (Vite)
└── backend/    # Django REST Framework
```

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                         # runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser and enjoy!

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/scores/` | List top 10 high scores |
| POST | `/api/scores/` | Submit a new score |

### Score payload (POST)

```json
{
  "player_name": "Alice",
  "score": 1500,
  "lines_cleared": 15,
  "level": 2
}
```
