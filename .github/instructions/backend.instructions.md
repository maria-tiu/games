---
applyTo: "backend/**/*.py,backend/**/*.md"
---

# Backend (Django + DRF) instructions

## Where to change code
- Main app code is under `backend/tetris/`.
- Project settings are in `backend/backend/settings.py`.
- API behavior and auth flows are documented in `docs/wiki/API-Reference.md` and `docs/wiki/Authentication.md`.

## Backend validation
- Always run: `python manage.py test` from `backend/`.
- For security-sensitive backend changes, also run coverage:
  - `coverage run --source='tetris' manage.py test`
  - `coverage report -m`

## Django/DRF conventions
- Use serializers for request validation; do not trust request payloads directly.
- Keep endpoint permissions explicit and least-privilege.
- Preserve consistent response formats and HTTP status codes.
- When adding protected endpoints, ensure token auth and permissions are correctly enforced.

## OWASP API Security Top 10 focus
- **API1 Broken Object Level Authorization**: verify object ownership checks on user-specific resources.
- **API2 Broken Authentication**: keep login/register/password-reset flows hardened; avoid account enumeration.
- **API3 Broken Object Property Level Authorization**: whitelist writable fields; reject unsafe/mass-assignment inputs.
- **API4 Unrestricted Resource Consumption**: keep/tighten throttling for auth and score submission endpoints.
- **API8 Security Misconfiguration**: keep safe defaults in settings, CORS, DEBUG, and SECRET_KEY handling.
- **API10 Unsafe Consumption of APIs**: validate and sanitize all inbound data before persistence or processing.
