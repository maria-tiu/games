import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import GameInstructionsModal from '../components/GameInstructionsModal';
import { useGameSound } from '../hooks/useGameSound';
import './MarioGame.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 500;

const MARIO_W = 28;
const MARIO_H = 36;
const GRAVITY = 0.55;
const JUMP_FORCE = -13;
const MOVE_SPD = 4;
const ENEMY_SPD = 1.5;
const LIVES_INIT = 3;
const COIN_RADIUS = 10;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Platform { x: number; y: number; w: number; h: number }
interface Coin { x: number; y: number; collected: boolean }
interface Enemy {
  x: number; y: number; w: number; h: number;
  vx: number; alive: boolean;
  patrolLeft: number; patrolRight: number;
}

interface GameState {
  mx: number; my: number;
  mvx: number; mvy: number;
  onGround: boolean;
  facingRight: boolean;
  invincible: number;
  coins: Coin[];
  enemies: Enemy[];
  score: number;
  lives: number;
  started: boolean;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}

// ── Level data ─────────────────────────────────────────────────────────────────
const PLATFORMS: Platform[] = [
  { x: 0, y: 450, w: 800, h: 50 },       // Ground
  { x: 80, y: 342, w: 130, h: 18 },      // Platform A
  { x: 260, y: 278, w: 110, h: 18 },     // Platform B
  { x: 420, y: 337, w: 140, h: 18 },     // Platform C
  { x: 600, y: 257, w: 120, h: 18 },     // Platform D
  { x: 695, y: 157, w: 85, h: 18 },      // Platform E (top right)
  { x: 185, y: 192, w: 100, h: 18 },     // Platform F (upper left)
];

function makeCoins(): Coin[] {
  return [
    { x: 115, y: 312, collected: false },
    { x: 145, y: 312, collected: false },
    { x: 175, y: 312, collected: false },
    { x: 285, y: 248, collected: false },
    { x: 315, y: 248, collected: false },
    { x: 450, y: 307, collected: false },
    { x: 480, y: 307, collected: false },
    { x: 510, y: 307, collected: false },
    { x: 625, y: 227, collected: false },
    { x: 655, y: 227, collected: false },
    { x: 715, y: 127, collected: false },
    { x: 745, y: 127, collected: false },
    { x: 210, y: 162, collected: false },
    { x: 240, y: 162, collected: false },
    { x: 375, y: 418, collected: false },
    { x: 415, y: 418, collected: false },
  ];
}

function makeEnemies(): Enemy[] {
  return [
    { x: 300, y: 414, w: 28, h: 28, vx: ENEMY_SPD, alive: true, patrolLeft: 190, patrolRight: 440 },
    { x: 90,  y: 306, w: 28, h: 28, vx: ENEMY_SPD, alive: true, patrolLeft: 80,  patrolRight: 210 },
    { x: 430, y: 301, w: 28, h: 28, vx: ENEMY_SPD, alive: true, patrolLeft: 420, patrolRight: 560 },
    { x: 610, y: 221, w: 28, h: 28, vx: ENEMY_SPD, alive: true, patrolLeft: 600, patrolRight: 720 },
  ];
}

const INITIAL_COINS_COUNT = makeCoins().length;

