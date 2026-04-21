import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import './BreakoutGame.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = CANVAS_HEIGHT - 40;
const PADDLE_SPEED = 7;

const BALL_RADIUS = 8;
const BALL_SPEED_INITIAL = 4;
// Paddle reflection: hit position (0–1) is mapped to ±(MAX_PADDLE_ANGLE_FACTOR × π/2),
// giving roughly ±60° maximum reflection angle.
const MAX_PADDLE_ANGLE_FACTOR = 0.65;

const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 68;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 6;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 26;

const BRICK_COLORS = ['#ff4757', '#ff6b35', '#ffa502', '#2ed573', '#1e90ff'];
const BRICK_POINTS = [50, 40, 30, 20, 10];

const LIVES_INITIAL = 3;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brick {
  x: number;
  y: number;
  alive: boolean;
  row: number;
}

interface GameState {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  bricks: Brick[];
  score: number;
  lives: number;
  started: boolean;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
        row: r,
      });
    }
  }
  return bricks;
}

function initialState(): GameState {
  return {
    paddleX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: PADDLE_Y - BALL_RADIUS - 1,
    ballVx: BALL_SPEED_INITIAL,
    ballVy: -BALL_SPEED_INITIAL,
    bricks: buildBricks(),
    score: 0,
    lives: LIVES_INITIAL,
    started: false,
    gameOver: false,
    won: false,
    paused: false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BreakoutGame() {
  const navigate = useNavigate();
  const { isLoggedIn, username, token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initialState());
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const animFrameRef = useRef<number>(0);
  const scoreSubmittedRef = useRef(false);
  // Keep latest auth values in a ref so the memoised game-loop step() can access them
  // without being recreated (which would restart the animation loop).
  const authRef = useRef({ isLoggedIn, username, token });
  useEffect(() => {
    authRef.current = { isLoggedIn, username, token };
  }, [isLoggedIn, username, token]);

  const [displayState, setDisplayState] = useState({
    score: 0,
    lives: LIVES_INITIAL,
    started: false,
    gameOver: false,
    won: false,
    paused: false,
  });

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, gs: GameState) => {
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bricks
    gs.bricks.forEach((brick) => {
      if (!brick.alive) return;
      const color = BRICK_COLORS[brick.row % BRICK_COLORS.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
      ctx.fill();
      // Gloss highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.roundRect(brick.x + 3, brick.y + 3, BRICK_WIDTH - 6, 6, 3);
      ctx.fill();
    });

    // Paddle
    const grad = ctx.createLinearGradient(gs.paddleX, 0, gs.paddleX + PADDLE_WIDTH, 0);
    grad.addColorStop(0, '#00c8c8');
    grad.addColorStop(1, '#00f0f0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(gs.paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(gs.ballX, gs.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = 'rgba(0,240,240,0.5)';
    ctx.beginPath();
    ctx.arc(gs.ballX - 2, gs.ballY - 2, BALL_RADIUS / 2.5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // ── Game loop step ──────────────────────────────────────────────────────────
  const step = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started || gs.gameOver || gs.won || gs.paused) return;

    // Submit score via ref so we don't need auth values in the dependency array
    const trySubmitScore = (score: number) => {
      const { isLoggedIn: li, username: un, token: tk } = authRef.current;
      if (score > 0 && li && un && tk && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        submitScore({ game_id: 'breakout', player_name: un, score, lines_cleared: 0, level: 1 }, tk).catch(() => {});
      }
    };

    // Paddle movement (keyboard)
    if (keysRef.current.left) gs.paddleX = Math.max(0, gs.paddleX - PADDLE_SPEED);
    if (keysRef.current.right) gs.paddleX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, gs.paddleX + PADDLE_SPEED);

    // Ball movement
    gs.ballX += gs.ballVx;
    gs.ballY += gs.ballVy;

    // Wall collisions (left / right)
    if (gs.ballX - BALL_RADIUS <= 0) {
      gs.ballX = BALL_RADIUS;
      gs.ballVx = Math.abs(gs.ballVx);
    } else if (gs.ballX + BALL_RADIUS >= CANVAS_WIDTH) {
      gs.ballX = CANVAS_WIDTH - BALL_RADIUS;
      gs.ballVx = -Math.abs(gs.ballVx);
    }

    // Top wall
    if (gs.ballY - BALL_RADIUS <= 0) {
      gs.ballY = BALL_RADIUS;
      gs.ballVy = Math.abs(gs.ballVy);
    }

    // Paddle collision
    if (
      gs.ballY + BALL_RADIUS >= PADDLE_Y &&
      gs.ballY + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
      gs.ballX >= gs.paddleX - BALL_RADIUS &&
      gs.ballX <= gs.paddleX + PADDLE_WIDTH + BALL_RADIUS
    ) {
      gs.ballY = PADDLE_Y - BALL_RADIUS;
      // Reflect & apply angle based on hit position
      const hitPos = (gs.ballX - gs.paddleX) / PADDLE_WIDTH; // 0..1
      const angle = (hitPos - 0.5) * (Math.PI * MAX_PADDLE_ANGLE_FACTOR);
      const speed = Math.sqrt(gs.ballVx ** 2 + gs.ballVy ** 2);
      gs.ballVx = speed * Math.sin(angle);
      gs.ballVy = -Math.abs(speed * Math.cos(angle));
    }

    // Ball fell below paddle
    if (gs.ballY - BALL_RADIUS > CANVAS_HEIGHT) {
      gs.lives -= 1;
      if (gs.lives <= 0) {
        gs.gameOver = true;
        trySubmitScore(gs.score);
      } else {
        // Reset ball on paddle
        gs.ballX = gs.paddleX + PADDLE_WIDTH / 2;
        gs.ballY = PADDLE_Y - BALL_RADIUS - 1;
        gs.ballVx = BALL_SPEED_INITIAL * (Math.random() > 0.5 ? 1 : -1); // randomise left/right after losing a life
        gs.ballVy = -BALL_SPEED_INITIAL;
        gs.started = false; // wait for spacebar
      }
      setDisplayState((d) => ({ ...d, lives: gs.lives, gameOver: gs.gameOver, started: gs.started }));
    }

    // Brick collisions
    for (const brick of gs.bricks) {
      if (!brick.alive) continue;
      const bRight = brick.x + BRICK_WIDTH;
      const bBottom = brick.y + BRICK_HEIGHT;

      if (
        gs.ballX + BALL_RADIUS > brick.x &&
        gs.ballX - BALL_RADIUS < bRight &&
        gs.ballY + BALL_RADIUS > brick.y &&
        gs.ballY - BALL_RADIUS < bBottom
      ) {
        brick.alive = false;
        gs.score += BRICK_POINTS[brick.row % BRICK_POINTS.length];

        // Determine which side was hit
        const overlapLeft = gs.ballX + BALL_RADIUS - brick.x;
        const overlapRight = bRight - (gs.ballX - BALL_RADIUS);
        const overlapTop = gs.ballY + BALL_RADIUS - brick.y;
        const overlapBottom = bBottom - (gs.ballY - BALL_RADIUS);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          gs.ballVx = -gs.ballVx;
        } else {
          gs.ballVy = -gs.ballVy;
        }

        setDisplayState((d) => ({ ...d, score: gs.score }));
        break; // one brick per frame
      }
    }

    // Win condition
    if (gs.bricks.every((b) => !b.alive)) {
      gs.won = true;
      trySubmitScore(gs.score);
      setDisplayState((d) => ({ ...d, won: true }));
    }
  }, []);

  // ── Animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      step();
      draw(ctx, stateRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [step, draw]);

  // ── Keyboard controls ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gs = stateRef.current;
      if (e.key === 'ArrowLeft') { e.preventDefault(); keysRef.current.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); keysRef.current.right = true; }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!gs.started && !gs.gameOver && !gs.won) {
          gs.started = true;
          setDisplayState((d) => ({ ...d, started: true }));
        }
      }
      if ((e.key === 'p' || e.key === 'P') && gs.started && !gs.gameOver && !gs.won) {
        gs.paused = !gs.paused;
        setDisplayState((d) => ({ ...d, paused: gs.paused }));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Mouse / touch control ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    stateRef.current.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, mx - PADDLE_WIDTH / 2));
  }, []);

  const handleCanvasClick = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started && !gs.gameOver && !gs.won) {
      gs.started = true;
      setDisplayState((d) => ({ ...d, started: true }));
    }
  }, []);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initialState();
    scoreSubmittedRef.current = false;
    setDisplayState({ score: 0, lives: LIVES_INITIAL, started: false, gameOver: false, won: false, paused: false });
  }, []);

  return (
    <div className="breakout-page">
      <button className="breakout-back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>

      <header className="breakout-header">
        <h1 className="breakout-title">BREAKOUT</h1>
      </header>

      <div className="breakout-hud">
        <div className="breakout-hud-item">
          <span className="breakout-hud-label">Score</span>
          <span className="breakout-hud-value">{displayState.score}</span>
        </div>
        <div className="breakout-hud-item">
          <span className="breakout-hud-label">Lives</span>
          <span className="breakout-hud-value">{'❤️'.repeat(displayState.lives)}</span>
        </div>
      </div>

      <div className="breakout-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="breakout-canvas"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
        />

        {!displayState.started && !displayState.gameOver && !displayState.won && (
          <div className="breakout-overlay">
            <span className="breakout-overlay-title">BREAKOUT</span>
            <p className="breakout-overlay-sub">
              Use <kbd>←</kbd> <kbd>→</kbd> or mouse to move paddle
            </p>
            <p className="breakout-overlay-sub">Press <kbd>Space</kbd> or click to start</p>
            <button className="breakout-btn" onClick={handleCanvasClick}>Start Game</button>
          </div>
        )}

        {displayState.paused && !displayState.gameOver && !displayState.won && (
          <div className="breakout-overlay">
            <span className="breakout-overlay-title">PAUSED</span>
            <p className="breakout-overlay-sub">Press <kbd>P</kbd> to resume</p>
          </div>
        )}

        {displayState.gameOver && (
          <div className="breakout-overlay breakout-overlay--gameover">
            <span className="breakout-overlay-title">GAME OVER</span>
            <p className="breakout-overlay-sub">Final Score: {displayState.score}</p>
            <button className="breakout-btn" onClick={handleRestart}>Play Again</button>
          </div>
        )}

        {displayState.won && (
          <div className="breakout-overlay breakout-overlay--win">
            <span className="breakout-overlay-title">YOU WIN! 🎉</span>
            <p className="breakout-overlay-sub">Score: {displayState.score}</p>
            <button className="breakout-btn" onClick={handleRestart}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
