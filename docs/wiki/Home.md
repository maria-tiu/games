# 🎮 Games — Project Wiki

Welcome to the **Games** project wiki! This is a collection of classic browser games built with a modern full-stack web application.

---

## Table of Contents

| Page | Description |
|------|-------------|
| [Architecture](Architecture.md) | Full-stack technical architecture overview |
| [Getting Started](Getting-Started.md) | How to run the project locally |
| [API Reference](API-Reference.md) | REST API endpoint documentation |
| [Authentication](Authentication.md) | Sign-up, login & password reset |
| [Dashboard](Dashboard.md) | Board of Games page |
| [User Profile](User-Profile.md) | Profile page feature |
| [Game — Tetris](Game-Tetris.md) | Tetris mechanics & implementation |
| [Game — Sliding Puzzle](Game-Sliding-Puzzle.md) | Sliding Puzzle mechanics |
| [Game — 2048](Game-2048.md) | 2048 mechanics |
| [Game — Breakout](Game-Breakout.md) | Breakout mechanics |
| [Game — Mario](Game-Mario.md) | Mario mechanics |
| [Game — Pac-Man](Game-Pac-Man.md) | Pac-Man mechanics |
| [Game — Chess](Game-Chess.md) | Chess mechanics & bot AI |
| [Game — Geometry Dash](Game-Geometry-Dash.md) | Geometry Dash mechanics |

---

## Project Overview

**Games** is a multi-game web platform where users can:

- Browse a catalogue of classic games on the **Dashboard**
- **Register** and **log in** to save personal playlists and scores
- Add games to a personal **playlist** visible on their Profile page
- **Play** eight fully-implemented games directly in the browser
- Submit scores to a global **leaderboard**
- Switch between **dark and light themes**

### Technology Snapshot

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, React Router v6 |
| Backend | Django 6, Django REST Framework, Token Auth |
| Database | SQLite (dev) — replaceable with PostgreSQL |
| Styling | Plain CSS with CSS custom properties (theme variables) |
| Canvas games | HTML5 Canvas API (Pac-Man, Breakout, Mario) |

---

## Games Catalogue

| # | Game | Route | Key Mechanic |
|---|------|-------|--------------|
| 1 | Tetris | `/tetris` | Stack falling tetrominoes, clear lines |
| 2 | Sliding Puzzle | `/sliding-puzzle` | Sort numbered tiles with a blank space |
| 3 | 2048 | `/2048` | Merge tiles on a 4 × 4 grid to reach 2048 |
| 4 | Breakout | `/breakout` | Bounce a ball to destroy brick rows |
| 5 | Mario | `/mario` | Platformer — collect coins, stomp enemies |
| 6 | Pac-Man | `/pacman` | Eat all dots in a maze, avoid ghosts |
| 7 | Chess | `/chess` | Play chess against a bot (5 difficulty levels) |
| 8 | Geometry Dash | `/geometry-dash` | Auto-runner — jump over obstacles across 10 levels |
