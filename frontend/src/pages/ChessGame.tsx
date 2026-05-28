import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import { useChessGame } from '../hooks/useChessGame';
import type { PieceType, Color, BotDifficulty } from '../hooks/useChessGame';
import GameInfoButton from '../components/GameInfoButton';
import './ChessGame.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const PIECE_SYMBOLS: Record<string, string> = {
  'white-K': '♚', 'white-Q': '♛', 'white-R': '♜',
  'white-B': '♝', 'white-N': '♞', 'white-P': '♟',
  'black-K': '♚', 'black-Q': '♛', 'black-R': '♜',
  'black-B': '♝', 'black-N': '♞', 'black-P': '♟',
};

const BOT_NAMES: Record<BotDifficulty, string> = {
  1: 'Novice Nina',
  2: 'Beginner Bob',
  3: 'Easy Eddie',
  4: 'Medium Max',
  5: 'Hard Harry',
};

const BOT_ELO: Record<BotDifficulty, number> = {
  1: 800,
  2: 1000,
  3: 1200,
  4: 1400,
  5: 1600,
};

const BOT_STARS: Record<BotDifficulty, string> = {
  1: '★☆☆☆☆',
  2: '★★☆☆☆',
  3: '★★★☆☆',
  4: '★★★★☆',
  5: '★★★★★',
};

const PIECE_ORDER: PieceType[] = ['Q', 'R', 'B', 'N', 'P'];

