---
applyTo: "frontend/**/*.ts,frontend/**/*.tsx,frontend/**/*.css,frontend/**/*.html,frontend/**/*.md"
---

# Frontend (React + TypeScript) instructions

## Where to change code
- Route-level pages are in `frontend/src/pages/`.
- Shared components are in `frontend/src/components/`.
- API clients are in `frontend/src/api/`.
- Routing is configured in `frontend/src/main.tsx`.

## Frontend validation
- Always run from `frontend/`:
  - `npm run lint`
  - `npm run build`
- Run targeted Jest tests when changing tested components; use `npm test` for broader checks.

## React conventions
- Keep business/game logic in hooks/utils when practical.
- Preserve existing route paths and API payload contracts unless explicitly requested.
- Prefer typed interfaces for API responses and component props.
- Keep UI and state changes minimal and localized.

## OWASP client-side/security focus
- Prevent XSS by avoiding unsafe HTML rendering and by treating all user input as untrusted.
- Keep CSP-related changes deliberate (see `frontend/index.html`).
- Avoid exposing secrets or sensitive internals in client code, logs, or error messages.
- Use authenticated API calls consistently and handle auth failures safely.
- Validate and sanitize user-controlled values before sending them to backend APIs.
