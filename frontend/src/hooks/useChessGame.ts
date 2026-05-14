import { useReducer, useCallback, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type Color = 'white' | 'black';
export type BotDifficulty = 1 | 2 | 3 | 4 | 5;
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: [number, number];
  to: [number, number];
  promotion?: PieceType;
}

interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface ChessState {
  board: Board;
  currentTurn: Color;
  selectedSquare: [number, number] | null;
  legalMovesForSelected: [number, number][];
  status: GameStatus;
  winner: Color | null;
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  lastMove: Move | null;
  promotionPending: { from: [number, number]; to: [number, number] } | null;
  moveHistory: string[];
  enPassantTarget: [number, number] | null;
  castlingRights: CastlingRights;
  halfMoveClock: number;
  fullMoveNumber: number;
  botDifficulty: BotDifficulty;
  thinking: boolean;
  playerColor: Color;
  gameOver: boolean;
}

type Action =
  | { type: 'SELECT_SQUARE'; row: number; col: number }
  | { type: 'PROMOTE'; pieceType: PieceType }
  | { type: 'SET_BOT'; difficulty: BotDifficulty }
  | { type: 'SET_PLAYER_COLOR'; color: Color }
  | { type: 'NEW_GAME' }
  | { type: 'SET_THINKING'; value: boolean }
  | { type: 'BOT_MOVE'; move: Move };

// ── Board Setup ───────────────────────────────────────────────────────────────
function makeInitialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null) as (Piece | null)[]);
  const backRow: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: backRow[c], color: 'black' };
    b[1][c] = { type: 'P', color: 'black' };
    b[6][c] = { type: 'P', color: 'white' };
    b[7][c] = { type: backRow[c], color: 'white' };
  }
  return b;
}

const INITIAL_CASTLING: CastlingRights = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function opponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

function isOnBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Slide along a direction and push reachable squares into `moves`
function slideDir(
  board: Board,
  moves: [number, number][],
  color: Color,
  r: number,
  c: number,
  dr: number,
  dc: number,
): void {
  let tr = r + dr;
  let tc = c + dc;
  while (isOnBoard(tr, tc)) {
    const target = board[tr][tc];
    if (target) {
      if (target.color !== color) moves.push([tr, tc]);
      break;
    }
    moves.push([tr, tc]);
    tr += dr;
    tc += dc;
  }
}

// ── Pseudo-legal move generation ──────────────────────────────────────────────
function getPseudoLegalMoves(
  board: Board,
  r: number,
  c: number,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: [number, number][] = [];
  const { type, color } = piece;

  const addIfValid = (tr: number, tc: number): boolean => {
    if (!isOnBoard(tr, tc)) return false;
    const target = board[tr][tc];
    if (target && target.color === color) return false;
    moves.push([tr, tc]);
    return !target;
  };

  switch (type) {
    case 'P': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      // Single forward
      if (isOnBoard(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        // Double forward from starting row
        if (r === startRow && !board[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const tr = r + dir;
        const tc = c + dc;
        if (isOnBoard(tr, tc)) {
          const target = board[tr][tc];
          if (target && target.color !== color) {
            moves.push([tr, tc]);
          }
          // En passant
          if (enPassantTarget && enPassantTarget[0] === tr && enPassantTarget[1] === tc) {
            moves.push([tr, tc]);
          }
        }
      }
      break;
    }
    case 'N': {
      const knightDeltas: [number, number][] = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of knightDeltas) {
        addIfValid(r + dr, c + dc);
      }
      break;
    }
    case 'B':
      slideDir(board, moves, color, r, c, -1, -1); slideDir(board, moves, color, r, c, -1, 1);
      slideDir(board, moves, color, r, c,  1, -1); slideDir(board, moves, color, r, c,  1, 1);
      break;
    case 'R':
      slideDir(board, moves, color, r, c, -1, 0); slideDir(board, moves, color, r, c, 1, 0);
      slideDir(board, moves, color, r, c,  0, -1); slideDir(board, moves, color, r, c, 0, 1);
      break;
    case 'Q':
      slideDir(board, moves, color, r, c, -1, -1); slideDir(board, moves, color, r, c, -1, 1);
      slideDir(board, moves, color, r, c,  1, -1); slideDir(board, moves, color, r, c,  1, 1);
      slideDir(board, moves, color, r, c, -1, 0); slideDir(board, moves, color, r, c, 1, 0);
      slideDir(board, moves, color, r, c,  0, -1); slideDir(board, moves, color, r, c, 0, 1);
      break;
    case 'K': {
      const kingDeltas: [number, number][] = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of kingDeltas) {
        addIfValid(r + dr, c + dc);
      }
      // Castling
      const kingRow = color === 'white' ? 7 : 0;
      if (r === kingRow && c === 4) {
        const cr = color === 'white' ? castlingRights.whiteKingSide : castlingRights.blackKingSide;
        const cq = color === 'white' ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide;
        if (cr && !board[kingRow][5] && !board[kingRow][6]) {
          moves.push([kingRow, 6]);
        }
        if (cq && !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1]) {
          moves.push([kingRow, 2]);
        }
      }
      break;
    }
  }

  return moves;
}