function sortCaptured(pieces: { type: PieceType; color: Color }[]) {
  return [...pieces].sort((a, b) => PIECE_ORDER.indexOf(a.type) - PIECE_ORDER.indexOf(b.type));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChessGame() {
  const navigate = useNavigate();
  const { isLoggedIn, username, token } = useAuth();
  const { state, selectSquare, promote, setBot, setPlayerColor, newGame } = useChessGame();

  const {
    board, currentTurn, selectedSquare, legalMovesForSelected,
    status, winner, capturedByWhite, capturedByBlack,
    lastMove, promotionPending, moveHistory, thinking,
    botDifficulty, playerColor, gameOver,
  } = state;

  // Submit score when game ends
  const handleGameEnd = useCallback(async () => {
    if (!isLoggedIn || !username || !token) return;
    let score = 0;
    if (winner === playerColor) score = 100;
    else if (status === 'stalemate' || status === 'draw') score = 50;
    if (score > 0) {
      await submitScore({ game_id: 'chess', player_name: username, score, lines_cleared: 0, level: botDifficulty }, token).catch(() => {});
    }
  }, [isLoggedIn, username, token, winner, playerColor, status, botDifficulty]);

  const scoreSubmittedRef = useRef(false);
  useEffect(() => {
    if (!gameOver) { scoreSubmittedRef.current = false; return; }
    if (scoreSubmittedRef.current) return;
    scoreSubmittedRef.current = true;
    void handleGameEnd();
  }, [gameOver, handleGameEnd]);

  // Board rendering: always white at bottom (rows 0–7 top-to-bottom)
  // If player plays black, flip board so black is at bottom
  const displayRows = playerColor === 'black'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = playerColor === 'black'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  const handleSquareClick = (row: number, col: number) => {
    if (!gameOver && !promotionPending) {
      selectSquare(row, col);
    }
  };

  const isSelected = (r: number, c: number) =>
    selectedSquare !== null && selectedSquare[0] === r && selectedSquare[1] === c;

  const isLegalTarget = (r: number, c: number) =>
    legalMovesForSelected.some(([lr, lc]) => lr === r && lc === c);

  const isLastMove = (r: number, c: number) =>
    lastMove !== null &&
    ((lastMove.from[0] === r && lastMove.from[1] === c) ||
     (lastMove.to[0] === r && lastMove.to[1] === c));

  const isKingInCheck = (r: number, c: number): boolean => {
    if (status !== 'check' && status !== 'checkmate') return false;
    const piece = board[r][c];
    return piece?.type === 'K' && piece.color === currentTurn;
  };

  const statusMessage = () => {
    if (thinking) return `${BOT_NAMES[botDifficulty]} is thinking…`;
    if (status === 'checkmate') return winner === playerColor ? '🏆 You win by checkmate!' : `Checkmate! ${BOT_NAMES[botDifficulty]} wins.`;
    if (status === 'stalemate') return '½ Stalemate — draw!';
    if (status === 'draw') return '½ Draw by 50-move rule!';
    if (status === 'check') return currentTurn === playerColor ? '⚠️ You are in check!' : `⚠️ ${BOT_NAMES[botDifficulty]} is in check!`;
    return currentTurn === playerColor ? 'Your turn' : `${BOT_NAMES[botDifficulty]}'s turn`;
  };

  const promotionPieces: PieceType[] = ['Q', 'R', 'B', 'N'];

  return (
    <div className="chess-page">
      <div className="chess-topbar">
        <button className="chess-back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="chess-title">
          Chess
          <GameInfoButton gameId="chess" />
        </h1>
        <button className="chess-new-btn" onClick={newGame}>New Game</button>
      </div>

      <div className="chess-layout">
        {/* Left sidebar */}
        <aside className="chess-sidebar chess-sidebar-left">
          <div className="chess-panel">
            <div className="chess-panel-label">Play as</div>
            <div className="chess-color-btns">
              {(['white', 'black'] as Color[]).map(c => (
                <button
                  key={c}
                  className={`chess-color-btn ${playerColor === c ? 'active' : ''}`}
                  onClick={() => setPlayerColor(c)}
                >
                  {c === 'white' ? '♔ White' : '♚ Black'}
                </button>
              ))}
            </div>
          </div>

          <div className="chess-panel">
            <div className="chess-panel-label">Opponent</div>
            {([1, 2, 3, 4, 5] as BotDifficulty[]).map(d => (
              <button
                key={d}
                className={`chess-bot-btn ${botDifficulty === d ? 'active' : ''}`}
                onClick={() => setBot(d)}
              >
                <span className="chess-bot-name">{BOT_NAMES[d]} ({BOT_ELO[d]} Elo)</span>
                <span className="chess-bot-stars">{BOT_STARS[d]}</span>
              </button>
            ))}
          </div>

          <div className="chess-panel chess-captures-panel">
            <div className="chess-panel-label">Captured by you</div>
            <div className="chess-captures">
              {sortCaptured(playerColor === 'white' ? capturedByWhite : capturedByBlack).map((p, i) => (
                <span key={i} className={`chess-captured-piece ${p.color}`}>
                  {PIECE_SYMBOLS[`${p.color}-${p.type}`]}
                </span>
              ))}
            </div>
            <div className="chess-panel-label" style={{ marginTop: 8 }}>Captured by bot</div>
            <div className="chess-captures">
              {sortCaptured(playerColor === 'white' ? capturedByBlack : capturedByWhite).map((p, i) => (
                <span key={i} className={`chess-captured-piece ${p.color}`}>
                  {PIECE_SYMBOLS[`${p.color}-${p.type}`]}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Board */}
        <div className="chess-board-wrapper">
          <div className="chess-status-bar">
            <span className={`chess-status-text ${gameOver ? 'chess-status-end' : ''}`}>
              {statusMessage()}
            </span>
          </div>

          <div className="chess-board-outer">
            {/* Rank labels (left side) */}
            <div className="chess-rank-labels">
              {displayRows.map(r => (
                <div key={r} className="chess-rank-label">{8 - r}</div>
              ))}
            </div>

            <div className="chess-board">
              {displayRows.map(r =>
                displayCols.map(c => {
                  const piece = board[r][c];
                  const isLight = (r + c) % 2 === 0;
                  const selected = isSelected(r, c);
                  const legalTarget = isLegalTarget(r, c);
                  const lastMoveSq = isLastMove(r, c);
                  const inCheck = isKingInCheck(r, c);
                  const hasPiece = piece !== null;

                  let squareClass = `chess-square ${isLight ? 'light' : 'dark'}`;
                  if (selected) squareClass += ' selected';
                  if (lastMoveSq) squareClass += ' last-move';
                  if (inCheck) squareClass += ' in-check';

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={squareClass}
                      onClick={() => handleSquareClick(r, c)}
                    >
                      {piece && (
                        <span
                          className={`chess-piece ${piece.color} ${
                            thinking && piece.color !== playerColor ? 'thinking' : ''
                          }`}
                        >
                          {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                        </span>
                      )}
                      {legalTarget && (
                        <div className={`chess-move-dot ${hasPiece ? 'capture-ring' : ''}`} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* File labels (bottom) */}
            <div className="chess-file-labels-spacer" />
          </div>
          <div className="chess-file-labels">
            {displayCols.map(c => (
              <div key={c} className="chess-file-label">{'abcdefgh'[c]}</div>
            ))}
          </div>
        </div>

        {/* Right sidebar: move history */}
        <aside className="chess-sidebar chess-sidebar-right">
          <div className="chess-panel chess-history-panel">
            <div className="chess-panel-label">Move History</div>
            <div className="chess-history">
              {moveHistory.length === 0 ? (
                <div className="chess-history-empty">No moves yet</div>
              ) : (
                <ol className="chess-history-list">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                    <li key={i} className="chess-history-item">
                      <span className="chess-history-num">{i + 1}.</span>
                      <span className="chess-history-white">{moveHistory[i * 2]}</span>
                      <span className="chess-history-black">{moveHistory[i * 2 + 1] ?? ''}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Promotion Dialog */}
      {promotionPending && (
        <div className="chess-overlay">
          <div className="chess-promotion-dialog">
            <div className="chess-promotion-title">Choose promotion piece</div>
            <div className="chess-promotion-pieces">
              {promotionPieces.map(pt => (
                <button
                  key={pt}
                  className={`chess-promotion-btn ${playerColor}`}
                  onClick={() => promote(pt)}
                >
                  {PIECE_SYMBOLS[`${playerColor}-${pt}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameOver && !promotionPending && (
        <div className="chess-overlay">
          <div className="chess-gameover-dialog">
            <div className="chess-gameover-title">
              {status === 'checkmate' && winner === playerColor && '🏆 You Win!'}
              {status === 'checkmate' && winner !== playerColor && 'You Lose'}
              {(status === 'stalemate' || status === 'draw') && '🤝 Draw'}
            </div>
            <div className="chess-gameover-subtitle">{statusMessage()}</div>
            <button className="chess-gameover-btn" onClick={newGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
