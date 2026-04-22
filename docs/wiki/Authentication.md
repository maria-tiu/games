# Authentication

The **Games** platform provides a full registration, login, and password-reset flow.

---

## Overview

Authentication is **token-based**. After a successful register or login, the API returns
an opaque token that the frontend stores in `localStorage`. Every subsequent request to a
protected endpoint sends the token in the `Authorization: Token <token>` HTTP header.

---

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/auth` | `pages/AuthPage.tsx` | Combined login + register form |

The page contains two tabs: **Login** and **Sign Up**.

---

## Sign Up

New users provide a **username**, **email**, **password**, and **password confirmation**.
The form calls `POST /api/auth/register/` and on success stores the returned token and
username in `localStorage` and redirects the user to the Dashboard.

**Validation (backend)**

- Username must be unique.
- Email must be unique.
- Password must match `password2`.
- Password is validated against Django's built-in password validators
  (minimum length, not too common, not entirely numeric, etc.).

**API used**: [`POST /api/auth/register/`](API-Reference.md#post-apiauthregister)

---

## Login

Existing users provide their **username** and **password**.
The form calls `POST /api/auth/login/` and on success stores the returned token.

Error messages distinguish between "username not found" and "incorrect password" to
help users self-recover without revealing whether an account exists to a third party
(note: the separate error messages are intentional UX — for strict security the
messages could be unified).

**API used**: [`POST /api/auth/login/`](API-Reference.md#post-apiauthlogin)

---

## Logout

A **Logout** button is visible in the header when a user is logged in. It calls
`POST /api/auth/logout/` (which invalidates the token server-side) and then clears
`localStorage`.

**API used**: [`POST /api/auth/logout/`](API-Reference.md#post-apiauthlogout)

---

## Password Reset

1. The user enters their email address in the "Forgot Password" section of the Auth page.
2. The frontend calls `POST /api/auth/password-reset/`.
3. In **development** (`DEBUG = True`) the reset token is returned directly in the
   response body. In **production** it would be sent by email.
4. The user pastes the token into the "New Password" form along with a new password.
5. The frontend calls `POST /api/auth/password-reset-confirm/`.

The token is a Django HMAC-based, time-limited one-time token (`default_token_generator`).
Its format is `<base64-uid>.<token-string>`.

**APIs used**:  
[`POST /api/auth/password-reset/`](API-Reference.md#post-apiauthpassword-reset)  
[`POST /api/auth/password-reset-confirm/`](API-Reference.md#post-apiauthpassword-reset-confirm)

---

## Frontend Implementation Details

### `AuthContext` (`context/AuthContext.tsx`)

Provides the following values and helpers to the entire component tree:

| Key | Type | Description |
|-----|------|-------------|
| `isLoggedIn` | `boolean` | `true` when a token is stored |
| `username` | `string \| null` | Current username |
| `token` | `string \| null` | Raw auth token |
| `login(token, username)` | function | Store credentials after sign-in |
| `logout()` | function | Clear credentials and call logout API |
| `updateUsername(name)` | function | Update username after profile edit |

State is initialised from `localStorage` so sessions survive page refreshes.

### `useAuth` hook (`context/useAuth.ts`)

Convenience wrapper around `useContext(AuthContext)` used by all components that need
auth state.

### API helpers (`api/auth.ts`)

Thin `fetch` wrappers:

```typescript
register(username, email, password, password2) → Promise<{ token, username }>
login(username, password) → Promise<{ token, username }>
logout(token) → Promise<void>
requestPasswordReset(email) → Promise<{ detail, reset_token? }>
confirmPasswordReset(resetToken, newPassword, newPassword2) → Promise<{ detail }>
```

---

## Protected Routes

The Dashboard and Profile page components check `isLoggedIn` from `AuthContext`:

- **Dashboard**: Play and Add-to-playlist buttons are **disabled** for unauthenticated
  users; a hint link to `/auth` is shown at the bottom.
- **Profile page**: Navigates the user back to the Dashboard if they are not logged in.
- **Game pages**: Each game page checks `isLoggedIn` on mount and redirects to the
  Dashboard if needed (scores are only submitted for authenticated users).