// ── Attack Detection ──────────────────────────────────────────────────────────
function isAttacked(board: Board, r: number, c: number, byColor: Color): boolean {
  // Knight attacks
  const knightDeltas: [number, number][] = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightDeltas) {
    const tr = r + dr; const tc = c + dc;
    if (isOnBoard(tr, tc)) {
      const p = board[tr][tc];
      if (p && p.color === byColor && p.type === 'N') return true;
    }
  }

  // Pawn attacks (look in the direction the attacking pawn would be coming from)
  // White pawn at (r+1, c±1) attacks (r,c); black pawn at (r-1, c±1) attacks (r,c)
  const pawnDir = byColor === 'white' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const tr = r + pawnDir; const tc = c + dc;
    if (isOnBoard(tr, tc)) {
      const p = board[tr][tc];
      if (p && p.color === byColor && p.type === 'P') return true;
    }
  }

  // King attacks
  const kingDeltas: [number, number][] = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of kingDeltas) {
    const tr = r + dr; const tc = c + dc;
    if (isOnBoard(tr, tc)) {
      const p = board[tr][tc];
      if (p && p.color === byColor && p.type === 'K') return true;
    }
  }

  // Rook / Queen (straight lines)
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
    let tr = r + dr; let tc = c + dc;
    while (isOnBoard(tr, tc)) {
      const p = board[tr][tc];
      if (p) {
        if (p.color === byColor && (p.type === 'R' || p.type === 'Q')) return true;
        break;
      }
      tr += dr; tc += dc;
    }
  }

  // Bishop / Queen (diagonals)
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) {
    let tr = r + dr; let tc = c + dc;
    while (isOnBoard(tr, tc)) {
      const p = board[tr][tc];
      if (p) {
        if (p.color === byColor && (p.type === 'B' || p.type === 'Q')) return true;
        break;
      }
      tr += dr; tc += dc;
    }
  }

  return false;
}

function findKing(board: Board, color: Color): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.color === color) return [r, c];
    }
  }
  return null;
}

function isInCheck(board: Board, color: Color): boolean {
  const kp = findKing(board, color);
  if (!kp) return false;
  return isAttacked(board, kp[0], kp[1], opponent(color));
}

// ── Apply Move ────────────────────────────────────────────────────────────────
interface ApplyResult {
  board: Board;
  captured: Piece | null;
  newEnPassantTarget: [number, number] | null;
  newCastlingRights: CastlingRights;
}

