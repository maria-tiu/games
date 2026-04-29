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
const TOTAL_LEVELS = 3;
const RESPAWN_X = 50;
const RESPAWN_Y = 414;
const LEVEL_2_SPEED_MULT = 1.4;
const LEVEL_3_SPEED_MULT = 1.6;

const LEVEL_3_STARS: [number, number][] = [
  [50, 30], [120, 60], [200, 25], [350, 45], [480, 20], [580, 55],
  [700, 35], [750, 70], [90, 100], [300, 85], [550, 95], [650, 30],
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Platform { x: number; y: number; w: number; h: number }
interface Coin { x: number; y: number; collected: boolean }
interface Enemy {
  x: number; y: number; w: number; h: number;
  vx: number; alive: boolean;
  patrolLeft: number; patrolRight: number;
}
interface Boss {
  x: number; y: number; w: number; h: number;
  vx: number; alive: boolean;
  hp: number; maxHp: number;
  invincible: number;
  patrolLeft: number; patrolRight: number;
}

interface GameState {
  mx: number; my: number;
  mvx: number; mvy: number;
  onGround: boolean;
  facingRight: boolean;
  invincible: number;
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  boss: Boss | null;
  score: number;
  lives: number;
  level: number;
  started: boolean;
  gameOver: boolean;
  won: boolean;
  levelComplete: boolean;
  paused: boolean;
}

// ── Level data ─────────────────────────────────────────────────────────────────
function makePlatforms(level: number): Platform[] {
  if (level === 1) return [
    { x: 0, y: 450, w: 800, h: 50 },       // Ground
    { x: 80, y: 342, w: 130, h: 18 },      // Platform A
    { x: 260, y: 278, w: 110, h: 18 },     // Platform B
    { x: 420, y: 337, w: 140, h: 18 },     // Platform C
    { x: 600, y: 257, w: 120, h: 18 },     // Platform D
    { x: 695, y: 157, w: 85, h: 18 },      // Platform E
    { x: 185, y: 192, w: 100, h: 18 },     // Platform F
  ];
  if (level === 2) return [
    { x: 0, y: 450, w: 800, h: 50 },
    { x: 50, y: 380, w: 100, h: 18 },
    { x: 200, y: 320, w: 90, h: 18 },
    { x: 100, y: 250, w: 80, h: 18 },
    { x: 300, y: 270, w: 120, h: 18 },
    { x: 500, y: 350, w: 100, h: 18 },
    { x: 450, y: 250, w: 80, h: 18 },
    { x: 620, y: 200, w: 100, h: 18 },
    { x: 680, y: 120, w: 90, h: 18 },
  ];
  // Level 3 – castle layout
  return [
    { x: 0, y: 450, w: 800, h: 50 },
    { x: 100, y: 370, w: 120, h: 18 },
    { x: 280, y: 300, w: 140, h: 18 },
    { x: 500, y: 370, w: 120, h: 18 },
    { x: 580, y: 250, w: 180, h: 18 },     // Boss arena
    { x: 200, y: 220, w: 80, h: 18 },
    { x: 680, y: 150, w: 80, h: 18 },
  ];
}

function makeCoins(level: number): Coin[] {
  if (level === 1) return [
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
  if (level === 2) return [
    { x: 70, y: 350, collected: false },
    { x: 100, y: 350, collected: false },
    { x: 130, y: 350, collected: false },
    { x: 215, y: 290, collected: false },
    { x: 245, y: 290, collected: false },
    { x: 110, y: 220, collected: false },
    { x: 140, y: 220, collected: false },
    { x: 320, y: 240, collected: false },
    { x: 350, y: 240, collected: false },
    { x: 380, y: 240, collected: false },
    { x: 515, y: 320, collected: false },
    { x: 545, y: 320, collected: false },
    { x: 460, y: 220, collected: false },
    { x: 490, y: 220, collected: false },
    { x: 640, y: 170, collected: false },
    { x: 690, y: 90, collected: false },
    { x: 720, y: 90, collected: false },
    { x: 750, y: 90, collected: false },
    { x: 200, y: 418, collected: false },
    { x: 600, y: 418, collected: false },
  ];
  // Level 3 – bonus coins; defeat the boss to win
  return [
    { x: 130, y: 340, collected: false },
    { x: 160, y: 340, collected: false },
    { x: 190, y: 340, collected: false },
    { x: 310, y: 270, collected: false },
    { x: 340, y: 270, collected: false },
    { x: 370, y: 270, collected: false },
    { x: 530, y: 340, collected: false },
    { x: 560, y: 340, collected: false },
    { x: 210, y: 190, collected: false },
    { x: 240, y: 190, collected: false },
    { x: 600, y: 220, collected: false },
    { x: 660, y: 220, collected: false },
    { x: 700, y: 120, collected: false },
    { x: 730, y: 120, collected: false },
  ];
}

function makeEnemies(level: number): Enemy[] {
  const spd = level === 1 ? ENEMY_SPD : level === 2 ? ENEMY_SPD * LEVEL_2_SPEED_MULT : ENEMY_SPD * LEVEL_3_SPEED_MULT;
  if (level === 1) return [
    { x: 300, y: 414, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 190, patrolRight: 440 },
    { x: 90,  y: 306, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 80,  patrolRight: 210 },
    { x: 430, y: 301, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 420, patrolRight: 560 },
    { x: 610, y: 221, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 600, patrolRight: 720 },
  ];
  if (level === 2) return [
    { x: 300, y: 414, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 250, patrolRight: 450 },
    { x: 600, y: 414, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 500, patrolRight: 770 },
    { x: 210, y: 284, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 200, patrolRight: 290 },
    { x: 460, y: 214, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 450, patrolRight: 530 },
    { x: 630, y: 164, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 620, patrolRight: 720 },
  ];
  // Level 3
  return [
    { x: 110, y: 414, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 0,   patrolRight: 250 },
    { x: 290, y: 264, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 280, patrolRight: 420 },
    { x: 510, y: 334, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 500, patrolRight: 620 },
    { x: 590, y: 214, w: 28, h: 28, vx: spd, alive: true, patrolLeft: 582, patrolRight: 680 },
  ];
}

function makeBoss(level: number): Boss | null {
  if (level !== TOTAL_LEVELS) return null;
  return {
    x: 638, y: 198,
    w: 52, h: 52,
    vx: 2.5,
    alive: true,
    hp: 3, maxHp: 3,
    invincible: 0,
    patrolLeft: 582, patrolRight: 706,
  };
}

function coinsForLevel(level: number): number {
  return makeCoins(level).length;
}

function initLevel(level: number, lives: number, score: number, started = true): GameState {
  return {
    mx: RESPAWN_X, my: RESPAWN_Y,
    mvx: 0, mvy: 0,
    onGround: false,
    facingRight: true,
    invincible: 0,
    platforms: makePlatforms(level),
    coins: makeCoins(level),
    enemies: makeEnemies(level),
    boss: makeBoss(level),
    score,
    lives,
    level,
    started,
    gameOver: false,
    won: false,
    levelComplete: false,
    paused: false,
  };
}

function initState(): GameState {
  return initLevel(1, LIVES_INIT, 0, false);
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

  const { isMuted: soundIsMuted, startMusic, stopMusic, playJump, playCoinCollect, playStomp, playGameOver, playWin: playSoundWin, toggleMute } = useGameSound('mario');
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
    coinsLeft: coinsForLevel(1),
    level: 1,
    levelComplete: false,
    bossHp: 0,
    bossMaxHp: 0,
  });

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, gs: GameState) => {
    // Sky – level-specific gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    if (gs.level === 1) {
      sky.addColorStop(0, '#4a90d9');
      sky.addColorStop(1, '#87ceeb');
    } else if (gs.level === 2) {
      sky.addColorStop(0, '#c0392b');
      sky.addColorStop(1, '#e67e22');
    } else {
      sky.addColorStop(0, '#0d0d1a');
      sky.addColorStop(1, '#1a1a3a');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Background decorations per level
    if (gs.level === 1 || gs.level === 2) {
      // Clouds
      const drawCloud = (cx: number, cy: number) => {
        ctx.fillStyle = gs.level === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,150,0.5)';
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
    } else {
      // Stars for level 3 night sky
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (const [sx, sy] of LEVEL_3_STARS) {
        ctx.fillRect(sx, sy, 2, 2);
      }
      // Castle towers in background
      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(30, 150, 40, 300);
      ctx.fillRect(720, 150, 50, 300);
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(30 + i * 14, 140, 10, 16);
        ctx.fillRect(720 + i * 17, 140, 12, 16);
      }
    }

    // Platforms – level-specific colour scheme
    gs.platforms.forEach((p, i) => {
      if (i === 0) {
        // Ground
        if (gs.level === 3) {
          ctx.fillStyle = '#3a3a4a';
          ctx.fillRect(p.x, p.y, p.w, 12);
          ctx.fillStyle = '#2a2a3a';
          ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
          ctx.fillStyle = '#444460';
          for (let bx = p.x; bx < p.x + p.w; bx += 40) {
            ctx.fillRect(bx, p.y + 12, 2, p.h - 12);
          }
        } else {
          ctx.fillStyle = '#5aad4e';
          ctx.fillRect(p.x, p.y, p.w, 12);
          ctx.fillStyle = '#7B5120';
          ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
        }
      } else {
        // Raised platforms
        if (gs.level === 3) {
          ctx.fillStyle = '#555570';
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = '#6a6a88';
          ctx.fillRect(p.x, p.y, p.w, 3);
          ctx.fillStyle = '#404058';
          for (let bx = p.x; bx < p.x + p.w; bx += 32) {
            ctx.fillRect(bx, p.y, 2, p.h);
          }
          ctx.fillRect(p.x, p.y + Math.floor(p.h / 2), p.w, 2);
        } else {
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
      }
    });

    // Coins – Mario-style rectangular coins (not plain circles)
    gs.coins.forEach((c) => {
      if (c.collected) return;
      const coinW = 12, coinH = 16;
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      // Coin body
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(c.x - coinW / 2, c.y - coinH / 2, coinW, coinH);
      // Dark top / bottom edges for 3-D coin look
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(c.x - coinW / 2, c.y - coinH / 2, coinW, 2);
      ctx.fillRect(c.x - coinW / 2, c.y + coinH / 2 - 2, coinW, 2);
      // Inner circle emblem
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      // Left-side shine highlight
      ctx.fillStyle = 'rgba(255, 255, 180, 0.65)';
      ctx.fillRect(c.x - coinW / 2 + 1, c.y - coinH / 2 + 3, 3, coinH - 6);
      ctx.restore();
    });

    // Enemies (Goomba-style)
    gs.enemies.forEach((e) => {
      if (!e.alive) return;
      ctx.fillStyle = gs.level === 3 ? '#6B2511' : '#8B4513';
      ctx.fillRect(e.x + 4, e.y + Math.floor(e.h / 2) - 2, e.w - 8, Math.floor(e.h / 2) + 8);
      ctx.fillStyle = gs.level === 3 ? '#3a1200' : '#5a2e00';
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2 - 1, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 4, e.y + Math.floor(e.h / 2) - 6, 6, 6);
      ctx.fillRect(e.x + e.w - 10, e.y + Math.floor(e.h / 2) - 6, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 5, e.y + Math.floor(e.h / 2) - 5, 3, 3);
      ctx.fillRect(e.x + e.w - 9, e.y + Math.floor(e.h / 2) - 5, 3, 3);
      ctx.fillStyle = '#3a1800';
      ctx.fillRect(e.x + 1, e.y + e.h - 6, 10, 6);
      ctx.fillRect(e.x + e.w - 11, e.y + e.h - 6, 10, 6);
    });

    // Boss (level 3) – Bowser-like sprite
    if (gs.boss && gs.boss.alive) {
      const b = gs.boss;
      ctx.save();
      if (b.invincible > 0 && Math.floor(b.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
      // Shell / back (green)
      ctx.fillStyle = '#1a7a1a';
      ctx.fillRect(b.x + 4, b.y + 12, b.w - 8, b.h - 14);
      // Shell spikes (gold)
      ctx.fillStyle = '#cc9900';
      for (let i = 0; i < 3; i++) {
        const sx = b.x + 6 + i * 14;
        ctx.beginPath();
        ctx.moveTo(sx, b.y + 14);
        ctx.lineTo(sx + 5, b.y + 4);
        ctx.lineTo(sx + 10, b.y + 14);
        ctx.fill();
      }
      // Body (yellow-green skin)
      ctx.fillStyle = '#8db400';
      ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 10);
      // Head
      ctx.fillStyle = '#8db400';
      ctx.fillRect(b.x + 10, b.y - 2, b.w - 20, 18);
      // Horns
      ctx.fillStyle = '#cc9900';
      ctx.fillRect(b.x + 8, b.y - 12, 8, 12);
      ctx.fillRect(b.x + b.w - 16, b.y - 12, 8, 12);
      // Eyes (red and angry)
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x + 12, b.y + 1, 8, 7);
      ctx.fillRect(b.x + b.w - 20, b.y + 1, 8, 7);
      ctx.fillStyle = '#dd0000';
      ctx.fillRect(b.x + 14, b.y + 2, 4, 5);
      ctx.fillRect(b.x + b.w - 18, b.y + 2, 4, 5);
      // Angry brow
      ctx.fillStyle = '#2a2a00';
      ctx.fillRect(b.x + 10, b.y - 1, 12, 3);
      ctx.fillRect(b.x + b.w - 22, b.y - 1, 12, 3);
      // Feet
      ctx.fillStyle = '#3a2000';
      ctx.fillRect(b.x + 2, b.y + b.h - 8, 16, 8);
      ctx.fillRect(b.x + b.w - 18, b.y + b.h - 8, 16, 8);
      ctx.restore();

      // Boss HP bar above sprite
      const barW = b.w + 24;
      const barX = b.x + b.w / 2 - barW / 2;
      const barY = b.y - 20;
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barW, 10);
      ctx.fillStyle = b.hp > 1 ? '#cc0000' : '#ff4400';
      ctx.fillRect(barX, barY, barW * (b.hp / b.maxHp), 10);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, 10);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', b.x + b.w / 2, barY - 2);
      ctx.textAlign = 'left';
    }

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

    // Level banner (top-right corner)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(CANVAS_W - 90, 6, 84, 22);
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${gs.level} / ${TOTAL_LEVELS}`, CANVAS_W - 10, 22);
    ctx.textAlign = 'left';
  }, []);

  // ── Game step ─────────────────────────────────────────────────────────────────
  const step = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started || gs.gameOver || gs.won || gs.paused || gs.levelComplete) return;

    const trySubmitScore = (score: number) => {
      const { isLoggedIn: li, username: un, token: tok } = authRef.current;
      if (score > 0 && li && un && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        scorePromiseRef.current = submitScore(
          { game_id: 'mario', player_name: un, score, lines_cleared: 0, level: gs.level },
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
    if (gs.mx < 0) { gs.mx = 0; gs.mvx = 0; }
    if (gs.mx + MARIO_W > CANVAS_W) { gs.mx = CANVAS_W - MARIO_W; gs.mvx = 0; }

    // ── Platform collision (one-way: land from top) ───────────────────────────
    gs.onGround = false;
    const prevBottom = gs.my + MARIO_H - gs.mvy;
    for (const p of gs.platforms) {
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
        gs.mx = RESPAWN_X; gs.my = RESPAWN_Y; gs.mvx = 0; gs.mvy = 0;
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
      if (coinsLeft === 0 && gs.level < TOTAL_LEVELS) {
        // All coins collected on levels 1-2 → advance to next level
        gs.levelComplete = true;
        soundRef.current.playWin();
        setDisplayState((d) => ({ ...d, score: gs.score, levelComplete: true, coinsLeft: 0 }));
        return;
      }
      setDisplayState((d) => ({ ...d, score: gs.score, coinsLeft }));
    }

    // ── Enemy AI & collision ──────────────────────────────────────────────────
    if (gs.invincible > 0) gs.invincible--;

    for (const e of gs.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x <= e.patrolLeft) { e.x = e.patrolLeft; e.vx = Math.abs(e.vx); }
      else if (e.x + e.w >= e.patrolRight) { e.x = e.patrolRight - e.w; e.vx = -Math.abs(e.vx); }

      if (
        gs.mx + MARIO_W > e.x + 2 && gs.mx < e.x + e.w - 2 &&
        gs.my + MARIO_H > e.y + 2 && gs.my < e.y + e.h - 2
      ) {
        const prevMarioBottom = gs.my + MARIO_H - gs.mvy;
        if (prevMarioBottom <= e.y + 10 && gs.mvy > 0) {
          e.alive = false;
          gs.mvy = -9;
          gs.score += 200;
          soundRef.current.playStomp();
          setDisplayState((d) => ({ ...d, score: gs.score }));
        } else if (gs.invincible === 0) {
          gs.lives--;
          if (gs.lives <= 0) {
            gs.gameOver = true;
            trySubmitScore(gs.score);
            soundRef.current.playGameOver();
            soundRef.current.stopMusic();
            setDisplayState((d) => ({ ...d, lives: 0, gameOver: true }));
          } else {
            gs.mx = RESPAWN_X; gs.my = RESPAWN_Y; gs.mvx = 0; gs.mvy = 0;
            gs.onGround = false;
            gs.invincible = 120;
            gs.started = false;
            setDisplayState((d) => ({ ...d, lives: gs.lives, started: false }));
          }
          return;
        }
      }
    }

    // ── Boss AI & collision (level 3) ─────────────────────────────────────────
    if (gs.boss && gs.boss.alive) {
      const b = gs.boss;
      if (b.invincible > 0) b.invincible--;
      b.x += b.vx;
      if (b.x <= b.patrolLeft) { b.x = b.patrolLeft; b.vx = Math.abs(b.vx); }
      else if (b.x + b.w >= b.patrolRight) { b.x = b.patrolRight - b.w; b.vx = -Math.abs(b.vx); }

      if (
        gs.mx + MARIO_W > b.x + 2 && gs.mx < b.x + b.w - 2 &&
        gs.my + MARIO_H > b.y + 2 && gs.my < b.y + b.h - 2
      ) {
        const prevMarioBottom = gs.my + MARIO_H - gs.mvy;
        if (prevMarioBottom <= b.y + 12 && gs.mvy > 0 && b.invincible === 0) {
          // Stomp the boss
          b.hp--;
          b.invincible = 60;
          gs.mvy = -11;
          gs.score += 500;
          soundRef.current.playStomp();
          if (b.hp <= 0) {
            b.alive = false;
            gs.won = true;
            trySubmitScore(gs.score);
            soundRef.current.playWin();
            soundRef.current.stopMusic();
            setDisplayState((d) => ({ ...d, score: gs.score, won: true, bossHp: 0 }));
            return;
          }
          setDisplayState((d) => ({ ...d, score: gs.score, bossHp: b.hp }));
        } else if (gs.invincible === 0 && b.invincible === 0) {
          gs.lives--;
          if (gs.lives <= 0) {
            gs.gameOver = true;
            trySubmitScore(gs.score);
            soundRef.current.playGameOver();
            soundRef.current.stopMusic();
            setDisplayState((d) => ({ ...d, lives: 0, gameOver: true }));
          } else {
            gs.mx = RESPAWN_X; gs.my = RESPAWN_Y; gs.mvx = 0; gs.mvy = 0;
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
        if (!gs.started && !gs.gameOver && !gs.won && !gs.levelComplete) {
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
    const failedLevel = stateRef.current.level;
    stateRef.current = initLevel(failedLevel, LIVES_INIT, 0, false);
    scoreSubmittedRef.current = false;
    scorePromiseRef.current = Promise.resolve();
    const bossHp = failedLevel === TOTAL_LEVELS ? 3 : 0;
    setDisplayState({
      score: 0,
      lives: LIVES_INIT,
      started: false,
      gameOver: false,
      won: false,
      paused: false,
      coinsLeft: coinsForLevel(failedLevel),
      level: failedLevel,
      levelComplete: false,
      bossHp,
      bossMaxHp: bossHp,
    });
  }, [stopMusic]);

  // ── Next Level ────────────────────────────────────────────────────────────────
  const handleNextLevel = useCallback(() => {
    soundRef.current.stopMusic();
    const gs = stateRef.current;
    const nextLevel = gs.level + 1;
    stateRef.current = initLevel(nextLevel, LIVES_INIT, gs.score, false);
    const bossHp = nextLevel === TOTAL_LEVELS ? 3 : 0;
    setDisplayState({
      score: gs.score,
      lives: LIVES_INIT,
      started: false,
      gameOver: false,
      won: false,
      paused: false,
      coinsLeft: coinsForLevel(nextLevel),
      level: nextLevel,
      levelComplete: false,
      bossHp,
      bossMaxHp: bossHp,
    });
  }, []);

  // ── Back navigation ───────────────────────────────────────────────────────────
  const handleBack = useCallback(async () => {
    await scorePromiseRef.current;
    navigate('/');
  }, [navigate]);

  // ── Start via button ──────────────────────────────────────────────────────────
  const handleStartClick = useCallback(() => {
    const gs = stateRef.current;
    if (!gs.started && !gs.gameOver && !gs.won && !gs.levelComplete) {
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
        <button
          className="sound-toggle-btn"
          onClick={() => toggleMute(displayState.started && !displayState.gameOver && !displayState.won && !displayState.paused)}
          title={soundIsMuted ? 'Unmute music' : 'Mute music'}
          aria-label={soundIsMuted ? 'Unmute music' : 'Mute music'}
        >
          {soundIsMuted ? '🔇' : '🔊'}
        </button>
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
          <span className="mario-hud-label">Level</span>
          <span className="mario-hud-value">{displayState.level} / {TOTAL_LEVELS}</span>
        </div>
        {displayState.level < TOTAL_LEVELS ? (
          <div className="mario-hud-item">
            <span className="mario-hud-label">Coins</span>
            <span className="mario-hud-value">🪙 {displayState.coinsLeft}</span>
          </div>
        ) : (
          <div className="mario-hud-item">
            <span className="mario-hud-label">Boss HP</span>
            <span className="mario-hud-value">{'❤️'.repeat(Math.max(0, displayState.bossHp))}</span>
          </div>
        )}
      </div>

      <div className="mario-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="mario-canvas"
        />

        {!displayState.started && !displayState.gameOver && !displayState.won && !displayState.levelComplete && (
          <div className="mario-overlay">
            <span className="mario-overlay-title">
              {displayState.level > 1 ? `LEVEL ${displayState.level}` : 'MARIO'}
            </span>
            {displayState.level < TOTAL_LEVELS ? (
              <p className="mario-overlay-sub">Collect all {displayState.coinsLeft} coins to advance!</p>
            ) : (
              <p className="mario-overlay-sub">⚔️ Defeat the Boss! Stomp it 3 times!</p>
            )}
            <p className="mario-overlay-sub">Jump on enemies to defeat them.</p>
            <p className="mario-overlay-sub">
              Press <kbd>Space</kbd> / <kbd>↑</kbd> or click to {displayState.level > 1 ? 'continue' : 'start'}
            </p>
            <button className="mario-btn" onClick={handleStartClick}>
              {displayState.level > 1 ? 'Continue' : 'Start Game'}
            </button>
          </div>
        )}

        {displayState.paused && !displayState.gameOver && !displayState.won && (
          <div className="mario-overlay">
            <span className="mario-overlay-title">PAUSED</span>
            <p className="mario-overlay-sub">Press <kbd>P</kbd> to resume</p>
          </div>
        )}

        {displayState.levelComplete && (
          <div className="mario-overlay mario-overlay--levelcomplete">
            <span className="mario-overlay-title">LEVEL {displayState.level} COMPLETE! 🎉</span>
            <p className="mario-overlay-sub">Score: {displayState.score}</p>
            <p className="mario-overlay-sub">Lives: {'❤️'.repeat(Math.max(0, displayState.lives))}</p>
            <button className="mario-btn" onClick={handleNextLevel}>Next Level →</button>
          </div>
        )}

        {displayState.gameOver && (
          <div className="mario-overlay mario-overlay--gameover">
            <span className="mario-overlay-title">GAME OVER</span>
            <p className="mario-overlay-sub">Final Score: {displayState.score}</p>
            <p className="mario-overlay-sub">Retry from Level {displayState.level}</p>
            <button className="mario-btn" onClick={handleRestart}>Try Again</button>
          </div>
        )}

        {displayState.won && (
          <div className="mario-overlay mario-overlay--win">
            <span className="mario-overlay-title">YOU WIN! 🎉</span>
            <p className="mario-overlay-sub">Boss Defeated! Final Score: {displayState.score}</p>
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
