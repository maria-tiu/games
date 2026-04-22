# Game — Breakout

**Route**: `/breakout`  
**Component**: `pages/BreakoutGame.tsx`  
**Implemented in issue**: [#12 Game #3 — Breakout](https://github.com/maria-tiu/games/issues/12)

---

## Gameplay Overview

Use a paddle to keep a ball in play and destroy all bricks at the top of the screen.
You have **3 lives** — each time the ball falls below the paddle you lose one. Clear
all 50 bricks to win!

---

## Controls

| Key / Input | Action |
|-------------|--------|
| `←` `→` | Move paddle left / right |
| Mouse movement | Move paddle with the cursor |
| `Space` or mouse click | Launch the ball |
| `P` | Pause / Resume |

---

## Scoring

Bricks are arranged in 5 rows with different point values:

| Row (top → bottom) | Points per brick |
|--------------------|-----------------|
| Row 1 (top) | 50 |
| Row 2 | 40 |
| Row 3 | 30 |
| Row 4 | 20 |
| Row 5 (bottom) | 10 |

---

## Lives & Win / Lose Conditions

- **Start**: 3 lives.
- **Lose a life**: ball passes below the paddle.
- **Game Over**: all lives lost before clearing all bricks.
- **Win**: all 50 bricks destroyed.

---

## Technical Implementation

### Rendering

The game is rendered on an HTML5 **Canvas** (800 × 500 px) via a
`requestAnimationFrame` loop stored in a `useRef`.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CANVAS_WIDTH` | 800 | Canvas width (px) |
| `CANVAS_HEIGHT` | 500 | Canvas height (px) |
| `PADDLE_WIDTH` | 100 | Paddle width (px) |
| `PADDLE_HEIGHT` | 12 | Paddle height (px) |
| `PADDLE_SPEED` | 7 | Keyboard move speed (px/frame) |
| `BALL_RADIUS` | 8 | Ball radius (px) |
| `BALL_SPEED_INITIAL` | 4 | Initial ball speed (px/frame) |
| `BRICK_ROWS` | 5 | Number of brick rows |
| `BRICK_COLS` | 10 | Bricks per row |
| `LIVES_INITIAL` | 3 | Starting lives |

### Ball Physics

- The ball travels at constant speed with `(vx, vy)` velocity components.
- **Wall bounces**: left/right/top walls → invert the corresponding velocity component.
- **Paddle reflection**: the reflection angle depends on where the ball hits the paddle.
  A hit position normalised to `[-1, +1]` is mapped to `±(0.65 × π/2)` ≈ ±58°. This
  ensures the ball always moves upward after hitting the paddle.
- **Brick collision**: when the ball's bounding circle intersects a live brick, the
  brick is destroyed, points are awarded (based on row), and the ball's vertical
  velocity is inverted.

### Game State

All game state is stored in a single `useRef<GameState>` (not React state) to avoid
re-renders on every animation frame. A companion `useState` (`disp`) holds the
display values that must trigger re-renders (score, lives, started, over, won, paused).

```typescript
interface GameState {
  paddleX: number;
  ballX: number; ballY: number;
  ballVx: number; ballVy: number;
  bricks: Brick[];
  score: number;
  lives: number;
  started: boolean;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}
```

### Brick Layout

50 bricks arranged in a 5 × 10 grid, starting 50 px from the top:

```typescript
x = BRICK_OFFSET_LEFT + col × (BRICK_WIDTH + BRICK_PADDING)   // = 26 + col × 74
y = BRICK_OFFSET_TOP  + row × (BRICK_HEIGHT + BRICK_PADDING)  // = 50 + row × 26
```

### Score Submission

When the game ends (win or all lives lost), the score is automatically submitted to
`POST /api/scores/` with `game_id: "breakout"` if the user is logged in.