function applyMove(
  board: Board,
  move: Move,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): ApplyResult {
  const nb: Board = board.map(row => [...row]);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = nb[fr][fc]!;
  let captured: Piece | null = nb[tr][tc];
  let newEnPassantTarget: [number, number] | null = null;
  const newCR = { ...castlingRights };

  // En passant capture
  if (piece.type === 'P' && enPassantTarget && enPassantTarget[0] === tr && enPassantTarget[1] === tc) {
    captured = nb[fr][tc];
    nb[fr][tc] = null;
  }

  // Set new en passant target for double pawn push
  if (piece.type === 'P' && Math.abs(tr - fr) === 2) {
    newEnPassantTarget = [(fr + tr) / 2, tc];
  }

  // Castling: move rook
  if (piece.type === 'K' && fc === 4) {
    if (tc === 6) { nb[fr][5] = nb[fr][7]; nb[fr][7] = null; }
    if (tc === 2) { nb[fr][3] = nb[fr][0]; nb[fr][0] = null; }
    if (piece.color === 'white') { newCR.whiteKingSide = false; newCR.whiteQueenSide = false; }
    else { newCR.blackKingSide = false; newCR.blackQueenSide = false; }
  }

  // Update castling rights on rook move
  if (piece.type === 'R') {
    if (fr === 7 && fc === 7) newCR.whiteKingSide = false;
    if (fr === 7 && fc === 0) newCR.whiteQueenSide = false;
    if (fr === 0 && fc === 7) newCR.blackKingSide = false;
    if (fr === 0 && fc === 0) newCR.blackQueenSide = false;
  }

  // Update castling rights on rook capture
  if (tr === 7 && tc === 7) newCR.whiteKingSide = false;
  if (tr === 7 && tc === 0) newCR.whiteQueenSide = false;
  if (tr === 0 && tc === 7) newCR.blackKingSide = false;
  if (tr === 0 && tc === 0) newCR.blackQueenSide = false;

  // Apply the move
  nb[tr][tc] = piece.type === 'P' && (tr === 0 || tr === 7)
    ? { type: move.promotion ?? 'Q', color: piece.color }
    : piece;
  nb[fr][fc] = null;

  return { board: nb, captured, newEnPassantTarget, newCastlingRights: newCR };
}

// ── Legal Move Filtering ──────────────────────────────────────────────────────
function getLegalMoves(
  board: Board,
  r: number,
  c: number,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const pseudo = getPseudoLegalMoves(board, r, c, enPassantTarget, castlingRights);
  const legal: [number, number][] = [];

  for (const [tr, tc] of pseudo) {
    // For castling, check that king doesn't pass through check
    if (piece.type === 'K' && Math.abs(tc - c) === 2) {
      if (isInCheck(board, piece.color)) continue;
      const passThroughCol = (tc + c) / 2;
      if (isAttacked(board, r, passThroughCol, opponent(piece.color))) continue;
    }
    const result = applyMove(board, { from: [r, c], to: [tr, tc] }, enPassantTarget, castlingRights);
    if (!isInCheck(result.board, piece.color)) {
      legal.push([tr, tc]);
    }
  }

  return legal;
}

function getAllLegalMoves(
  board: Board,
  color: Color,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color) continue;
      const targets = getLegalMoves(board, r, c, enPassantTarget, castlingRights);
      for (const [tr, tc] of targets) {
        if (piece.type === 'P' && (tr === 0 || tr === 7)) {
          for (const promo of ['Q', 'R', 'B', 'N'] as PieceType[]) {
            moves.push({ from: [r, c], to: [tr, tc], promotion: promo });
          }
        } else {
          moves.push({ from: [r, c], to: [tr, tc] });
        }
      }
    }
  }
  return moves;
}

// ── Algebraic Notation ────────────────────────────────────────────────────────
const FILES = 'abcdefgh';

function toAlgebraic(
  board: Board,
  move: Move,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
  isCheck: boolean,
  isMate: boolean,
): string {
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = board[fr][fc];
  if (!piece) return '?';

  const suffix = isMate ? '#' : isCheck ? '+' : '';
  const dest = `${FILES[tc]}${8 - tr}`;

  // Castling
  if (piece.type === 'K' && Math.abs(tc - fc) === 2) {
    return (tc > fc ? 'O-O' : 'O-O-O') + suffix;
  }

  const isEP = piece.type === 'P' && fc !== tc && !board[tr][tc];
  const isCapture = !!board[tr][tc] || isEP;

  if (piece.type === 'P') {
    let s = isCapture ? `${FILES[fc]}x${dest}` : dest;
    if (move.promotion) s += `=${move.promotion}`;
    return s + suffix;
  }

  // Disambiguation for non-pawn pieces
  const sameTypeMoves = getAllLegalMoves(board, piece.color, enPassantTarget, castlingRights)
    .filter(m => {
      const mp = board[m.from[0]][m.from[1]];
      return mp && mp.type === piece.type && (m.from[0] !== fr || m.from[1] !== fc) && m.to[0] === tr && m.to[1] === tc;
    });

  let disambig = '';
  if (sameTypeMoves.length > 0) {
    const sameFile = sameTypeMoves.some(m => m.from[1] === fc);
    const sameRank = sameTypeMoves.some(m => m.from[0] === fr);
    if (!sameFile) disambig = FILES[fc];
    else if (!sameRank) disambig = `${8 - fr}`;
    else disambig = `${FILES[fc]}${8 - fr}`;
  }

  return `${piece.type}${disambig}${isCapture ? 'x' : ''}${dest}${suffix}`;
}

