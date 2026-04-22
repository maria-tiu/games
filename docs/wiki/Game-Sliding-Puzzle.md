# Game — Sliding Puzzle

**Route**: `/sliding-puzzle`  
**Component**: `pages/SlidingPuzzle.tsx`  
**Implemented in issue**: [#10 Game #2 — Sliding Puzzle](https://github.com/maria-tiu/games/issues/10)

---

## Gameplay Overview

The classic N-puzzle. Numbered tiles are arranged on a square grid with one blank
space. The goal is to slide tiles into the correct order — 1, 2, 3 … left to right,
top to bottom — with the blank space in the bottom-right corner.

---

## Controls

| Input | Action |
|-------|--------|
| Click a tile | Slide it into the adjacent blank space |
| `←` `→` `↑` `↓` | Move the blank space with arrow keys |

Arrow keys move the blank space (i.e. pressing `←` slides the tile to the right of the
blank leftward into the blank).

---

## Grid Sizes

The player can choose between three grid sizes before starting:

| Size | Tiles | Difficulty |
|------|-------|------------|
| 3 × 3 | 8 + 1 blank | Easy |
| 4 × 4 | 15 + 1 blank | Medium (default) |
| 5 × 5 | 24 + 1 blank | Hard |

---

## Scoring

```
score = max(0, 1000 − moves)
```

Fewer moves yields a higher score. The `moves` count and elapsed time are tracked and
displayed during play.

When the puzzle is solved, the score is submitted to the leaderboard with:

| `game_id` | `lines_cleared` field | `level` field |
|-----------|----------------------|--------------|
| `sliding-puzzle` | number of moves taken | grid size (3, 4, or 5) |

---

## Win Condition

The board is solved when every tile's index matches the target sequence:
`[1, 2, 3, …, (size²−1), 0]` where `0` represents the blank.

---

## Technical Implementation

### Data Structure

The board is a flat `number[]` of length `size²`. Index `i` maps to row
`Math.floor(i / size)` and column `i % size`.

The blank space is represented by the value `0`.

### Shuffle Algorithm

The board is shuffled by performing `size² × 100` random valid moves starting from
the solved state. Because every move is a valid swap with the blank, the result is
always solvable. If the shuffle accidentally produces the solved state, it reshuffles.

```typescript
function shuffle(board: Board, size: number): Board {
  // Perform size² × 100 random blank-adjacent swaps
  // Re-shuffle if the result happens to be solved
}
```

### Move Validation

A tile at index `tileIdx` can only move into the blank at `blankIdx` if they are
adjacent — same row with columns differing by 1, or same column with rows differing by 1:

```typescript
function canMove(tileIdx, blankIdx, size): boolean
```

### Timer

A `setInterval` running every second increments a `seconds` counter while `running`
is `true`. The timer pauses when the puzzle is solved.
