# Copilot instructions for `games`

## Scope and structure
- This repository contains a React + TypeScript frontend (`/frontend`) and a Django REST backend (`/backend`).
- Keep changes small and scoped to the task.
- Prefer path-specific instructions for implementation details:
  - Backend: `.github/instructions/backend.instructions.md`
  - Frontend: `.github/instructions/frontend.instructions.md`

## How to validate changes
- Frontend (run from `/frontend`):
  - `npm run lint`
  - `npm run build`
  - `npm test` (or targeted Jest tests)
- Backend (run from `/backend`):
  - `python manage.py test`
  - Coverage when needed: `coverage run --source='tetris' manage.py test` and `coverage report -m`

## General coding conventions
- Reuse existing architecture and patterns documented in `docs/wiki/Architecture.md`.
- Do not introduce new dependencies unless required.
- Keep API contracts and route names stable unless explicitly requested.
- Update docs when behavior, endpoints, or developer workflow changes.

## Security baseline (all changes)
- Never commit secrets or credentials.
- Validate all external input and fail closed by default.
- Add or update tests for security-sensitive behavior when modifying auth, permissions, or user input handling.
