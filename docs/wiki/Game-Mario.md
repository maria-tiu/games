# Game — Mario

**Route**: `/mario`  
**Component**: `pages/MarioGame.tsx`  
**Implemented in issue**: [#19 Mario](https://github.com/maria-tiu/games/issues/19)

---

## Gameplay Overview

A simple 2-D platformer inspired by Super Mario Bros. Run and jump across platforms to
collect all **16 coins**. Watch out for Goombas — jump on top of them to defeat them.
Fall off the screen or get hit from the side and you lose a life. Collect all coins to win!

---

## Controls

| Key | Action |
|-----|--------|
| `←` `→` / `A` `D` | Move left / right |
| `↑` / `W` / `Space` | Jump (only when on the ground) |
| `P` | Pause / Resume |

---

## Scoring

| Event | Points |
|-------|--------|
| Collect a coin | 100 |
| Stomp a Goomba | 200 |

---

## Lives & Win / Lose Conditions

- **Start**: 3 lives.
- **Lose a life**: Mario falls off the screen OR is hit by a Goomba from the side.
- **Invincibility frames**: after being hit, Mario flashes for a short period during
  which further collisions are ignored.
- **Game Over**: all lives lost.
- **Win**: all 16 coins collected.

---

## Level Layout

The level is a single static screen (800 × 500 px canvas) with 7 platforms:

| Platform | Position (x, y) | Width |
|----------|-----------------|-------|
| Ground | (0, 450) | 800 |
| Platform A | (80, 342) | 130 |
| Platform B | (260, 278) | 110 |
| Platform C | (420, 337) | 140 |
| Platform D | (600, 257) | 120 |
| Platform E (top right) | (695, 157) | 85 |
| Platform F (upper left) | (185, 192) | 100 |

**16 coins** are scattered across the platforms and the ground.  
**4 Goombas** patrol fixed horizontal ranges on the ground and platforms.

---

## Technical Implementation

### Rendering

Rendered on an HTML5 **Canvas** (800 × 500 px) via a `requestAnimationFrame` loop.
All sprites are drawn programmatically (no image assets); Mario uses coloured
rectangles with facial features drawn in CSS-style shapes.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CANVAS_W / H` | 800 / 500 | Canvas dimensions (px) |
| `MARIO_W / H` | 28 / 36 | Mario bounding box |
| `GRAVITY` | 0.55 | Downward acceleration per frame |
| `JUMP_FORCE` | −13 | Initial vertical velocity on jump |
| `MOVE_SPD` | 4 | Horizontal move speed (px/frame) |
| `ENEMY_SPD` | 1.5 | Goomba patrol speed (px/frame) |
| `LIVES_INIT` | 3 | Starting lives |

### Physics

- **Gravity** is applied every frame: `mvy += GRAVITY`.
- **Jump** sets `mvy = JUMP_FORCE` only when `onGround === true`.
- **Platform collision**: for each platform, if Mario's feet are inside the platform's
  top surface (within a small threshold) and he was moving downward, his Y is snapped
  to the top and `onGround = true`.
- **Fall-off detection**: if Mario's Y exceeds `CANVAS_H + 50`, he loses a life.

### Enemy (Goomba) AI

Each Goomba patrols between a `patrolLeft` and `patrolRight` X boundary, reversing
direction when it reaches a boundary.

**Stomp detection**: if Mario lands on top of a Goomba (his feet are within the
Goomba's top third and moving downward), the Goomba dies and Mario bounces up.

**Side collision**: if Mario overlaps a Goomba from the side (and is not in invincibility
frames), he loses a life.

### Game State

All frame-level state is stored in a `useRef<GameState>` to avoid re-renders inside
the animation loop. A companion `useState` (`disp`) holds values that must trigger
UI re-renders.

```typescript
interface GameState {
  mx: number; my: number;       // Mario position
  mvx: number; mvy: number;     // Mario velocity
  onGround: boolean;
  facingRight: boolean;
  invincible: number;           // Invincibility frames remaining
  coins: Coin[];
  enemies: Enemy[];
  score: number;
  lives: number;
  started: boolean;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}
```

### Score Submission

When the game ends, the score is automatically submitted to `POST /api/scores/` with
`game_id: "mario"` if the user is logged in.