// ── Evaluation ────────────────────────────────────────────────────────────────
const PIECE_VALUES: Record<PieceType, number> = {
  K: 20000, Q: 900, R: 500, B: 330, N: 320, P: 100,
};

// Piece-square tables (from white's perspective; row 0 = rank 8 = black's back rank)
const PST: Record<PieceType, number[][]> = {
  P: [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [ 50, 50, 50, 50, 50, 50, 50, 50],
    [ 10, 10, 20, 30, 30, 20, 10, 10],
    [  5,  5, 10, 25, 25, 10,  5,  5],
    [  0,  0,  0, 20, 20,  0,  0,  0],
    [  5, -5,-10,  0,  0,-10, -5,  5],
    [  5, 10, 10,-20,-20, 10, 10,  5],
    [  0,  0,  0,  0,  0,  0,  0,  0],
  ],
  N: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  B: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  R: [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [  0,  0,  0,  5,  5,  0,  0,  0],
  ],
  Q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  K: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
  ],
};

function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type];
      const pstRow = p.color === 'white' ? r : 7 - r;
      const pst = PST[p.type][pstRow][c];
      score += p.color === 'white' ? val + pst : -(val + pst);
    }
  }
  return score;
}

// Sort captures first for better alpha-beta pruning
function orderMoves(board: Board, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const ca = board[a.to[0]][a.to[1]];
    const cb = board[b.to[0]][b.to[1]];
    return (cb ? PIECE_VALUES[cb.type] : 0) - (ca ? PIECE_VALUES[ca.type] : 0);
  });
}

