# Game — Chess

**Route**: `/chess`  
**Component**: `pages/ChessGame.tsx`  
**Hook**: `hooks/useChessGame.ts`

---

## Gameplay Overview

Classic chess against a computer opponent. The player chooses a difficulty level (1–5)
and a colour (White or Black). Legal moves are highlighted on click. The game ends by
checkmate, stalemate, or draw.

---

## Controls

| Input | Action |
|-------|--------|
| Click a piece | Select it (legal destination squares are highlighted) |
| Click a highlighted square | Move the selected piece there |
| Difficulty buttons (1–5) | Change the bot difficulty before or after a game |
| Colour toggle | Play as White or Black |
| New Game button | Reset the board |

---

## Scoring

Scores are submitted to the leaderboard only for logged-in users when a game ends:

| Outcome | Score submitted |
|---------|----------------|
| Win by checkmate | 100 |
| Draw / Stalemate | 50 |
| Loss | 0 (not submitted) |

The score is stored alongside the bot difficulty level.

---

## Bot Opponents

| # | Name | Approx. Elo | Behaviour |
|---|------|-------------|-----------|
| 1 | Novice Nina | 800 | Picks a completely random legal move |
| 2 | Beginner Bob | 1 000 | Prefers captures; otherwise random |
| 3 | Easy Eddie | 1 200 | Minimax depth 2 (looks 2 half-moves ahead) |
| 4 | Medium Max | 1 400 | Alpha-beta depth 3 with move ordering |
| 5 | Hard Harry | 1 600 | Alpha-beta depth 4 with move ordering |

---

## Win / Lose / Draw Conditions

- **Win**: Opponent's king is in checkmate (no legal moves, in check).
- **Loss**: Your king is in checkmate.
- **Stalemate**: Current player has no legal moves but is not in check — game drawn.
- **Draw**: 50-move rule (50 moves with no capture or pawn advance).

---

## Technical Implementation

### Hook: `useChessGame` (`hooks/useChessGame.ts`)

All game logic lives in this hook, exposed via a `useReducer`. Key exports:

| Export | Description |
|--------|-------------|
| `state` | Full `ChessState` object |
| `selectSquare(row, col)` | Handle a board-square click |
| `promote(pieceType)` | Choose a promotion piece after a pawn reaches rank 8 |
| `setBot(difficulty)` | Change the bot difficulty (1–5) |
| `setPlayerColor(color)` | Switch the player's colour |
| `newGame()` | Reset to the initial position |

### Game State (`ChessState`)

```typescript
interface ChessState {
  board: Board;                        // 8 × 8 array of Piece | null
  currentTurn: Color;                  // 'white' | 'black'
  selectedSquare: [number, number] | null;
  legalMovesForSelected: [number, number][];
  status: GameStatus;                  // 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'
  winner: Color | null;
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  lastMove: Move | null;
  promotionPending: { from: [number, number]; to: [number, number] } | null;
  moveHistory: string[];               // Algebraic notation (e.g. "e4", "Nf3")
  enPassantTarget: [number, number] | null;
  castlingRights: CastlingRights;
  halfMoveClock: number;               // For 50-move draw rule
  fullMoveNumber: number;
  botDifficulty: BotDifficulty;        // 1–5
  thinking: boolean;                   // true while bot is computing
  playerColor: Color;
  gameOver: boolean;
}
```

### Bot AI

The bot runs synchronously in a `setTimeout` to avoid blocking the UI:

- **Depth 1 (Novice)**: random legal move.
- **Depth 2 (Beginner)**: capture-biased random.
- **Depth 3 (Easy)**: minimax with depth 2 (1 full move look-ahead).
- **Depth 4 (Medium)**: alpha-beta pruning, depth 3, with move ordering.
- **Depth 5 (Hard)**: alpha-beta pruning, depth 4, with move ordering.

Move ordering (captures first) significantly speeds up alpha-beta pruning at higher depths.

### Board Evaluation (`evaluateBoard`)

Material values and piece-square tables (PSTs) are used to score the position:

| Piece | Material value |
|-------|---------------|
| Pawn (P) | 100 |
| Knight (N) | 320 |
| Bishop (B) | 330 |
| Rook (R) | 500 |
| Queen (Q) | 900 |
| King (K) | 20 000 |

Positive scores favour White; negative scores favour Black.

### Special Moves

| Move | Supported |
|------|-----------|
| Castling (king-side & queen-side) | ✅ |
| En passant | ✅ |
| Pawn promotion (Q / R / B / N) | ✅ |

### Board Rendering

The board is rendered as an 8 × 8 HTML `<div>` grid. Piece symbols use Unicode chess
characters (♚ ♛ ♜ ♝ ♞ ♟). When the player plays Black, the board is flipped so Black
is always at the bottom.

### Score Submission

On game over, the score is submitted to `POST /api/scores/` with `game_id: "chess"` if
the user is logged in.
