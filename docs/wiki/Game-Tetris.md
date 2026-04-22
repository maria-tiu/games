# Game — Tetris

**Route**: `/tetris`  
**Component**: `pages/TetrisGame.tsx`  
**Implemented in issue**: [#1 Initial Game #1 — Tetris](https://github.com/maria-tiu/games/issues/1), [#23 Tetris — enhancements](https://github.com/maria-tiu/games/issues/23)

---

## Gameplay Overview

Classic Tetris. Tetromino pieces fall from the top of a 10 × 20 grid. The player
arranges them to fill complete horizontal lines; each filled line is cleared and earns
points. The game ends when pieces stack up to the top of the grid.

---

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left / right |
| `↑` | Rotate piece clockwise |
| `↓` | Soft drop (accelerate fall) |
| `Space` | Hard drop (instant placement) |
| `P` | Pause / Resume |
| `M` | Mute / Unmute |

---

## Scoring

| Event | Points |
|-------|--------|
| 1 line cleared | 100 × level |
| 2 lines cleared | 300 × level |
| 3 lines cleared | 500 × level |
| 4 lines cleared ("Tetris") | 800 × level |

Level increases every 10 lines cleared. Higher levels drop pieces faster.

---

## Tetrominoes

All 7 standard tetrominoes with authentic Tetris colours:

| Piece | Shape | Colour |
|-------|-------|--------|
| I | ████ | Cyan |
| O | ██ / ██ | Yellow |
| T | ███ / _█_ | Purple |
| S | _██ / ██_ | Green |
| Z | ██_ / _██ | Red |
| J | █__ / ███ | Blue |
| L | __█ / ███ | Orange |

---

## Features

- **Ghost piece** — a semi-transparent preview showing where the active piece will land.
- **Next-piece preview** panel on the left sidebar.
- **Score / Level / Lines** display on the right sidebar.
- **Global leaderboard** — top-10 scores persisted via the REST API.
- **Auto-submit** — logged-in users have their score submitted automatically on game over.
- **Anonymous submit** — guests can still submit a score with a custom name.
- **Background music** — synthesised via the Web Audio API.
- **Sound effects** — move, rotate, drop, line clear, level-up, game-over sounds.

---

## Technical Implementation

### Hook: `useTetrisGame` (`hooks/useTetrisGame.ts`)

Manages all game state. Exposes:

| Function | Description |
|----------|-------------|
| `moveLeft()` | Shift piece one cell left |
| `moveRight()` | Shift piece one cell right |
| `moveDown(hardDrop)` | Move piece down; if `hardDrop` is `true`, drop to the lowest valid position |
| `rotate()` | Rotate the current piece clockwise using the wall-kick system |
| `resetGame()` | Re-initialise game state for a new game |
| `togglePause()` | Toggle `isPaused` |
| `getGhostPosition(board, piece, pos)` | Calculate the ghost-piece position |
| `dropInterval` | Current interval (ms) between automatic drops (decreases with level) |

### Game State

```typescript
interface TetrisGameState {
  board: Board;           // 20-row × 10-col 2-D array of cell values
  currentPiece: Tetromino | null;
  currentPosition: Position;  // { x, y } of the top-left of the piece bounding box
  nextPiece: Tetromino | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
}
```

### Utilities (`utils/gameHelpers.ts`)

| Function | Description |
|----------|-------------|
| `createEmptyBoard()` | Returns a fresh 20 × 10 board |
| `isValidPosition(board, piece, pos)` | Collision detection |
| `placePiece(board, piece, pos)` | Returns a new board with the piece locked |
| `clearLines(board)` | Returns `{ board, linesCleared }` after removing full rows |
| `calculateScore(linesCleared, level)` | Points for clearing N lines at the current level |
| `getDropInterval(level)` | Milliseconds between automatic drops |
| `getInitialPosition(piece)` | Spawns a piece at the top-centre |
| `rotateTetromino(piece)` | 90° clockwise rotation |

### Tetrominoes (`utils/tetrominoes.ts`)

Each tetromino is represented as a 2-D boolean matrix and a colour string. Pieces are
selected via `getRandomTetromino()` using `Math.random()`.

### Audio: `useTetrisSound` (`hooks/useTetrisSound.ts`)

Built entirely on the **Web Audio API** — no audio files required. Synthesises:

- Background music loop (arpeggiated melody)
- Move sound (short click)
- Rotate sound (short swish)
- Drop sound (thud)
- Line-clear sound (chord, gets richer with more lines)
- Level-up jingle
- Game-over sequence

---

## Drop Interval Schedule

| Level | Interval |
|-------|----------|
| 1 | 800 ms |
| 2 | 720 ms |
| 3 | 630 ms |
| 4 | 550 ms |
| 5 | 470 ms |
| 6 | 380 ms |
| 7 | 300 ms |
| 8 | 220 ms |
| 9 | 130 ms |
| 10+ | 100 ms |
