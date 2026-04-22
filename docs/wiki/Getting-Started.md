# Getting Started

This guide walks you through running the **Games** project locally from a fresh clone.

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Python | 3.11 | 3.12+ recommended |
| pip | latest | bundled with Python |
| Node.js | 18 LTS | 20 LTS recommended |
| npm | 9 | bundled with Node.js |

---

## 1 — Clone the Repository

```bash
git clone https://github.com/maria-tiu/games.git
cd games
```

---

## 2 — Backend Setup (Django)

```bash
cd backend

# (Recommended) create an isolated virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations (creates SQLite db at backend/db.sqlite3)
python manage.py migrate

# (Optional) create a superuser to access the admin panel
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend is now available at **http://localhost:8000**.

> **Admin panel**: http://localhost:8000/admin/  
> All API endpoints are under: http://localhost:8000/api/

---

## 3 — Frontend Setup (React / Vite)

Open a **new terminal tab**, then:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend is now available at **http://localhost:5173**.

---

## 4 — Play!

Open **http://localhost:5173** in your browser.

1. You can browse the **Dashboard** to see all available games without an account.
2. Click **Login / Sign Up** (or go to `/auth`) to create an account.
3. Once logged in, click **Play** next to any game, or **Add** it to your playlist.

---

## Environment Notes

### Backend — `DEBUG` mode

The Django project ships with `DEBUG = True` and an insecure `SECRET_KEY`. This is
fine for local development but **must not** be used in production.

Key settings (`backend/backend/settings.py`):

| Setting | Dev value | Production recommendation |
|---------|-----------|--------------------------|
| `DEBUG` | `True` | `False` |
| `SECRET_KEY` | Hardcoded (insecure) | Load from environment variable |
| `ALLOWED_HOSTS` | `[]` | Your domain(s) |
| `CORS_ALLOWED_ORIGINS` | `localhost:5173` | Your frontend domain |
| Database | SQLite | PostgreSQL / MySQL |

### Frontend — API Base URL

The frontend API helpers (`src/api/*.ts`) call `http://localhost:8000` by default.
Update the base URL constant there when deploying to a remote server.

---

## Running Tests

### Backend

```bash
cd backend
python manage.py test
```

### Frontend (if test runner is configured)

```bash
cd frontend
npm test
```

---

## Available npm Scripts (Frontend)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Production build → `dist/` |
| `preview` | `npm run preview` | Serve the production build locally |
| `lint` | `npm run lint` | Run ESLint |