function initState(): GameState {
  return {
    mx: 50, my: 414,
    mvx: 0, mvy: 0,
    onGround: false,
    facingRight: true,
    invincible: 0,
    coins: makeCoins(),
    enemies: makeEnemies(),
    score: 0,
    lives: LIVES_INIT,
    started: false,
    gameOver: false,
    won: false,
    paused: false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MarioGame() {
  const navigate = useNavigate();
  const { isLoggedIn, username, token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState());
  const keysRef = useRef({ left: false, right: false, jump: false });
  const animFrameRef = useRef<number>(0);
  const scoreSubmittedRef = useRef(false);
  const scorePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const authRef = useRef({ isLoggedIn, username, token });
  useEffect(() => { authRef.current = { isLoggedIn, username, token }; }, [isLoggedIn, username, token]);

  const { startMusic, stopMusic, playJump, playCoinCollect, playStomp, playGameOver, playWin: playSoundWin } = useGameSound('mario');
  const soundRef = useRef({ playJump, playCoinCollect, playStomp, playGameOver, playWin: playSoundWin, startMusic, stopMusic });
  useEffect(() => {
    soundRef.current = { playJump, playCoinCollect, playStomp, playGameOver, playWin: playSoundWin, startMusic, stopMusic };
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const [displayState, setDisplayState] = useState({
    score: 0,
    lives: LIVES_INIT,
    started: false,
    gameOver: false,
    won: false,
    paused: false,
    coinsLeft: INITIAL_COINS_COUNT,
  });

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, gs: GameState) => {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#4a90d9');
    sky.addColorStop(1, '#87ceeb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Clouds
    const drawCloud = (cx: number, cy: number) => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 8, 18, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(80, 70);
    drawCloud(320, 55);
    drawCloud(570, 80);
    drawCloud(720, 45);

    // Platforms
    PLATFORMS.forEach((p, i) => {
      if (i === 0) {
        // Ground: green top + brown body
        ctx.fillStyle = '#5aad4e';
        ctx.fillRect(p.x, p.y, p.w, 12);
        ctx.fillStyle = '#7B5120';
        ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
      } else {
        // Brick platforms
        ctx.fillStyle = '#c8822a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#e09840';
        ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.fillStyle = '#a06020';
        for (let bx = p.x; bx < p.x + p.w; bx += 32) {
          ctx.fillRect(bx, p.y, 2, p.h);
        }
        ctx.fillRect(p.x, p.y + Math.floor(p.h / 2), p.w, 2);
      }
    });

    // Coins
    gs.coins.forEach((c) => {
      if (c.collected) return;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, COIN_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Shine highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(c.x - 3, c.y - 3, COIN_RADIUS * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1;
    });

    // Enemies (Goomba-style)
    gs.enemies.forEach((e) => {
      if (!e.alive) return;
      // Body
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(e.x + 4, e.y + Math.floor(e.h / 2) - 2, e.w - 8, Math.floor(e.h / 2) + 8);
      // Cap
      ctx.fillStyle = '#5a2e00';
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2 - 1, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 4, e.y + Math.floor(e.h / 2) - 6, 6, 6);
      ctx.fillRect(e.x + e.w - 10, e.y + Math.floor(e.h / 2) - 6, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 5, e.y + Math.floor(e.h / 2) - 5, 3, 3);
      ctx.fillRect(e.x + e.w - 9, e.y + Math.floor(e.h / 2) - 5, 3, 3);
      // Feet
      ctx.fillStyle = '#3a1800';
      ctx.fillRect(e.x + 1, e.y + e.h - 6, 10, 6);
      ctx.fillRect(e.x + e.w - 11, e.y + e.h - 6, 10, 6);
    });

    // Mario
    const { mx, my, facingRight, invincible } = gs;
    ctx.globalAlpha = invincible > 0 ? (Math.floor(invincible / 4) % 2 === 0 ? 0.3 : 1) : 1;
    ctx.save();
    if (!facingRight) {
      ctx.translate(mx + MARIO_W, 0);
      ctx.scale(-1, 1);
      ctx.translate(-mx, 0);
    }
    // Hat
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(mx + 4, my, 20, 8);
    ctx.fillRect(mx + 2, my + 6, 24, 6);
    // Face
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(mx + 4, my + 12, 20, 10);
    // Mustache
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(mx + 8, my + 18, 13, 4);
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(mx + 16, my + 13, 4, 4);
    // Overalls bib
    ctx.fillStyle = '#2244cc';
    ctx.fillRect(mx + 4, my + 22, 20, 4);
    // Body
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(mx + 2, my + 26, 24, 10);
    // Overall pocket
    ctx.fillStyle = '#2244cc';
    ctx.fillRect(mx + 8, my + 26, 12, 8);
    // Shoes
    ctx.fillStyle = '#4a2000';
    ctx.fillRect(mx, my + 30, 12, 6);
    ctx.fillRect(mx + 16, my + 30, 12, 6);
    ctx.restore();
    ctx.globalAlpha = 1;
  }, []);

  // ── Game step ─────────────────────────────────────────────────────────────────
  const step = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started || gs.gameOver || gs.won || gs.paused) return;

    const trySubmitScore = (score: number) => {
      const { isLoggedIn: li, username: un, token: tok } = authRef.current;
      if (score > 0 && li && un && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        scorePromiseRef.current = submitScore(
          { game_id: 'mario', player_name: un, score, lines_cleared: 0, level: 1 },
          tok ?? undefined,
        ).then(() => undefined).catch(() => undefined);
      }
    };

    // ── Mario horizontal movement ─────────────────────────────────────────────
    if (keysRef.current.left) {
      gs.mvx = -MOVE_SPD;
      gs.facingRight = false;
    } else if (keysRef.current.right) {
      gs.mvx = MOVE_SPD;
      gs.facingRight = true;
    } else {
      gs.mvx *= 0.7;
      if (Math.abs(gs.mvx) < 0.1) gs.mvx = 0;
    }

    // Jump (only when on ground)
    if (keysRef.current.jump && gs.onGround) {
      gs.mvy = JUMP_FORCE;
      gs.onGround = false;
      soundRef.current.playJump();
    }

    // Gravity
    gs.mvy = Math.min(gs.mvy + GRAVITY, 16);

    // Apply velocity
    gs.mx += gs.mvx;
    gs.my += gs.mvy;

    // Horizontal bounds
    if (gs.mx < 0) {
      gs.mx = 0;
      gs.mvx = 0;
    }
    if (gs.mx + MARIO_W > CANVAS_W) {
      gs.mx = CANVAS_W - MARIO_W;
      gs.mvx = 0;
    }

    // ── Platform collision (one-way: land from top) ───────────────────────────
    gs.onGround = false;
    const prevBottom = gs.my + MARIO_H - gs.mvy;
    for (const p of PLATFORMS) {
      if (
        gs.mx + MARIO_W > p.x + 2 &&
        gs.mx < p.x + p.w - 2 &&
        gs.my + MARIO_H >= p.y &&
        prevBottom <= p.y + 4 &&
        gs.mvy >= 0
      ) {
        gs.my = p.y - MARIO_H;
        gs.mvy = 0;
        gs.onGround = true;
        break;
      }
    }

    // ── Fall off screen → lose life ───────────────────────────────────────────
    if (gs.my > CANVAS_H + 20) {
      gs.lives--;
      if (gs.lives <= 0) {
        gs.gameOver = true;
        trySubmitScore(gs.score);
        soundRef.current.playGameOver();
        soundRef.current.stopMusic();
        setDisplayState((d) => ({ ...d, lives: 0, gameOver: true }));
      } else {
        gs.mx = 50;
        gs.my = 414;
        gs.mvx = 0;
        gs.mvy = 0;
        gs.onGround = false;
        gs.invincible = 120;
        gs.started = false;
        setDisplayState((d) => ({ ...d, lives: gs.lives, started: false }));
      }
      return;
    }

    // ── Coin collection ───────────────────────────────────────────────────────
    let coinCollected = false;
    for (const c of gs.coins) {
      if (c.collected) continue;
      const dx = gs.mx + MARIO_W / 2 - c.x;
      const dy = gs.my + MARIO_H / 2 - c.y;
      if (Math.abs(dx) < MARIO_W / 2 + 8 && Math.abs(dy) < MARIO_H / 2 + 8) {
        c.collected = true;
        gs.score += 100;
        coinCollected = true;
        soundRef.current.playCoinCollect();
      }
    }

    if (coinCollected) {
      const coinsLeft = gs.coins.filter((c) => !c.collected).length;
      if (coinsLeft === 0) {
        gs.won = true;
        trySubmitScore(gs.score);
        soundRef.current.playWin();
        soundRef.current.stopMusic();
        setDisplayState((d) => ({ ...d, score: gs.score, won: true, coinsLeft: 0 }));
        return;
      }
      setDisplayState((d) => ({ ...d, score: gs.score, coinsLeft }));
    }

    // ── Enemy AI & collision ──────────────────────────────────────────────────
    if (gs.invincible > 0) gs.invincible--;

    for (const e of gs.enemies) {
      if (!e.alive) continue;

      // Patrol
      e.x += e.vx;
      if (e.x <= e.patrolLeft) {
        e.x = e.patrolLeft;
        e.vx = ENEMY_SPD;
      } else if (e.x + e.w >= e.patrolRight) {
        e.x = e.patrolRight - e.w;
        e.vx = -ENEMY_SPD;
      }

      // AABB overlap with Mario
      if (
        gs.mx + MARIO_W > e.x + 2 &&
        gs.mx < e.x + e.w - 2 &&
        gs.my + MARIO_H > e.y + 2 &&
        gs.my < e.y + e.h - 2
      ) {
        // Stomp: Mario was above the enemy top last frame and is now falling onto it
        const prevMarioBottom = gs.my + MARIO_H - gs.mvy;
        if (prevMarioBottom <= e.y + 10 && gs.mvy > 0) {
          e.alive = false;
          gs.mvy = -9;
          gs.score += 200;
          soundRef.current.playStomp();
          setDisplayState((d) => ({ ...d, score: gs.score }));
        } else if (gs.invincible === 0) {
          // Side/bottom collision → lose life
          gs.lives--;
          if (gs.lives <= 0) {
            gs.gameOver = true;
            trySubmitScore(gs.score);
            soundRef.current.playGameOver();
            soundRef.current.stopMusic();
            setDisplayState((d) => ({ ...d, lives: 0, gameOver: true }));
          } else {
            gs.mx = 50;
            gs.my = 414;
            gs.mvx = 0;
            gs.mvy = 0;
            gs.onGround = false;
            gs.invincible = 120;
            gs.started = false;
            setDisplayState((d) => ({ ...d, lives: gs.lives, started: false }));
          }
          return;
        }
      }
    }
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────────
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

  // ── Keyboard controls ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gs = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        keysRef.current.jump = true;
        if (!gs.started && !gs.gameOver && !gs.won) {
          gs.started = true;
          soundRef.current.startMusic();
          setDisplayState((d) => ({ ...d, started: true }));
        }
      }
      if ((e.key === 'p' || e.key === 'P') && gs.started && !gs.gameOver && !gs.won) {
        gs.paused = !gs.paused;
        setDisplayState((d) => ({ ...d, paused: gs.paused }));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.jump = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Restart ───────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stopMusic();
    stateRef.current = initState();
    scoreSubmittedRef.current = false;
    scorePromiseRef.current = Promise.resolve();
    setDisplayState({
      score: 0,
      lives: LIVES_INIT,
      started: false,
      gameOver: false,
      won: false,
      paused: false,
      coinsLeft: INITIAL_COINS_COUNT,
    });
  }, [stopMusic]);

  // ── Back navigation ───────────────────────────────────────────────────────────
  const handleBack = useCallback(async () => {
    await scorePromiseRef.current;
    navigate('/');
  }, [navigate]);

  // ── Start via button ──────────────────────────────────────────────────────────
  const handleStartClick = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started && !gs.gameOver && !gs.won) {
      gs.started = true;
      soundRef.current.startMusic();
      setDisplayState((d) => ({ ...d, started: true }));
    }
  }, []);

  return (
    <div className="mario-page">
      <div className="mario-top-bar">
        <button className="mario-back-btn" onClick={() => void handleBack()}>← Back to Dashboard</button>

        <button
          className="btn-info mario-info-btn"
          onClick={() => setShowInstructions(true)}
          title="How to play Mario"
          aria-label="How to play Mario"
        >?</button>
      </div>

      <header className="mario-header">
        <h1 className="mario-title">MARIO</h1>
      </header>

      <div className="mario-hud">
        <div className="mario-hud-item">
          <span className="mario-hud-label">Score</span>
          <span className="mario-hud-value">{displayState.score}</span>
        </div>
        <div className="mario-hud-item">
          <span className="mario-hud-label">Lives</span>
          <span className="mario-hud-value">{'❤️'.repeat(Math.max(0, displayState.lives))}</span>
        </div>
        <div className="mario-hud-item">
          <span className="mario-hud-label">Coins</span>
          <span className="mario-hud-value">🪙 {displayState.coinsLeft}</span>
        </div>
      </div>

      <div className="mario-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="mario-canvas"
        />

        {!displayState.started && !displayState.gameOver && !displayState.won && (
          <div className="mario-overlay">
            <span className="mario-overlay-title">MARIO</span>
            <p className="mario-overlay-sub">Collect all {INITIAL_COINS_COUNT} coins to win!</p>
            <p className="mario-overlay-sub">Jump on enemies to defeat them.</p>
            <p className="mario-overlay-sub">
              Press <kbd>Space</kbd> / <kbd>↑</kbd> or click to start
            </p>
            <button className="mario-btn" onClick={handleStartClick}>Start Game</button>
          </div>
        )}

        {displayState.paused && !displayState.gameOver && !displayState.won && (
          <div className="mario-overlay">
            <span className="mario-overlay-title">PAUSED</span>
            <p className="mario-overlay-sub">Press <kbd>P</kbd> to resume</p>
          </div>
        )}

        {displayState.gameOver && (
          <div className="mario-overlay mario-overlay--gameover">
            <span className="mario-overlay-title">GAME OVER</span>
            <p className="mario-overlay-sub">Final Score: {displayState.score}</p>
            <button className="mario-btn" onClick={handleRestart}>Play Again</button>
          </div>
        )}

        {displayState.won && (
          <div className="mario-overlay mario-overlay--win">
            <span className="mario-overlay-title">YOU WIN! 🎉</span>
            <p className="mario-overlay-sub">Score: {displayState.score}</p>
            <button className="mario-btn" onClick={handleRestart}>Play Again</button>
          </div>
        )}
      </div>

      {showInstructions && (
        <GameInstructionsModal gameId="mario" onClose={() => setShowInstructions(false)} />
      )}
    </div>
  );
}