// ── Minimax with Alpha-Beta Pruning ───────────────────────────────────────────
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): number {
  if (depth === 0) return evaluateBoard(board);

  const color: Color = isMaximizing ? 'white' : 'black';
  const moves = orderMoves(board, getAllLegalMoves(board, color, enPassantTarget, castlingRights));

  if (moves.length === 0) {
    if (isInCheck(board, color)) return isMaximizing ? -100000 + depth : 100000 - depth;
    return 0; // stalemate
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const res = applyMove(board, move, enPassantTarget, castlingRights);
      const score = minimax(res.board, depth - 1, alpha, beta, false, res.newEnPassantTarget, res.newCastlingRights);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const res = applyMove(board, move, enPassantTarget, castlingRights);
      const score = minimax(res.board, depth - 1, alpha, beta, true, res.newEnPassantTarget, res.newCastlingRights);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ── Bot Move Selection ────────────────────────────────────────────────────────
function getBotMove(
  board: Board,
  color: Color,
  difficulty: BotDifficulty,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
): Move | null {
  const moves = getAllLegalMoves(board, color, enPassantTarget, castlingRights);
  if (moves.length === 0) return null;

  const isMax = color === 'white';

  switch (difficulty) {
    case 1: {
      // Novice: random move
      return moves[Math.floor(Math.random() * moves.length)];
    }
    case 2: {
      // Beginner: prefer captures, else random
      const captures = moves.filter(m => board[m.to[0]][m.to[1]] !== null);
      const pool = captures.length > 0 ? captures : moves;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    case 3: {
      // Easy: minimax depth 2
      let best = moves[0];
      let bestScore = isMax ? -Infinity : Infinity;
      for (const move of orderMoves(board, moves)) {
        const res = applyMove(board, move, enPassantTarget, castlingRights);
        const score = minimax(res.board, 1, -Infinity, Infinity, !isMax, res.newEnPassantTarget, res.newCastlingRights);
        if (isMax ? score > bestScore : score < bestScore) { bestScore = score; best = move; }
      }
      return best;
    }
    case 4: {
      // Medium: alpha-beta depth 3
      let best = moves[0];
      let bestScore = isMax ? -Infinity : Infinity;
      for (const move of orderMoves(board, moves)) {
        const res = applyMove(board, move, enPassantTarget, castlingRights);
        const score = minimax(res.board, 2, -Infinity, Infinity, !isMax, res.newEnPassantTarget, res.newCastlingRights);
        if (isMax ? score > bestScore : score < bestScore) { bestScore = score; best = move; }
      }
      return best;
    }
    case 5: {
      // Hard: alpha-beta depth 4 with move ordering
      let best = moves[0];
      let bestScore = isMax ? -Infinity : Infinity;
      let alpha = -Infinity;
      let beta = Infinity;
      for (const move of orderMoves(board, moves)) {
        const res = applyMove(board, move, enPassantTarget, castlingRights);
        const score = minimax(res.board, 3, alpha, beta, !isMax, res.newEnPassantTarget, res.newCastlingRights);
        if (isMax ? score > bestScore : score < bestScore) { bestScore = score; best = move; }
        if (isMax) alpha = Math.max(alpha, bestScore);
        else beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
      return best;
    }
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
function createInitialState(playerColor: Color = 'white', botDifficulty: BotDifficulty = 3): ChessState {
  return {
    board: makeInitialBoard(),
    currentTurn: 'white',
    selectedSquare: null,
    legalMovesForSelected: [],
    status: 'playing',
    winner: null,
    capturedByWhite: [],
    capturedByBlack: [],
    lastMove: null,
    promotionPending: null,
    moveHistory: [],
    enPassantTarget: null,
    castlingRights: { ...INITIAL_CASTLING },
    halfMoveClock: 0,
    fullMoveNumber: 1,
    botDifficulty,
    thinking: false,
    playerColor,
    gameOver: false,
  };
}

// After a move is applied, compute the new game status
function computeStatus(
  board: Board,
  nextTurn: Color,
  enPassantTarget: [number, number] | null,
  castlingRights: CastlingRights,
  halfMoveClock: number,
): GameStatus {
  if (halfMoveClock >= 100) return 'draw';

  const moves = getAllLegalMoves(board, nextTurn, enPassantTarget, castlingRights);
  if (moves.length === 0) {
    return isInCheck(board, nextTurn) ? 'checkmate' : 'stalemate';
  }
  return isInCheck(board, nextTurn) ? 'check' : 'playing';
}

function executeMove(state: ChessState, move: Move): ChessState {
  const { board, enPassantTarget, castlingRights, currentTurn, halfMoveClock, fullMoveNumber } = state;

  const res = applyMove(board, move, enPassantTarget, castlingRights);
  const piece = board[move.from[0]][move.from[1]]!;
  const isCapture = !!res.captured;
  const isPawnMove = piece.type === 'P';

  const newHalfMoveClock = (isCapture || isPawnMove) ? 0 : halfMoveClock + 1;
  const nextTurn = opponent(currentTurn);
  const newFullMoveNumber = currentTurn === 'black' ? fullMoveNumber + 1 : fullMoveNumber;

  const newStatus = computeStatus(res.board, nextTurn, res.newEnPassantTarget, res.newCastlingRights, newHalfMoveClock);

  const isCheck = newStatus === 'check' || newStatus === 'checkmate';
  const isMate = newStatus === 'checkmate';

  const notation = toAlgebraic(board, move, enPassantTarget, castlingRights, isCheck, isMate);

  const capturedByWhite = [...state.capturedByWhite];
  const capturedByBlack = [...state.capturedByBlack];
  if (res.captured) {
    if (currentTurn === 'white') capturedByWhite.push(res.captured);
    else capturedByBlack.push(res.captured);
  }

  const newMoveHistory = [...state.moveHistory, notation];

  const gameOver = newStatus === 'checkmate' || newStatus === 'stalemate' || newStatus === 'draw';
  const winner = newStatus === 'checkmate' ? currentTurn : null;

  return {
    ...state,
    board: res.board,
    currentTurn: nextTurn,
    selectedSquare: null,
    legalMovesForSelected: [],
    status: newStatus,
    winner,
    capturedByWhite,
    capturedByBlack,
    lastMove: move,
    promotionPending: null,
    moveHistory: newMoveHistory,
    enPassantTarget: res.newEnPassantTarget,
    castlingRights: res.newCastlingRights,
    halfMoveClock: newHalfMoveClock,
    fullMoveNumber: newFullMoveNumber,
    thinking: false,
    gameOver,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state: ChessState, action: Action): ChessState {
  switch (action.type) {
    case 'SELECT_SQUARE': {
      const { row, col } = action;

      // If there's a pending promotion, ignore board clicks
      if (state.promotionPending || state.gameOver || state.thinking) return state;

      // Only act on player's turn
      if (state.currentTurn !== state.playerColor) return state;

      const piece = state.board[row][col];

      // If a square is already selected
      if (state.selectedSquare) {
        const [sr, sc] = state.selectedSquare;

        // Check if this is a legal target
        const isLegal = state.legalMovesForSelected.some(([r, c]) => r === row && c === col);

        if (isLegal) {
          const movingPiece = state.board[sr][sc]!;
          // Check if pawn promotion
          if (movingPiece.type === 'P' && (row === 0 || row === 7)) {
            return { ...state, promotionPending: { from: [sr, sc], to: [row, col] } };
          }
          return executeMove(state, { from: [sr, sc], to: [row, col] });
        }

        // Click on own piece: re-select
        if (piece && piece.color === state.playerColor) {
          const legal = getLegalMoves(state.board, row, col, state.enPassantTarget, state.castlingRights);
          return { ...state, selectedSquare: [row, col], legalMovesForSelected: legal };
        }

        // Deselect
        return { ...state, selectedSquare: null, legalMovesForSelected: [] };
      }

      // Select own piece
      if (piece && piece.color === state.playerColor) {
        const legal = getLegalMoves(state.board, row, col, state.enPassantTarget, state.castlingRights);
        return { ...state, selectedSquare: [row, col], legalMovesForSelected: legal };
      }

      return state;
    }

    case 'PROMOTE': {
      if (!state.promotionPending) return state;
      const move: Move = { ...state.promotionPending, promotion: action.pieceType };
      return executeMove(state, move);
    }

    case 'BOT_MOVE': {
      return executeMove(state, action.move);
    }

    case 'SET_THINKING': {
      return { ...state, thinking: action.value };
    }

    case 'SET_BOT': {
      return { ...state, botDifficulty: action.difficulty };
    }

    case 'SET_PLAYER_COLOR': {
      return createInitialState(action.color, state.botDifficulty);
    }

    case 'NEW_GAME': {
      return createInitialState(state.playerColor, state.botDifficulty);
    }

    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChessGame() {
  const [state, dispatch] = useReducer(reducer, createInitialState());
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectSquare = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_SQUARE', row, col });
  }, []);

  const promote = useCallback((pieceType: PieceType) => {
    dispatch({ type: 'PROMOTE', pieceType });
  }, []);

  const setBot = useCallback((difficulty: BotDifficulty) => {
    dispatch({ type: 'SET_BOT', difficulty });
  }, []);

  const setPlayerColor = useCallback((color: Color) => {
    dispatch({ type: 'SET_PLAYER_COLOR', color });
  }, []);

  const newGame = useCallback(() => {
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    dispatch({ type: 'NEW_GAME' });
  }, []);

  // Trigger bot move when it's the bot's turn
  useEffect(() => {
    const isBotTurn = state.currentTurn !== state.playerColor;
    if (!isBotTurn || state.gameOver || state.thinking || state.promotionPending) return;

    dispatch({ type: 'SET_THINKING', value: true });

    botTimerRef.current = setTimeout(() => {
      const move = getBotMove(
        state.board,
        state.currentTurn,
        state.botDifficulty,
        state.enPassantTarget,
        state.castlingRights,
      );
      if (move) {
        dispatch({ type: 'BOT_MOVE', move });
      } else {
        dispatch({ type: 'SET_THINKING', value: false });
      }
    }, 150); // small delay so "thinking" indicator is visible

    return () => {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTurn, state.playerColor, state.gameOver]);

  return { state, selectSquare, promote, setBot, setPlayerColor, newGame };
}
