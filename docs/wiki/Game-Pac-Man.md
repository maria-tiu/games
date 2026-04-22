# Game — Pac-Man

**Route**: `/pacman`  
**Component**: `pages/PacmanGame.tsx`  
**Implemented in issue**: [#21 Pac-Man game](https://github.com/maria-tiu/games/issues/21)

---

## Gameplay Overview

Navigate the maze eating all dots to win. **Power pellets** turn ghosts blue — chase and
eat them for bonus points! The game ends when all lives are lost.

---

## Controls

| Key | Action |
|-----|--------|
| `←` `→` `↑` `↓` | Move Pac-Man |
| `W` `A` `S` `D` | Alternative move keys |
| `Space` / `Enter` | Start / Resume after death |
| `P` | Pause / Resume |

---

## Scoring

| Event | Points |
|-------|--------|
| Eat a dot | 10 |
| Eat a power pellet | 50 |
| Eat a frightened ghost | 200 × (doubling multiplier) |

Eating multiple ghosts in one power-pellet session doubles the score each time:
1st ghost = 200, 2nd = 400, 3rd = 800, 4th = 1 600.

---

## Lives & Win / Lose Conditions

- **Start**: 3 lives.
- **Lose a life**: Pac-Man is caught by a non-frightened ghost.
- **Game Over**: all lives lost.
- **Win**: all dots and power pellets eaten.

---

## Maze

The maze is a **21 × 23 tile** grid (each tile = 20 px → canvas 420 × 460 px).

Tile types:

| Value | Meaning |
|-------|---------|
| `0` | Dot |
| `1` | Wall |
| `2` | Power pellet |
| `3` | Empty space (no dot) |

**Row 9** is the tunnel row: Pac-Man (and ghosts) wrap around when they reach the left
or right edge of this row.

**4 power pellets** are placed at positions (r3,c1), (r3,c19), (r15,c1), (r15,c19).

---

## Ghosts

| # | Colour | Description |
|---|--------|-------------|
| 1 | Red (`#FF2222`) | Aggressive |
| 2 | Pink (`#FFB8FF`) | Ambush |
| 3 | Cyan (`#00FFFF`) | Patrol |
| 4 | Orange (`#FFB847`) | Random |

All four ghosts start in the central ghost house (the `3`-tile area in the middle of the maze).

### Ghost Behaviour

- **Normal mode**: ghosts navigate the maze using a simple random/directional AI.
  They choose the next corridor at each tile boundary, preferring not to reverse.
- **Frightened mode** (power pellet active): ghosts turn blue, slow down, and move
  randomly for `FRIGHT_FRAMES` (~5 seconds at 60 fps). Eating a frightened ghost
  earns increasing bonus points.
- **Return mode**: when a ghost is eaten it returns to the ghost house.

---

## Technical Implementation

### Rendering

Rendered on an HTML5 **Canvas** (420 × 460 px) via a `requestAnimationFrame` loop.
All sprites are drawn programmatically — Pac-Man as an arc with a mouth angle
animating per frame, ghosts as coloured rounded shapes.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TILE` | 20 | Tile size (px) |
| `COLS / ROWS` | 21 / 23 | Grid dimensions |
| `PAC_SPEED` | 2 | Pac-Man speed (px/frame) |
| `GHOST_SPEED` | 1.8 | Ghost speed (px/frame) |
| `LIVES_INIT` | 3 | Starting lives |
| `DOT_PTS` | 10 | Points per dot |
| `POWER_PTS` | 50 | Points per power pellet |
| `GHOST_BASE_PTS` | 200 | Base points for eating a ghost |
| `FRIGHT_FRAMES` | 300 | Frightened duration (~5 s at 60 fps) |
| `TUNNEL_ROW` | 9 | Row index for the wrap-around tunnel |

### Movement & Input Buffering

Pac-Man's direction input is **buffered**: the desired direction is queued and applied
at the next tile boundary if the corridor is free. This allows the player to press a
turn key slightly before the intersection, resulting in smooth cornering.

### Audio

All sound effects are synthesised via the **Web Audio API** — no audio files used:

| Sound | Trigger |
|-------|---------|
| Waka-waka (alternating 260/360 Hz) | Eating a dot |
| Power-up arpeggio | Eating a power pellet |
| Ghost eaten descending chord | Eating a frightened ghost |
| Death descending scale | Pac-Man caught |
| Win ascending fanfare | All dots eaten |

### Game State

Frame-level state is stored in a `useRef<GS>` to avoid re-renders inside the animation
loop. A `useState` (`disp`) drives UI elements (score, lives, overlays).

### Score Submission

When the game ends, the score is automatically submitted to `POST /api/scores/` with
`game_id: "pacman"` if the user is logged in.
