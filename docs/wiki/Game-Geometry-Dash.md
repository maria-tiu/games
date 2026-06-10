# Game — Geometry Dash

**Route**: `/geometry-dash`  
**Component**: `pages/GeometryDash.tsx`

---

## Gameplay Overview

A timing-based auto-runner where your cube automatically moves forward. Jump over spikes
and obstacles to reach the end of each level. There are **10 progressively harder
levels**, each with its own obstacle layout, speed, and jump physics.

---

## Controls

| Key / Input | Action |
|-------------|--------|
| `Space` or `↑` | Jump |
| `Enter` | Start / Restart the current level |
| `1` – `0` | Quick-select level 1 to 10 |
| Click level button | Switch to a different level |

---

## Levels

| # | Name | Speed (px/s) | Notes |
|---|------|-------------|-------|
| 1 | Warm Up | 260 | Gentle intro — few obstacles |
| 2 | Tiny Steps | 280 | Slightly tighter gaps |
| 3 | Bounce Path | 300 | Varied obstacle heights |
| 4 | Tight Rhythm | 320 | Shorter spacing between obstacles |
| 5 | Stair Peaks | 335 | Staircase-style ascending obstacles |
| 6 | Mid Boss | 350 | Denser obstacle clusters |
| 7 | Double Time | 368 | Near-constant jumping required |
| 8 | Turbo Lane | 382 | Fast obstacles, small windows |
| 9 | Night Sprint | 395 | Very tight gaps, high jumps |
| 10 | Final Rush | 410 | Maximum speed, tallest obstacles |

---

## Win / Lose Conditions

- **Win**: Your cube travels the full length of the level without hitting any obstacle.
- **Lose**: Your cube collides with a spike or block. Press `Enter` to restart
  from the beginning of the current level.

---

## Progress Bar

A progress bar at the top of the screen shows how far through the current level you
have travelled (0 % → 100 %).

---

## Technical Implementation

### Rendering

The game is rendered as styled `<div>` elements positioned with CSS. A
`requestAnimationFrame` loop drives physics and obstacle scrolling:

- The **player cube** is fixed at `x = 110 px` and moves only vertically.
- **Obstacles** scroll leftward at the current level's speed.

### Physics

Each level defines three physics parameters:

| Parameter | Description |
|-----------|-------------|
| `speed` | Horizontal scroll speed (px/s) |
| `gravity` | Downward acceleration applied each frame (px/s²) |
| `jumpVelocity` | Upward velocity applied when the player jumps (px/s) |

The player is grounded when `playerY ≤ 0`. Jumps are only allowed from the ground.

### Collision Detection

On every frame the player's bounding box (30 × 30 px) is checked against every
obstacle. An obstacle is represented by:

```typescript
interface Obstacle {
  x: number;       // horizontal position in level coordinates
  width: number;   // 30 px for short obstacles, 36 px for tall ones
  height: number;  // obstacle height (40–96 px across the 10 levels)
}
```

A collision triggers the `'lost'` status, stopping the animation loop.

### Level Data

Levels are defined with `obstaclePattern(startX, gap, heights[])` which generates a
series of evenly-spaced obstacles with the given heights. Later levels have shorter
`gap` values (tighter spacing) and taller `heights` (harder to clear).

### Game State

| React state | Description |
|-------------|-------------|
| `levelIndex` | Currently selected level (0–9) |
| `status` | `'ready'` / `'playing'` / `'won'` / `'lost'` |
| `distance` | Pixels scrolled since level start |
| `playerY` | Current vertical offset of the player cube |

Physics values (`distanceRef`, `playerYRef`, `velocityRef`) are stored in `useRef` to
avoid re-renders inside the animation loop.
