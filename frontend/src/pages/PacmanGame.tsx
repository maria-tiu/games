import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { submitScore } from '../api/scores';
import GameInstructionsModal from '../components/GameInstructionsModal';
import './PacmanGame.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const TILE = 20;
const COLS = 21;
const ROWS = 23;
const CANVAS_W = COLS * TILE; // 420
const CANVAS_H = ROWS * TILE; // 460

const PAC_SPEED = 2;   // pixels/frame – must divide TILE/2 (=10) evenly
const GHOST_SPEED = 1.8;
const LIVES_INIT = 3;
const DOT_PTS = 10;
const POWER_PTS = 50;
const GHOST_BASE_PTS = 200;
const FRIGHT_FRAMES = 300; // ~5 s at 60 fps
const TUNNEL_ROW = 9;

const GHOST_COLORS = ['#FF2222', '#FFB8FF', '#00FFFF', '#FFB847'];

// ── Maze (0=dot  1=wall  2=power-pellet  3=empty) ─────────────────────────────
const BASE_MAP: number[][] = [
  /* r 0  */ [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  /* r 1  */ [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  /* r 2  */ [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  /* r 3  */ [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1],
  /* r 4  */ [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
  /* r 5  */ [1,0,0,0,0,1,0,1,1,1,3,1,1,1,0,1,0,0,0,0,1],
  /* r 6  */ [1,1,1,1,0,1,0,1,3,3,3,3,3,1,0,1,0,1,1,1,1],
  /* r 7  */ [1,1,1,1,0,1,0,3,3,3,3,3,3,3,0,1,0,1,1,1,1],
  /* r 8  */ [1,1,1,1,0,1,0,3,1,3,3,3,1,3,0,1,0,1,1,1,1],
  /* r 9  */ [3,3,3,3,0,3,0,3,3,3,3,3,3,3,0,3,0,3,3,3,3],
  /* r10  */ [1,1,1,1,0,1,0,3,1,3,3,3,1,3,0,1,0,1,1,1,1],
  /* r11  */ [1,1,1,1,0,1,0,3,3,3,3,3,3,3,0,1,0,1,1,1,1],
  /* r12  */ [1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
  /* r13  */ [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  /* r14  */ [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  /* r15  */ [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1],
  /* r16  */ [1,0,1,1,0,0,0,0,0,0,3,0,0,0,0,0,0,1,1,0,1],
  /* r17  */ [1,0,0,0,0,1,0,1,1,1,1,1,1,1,0,1,0,0,0,0,1],
  /* r18  */ [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
  /* r19  */ [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  /* r20  */ [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  /* r21  */ [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  /* r22  */ [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ── Direction helpers ─────────────────────────────────────────────────────────
type Dir = 'up' | 'down' | 'left' | 'right';
const DELTA: Record<Dir, { dr: number; dc: number }> = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
};
const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

// ── Web Audio API sounds ──────────────────────────────────────────────────────
let _actx: AudioContext | null = null;
let wakaFlip: number = 0;

function actx(): AudioContext | null {
  try {
    if (!_actx || _actx.state === 'closed') _actx = new AudioContext();
    if (_actx.state === 'suspended') void _actx.resume();
    return _actx;
  } catch { return null; }
}

function tone(
  freq: number, dur: number,
  type: OscillatorType = 'square',
  vol = 0.08, delay = 0,
) {
  const ctx = actx(); if (!ctx) return;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.02);
}

function sfxDot()         { tone(wakaFlip ? 360 : 260, 0.07); wakaFlip ^= 1; }
function sfxPower()       { [300,420,560,720].forEach((f,i) => tone(f,0.10,'square',0.10, i*0.07)); }
function sfxGhostEaten()  { [700,550,420,300].forEach((f,i) => tone(f,0.08,'square',0.13, i*0.05)); }
function sfxDeath()       { [400,370,340,300,260,220,180,140].forEach((f,i) => tone(f,0.10,'sawtooth',0.14, i*0.09)); }
function sfxWin()         { [262,330,392,523,659,784,1047].forEach((f,i) => tone(f,0.12,'triangle',0.10, i*0.07)); }

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ghost {
  gx: number; gy: number;
  dir: Dir;
  exitDelay: number;  // frames until this ghost leaves the house
  exiting: boolean;   // currently animating the exit path
  frightened: boolean;
  frighTimer: number;
  eaten: boolean;
  atIntersection: boolean;
}

interface GS {
  map: number[][];
  pacX: number; pacY: number;
  pacCol: number; pacRow: number;
  pacDir: Dir; nextDir: Dir;
  pacAtCenter: boolean;  // true while within snap-range after last center snap
  mouth: number; mouthDir: number;  // 0..0.42 radians
  score: number; lives: number; dots: number;
  ghosts: Ghost[];
  started: boolean; over: boolean; won: boolean; paused: boolean;
  level: number; frame: number;
  deathTimer: number;   // counts down after pac-man dies
  winTimer: number;     // counts down before showing win screen
  ghostMult: number;    // consecutive ghost-eat multiplier
  submitted: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function wall(map: number[][], r: number, c: number): boolean {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return map[r][c] === 1;
}

function countDots(map: number[][]): number {
  let n = 0;
  for (const row of map) for (const v of row) if (v === 0 || v === 2) n++;
  return n;
}

function mkGhosts(): Ghost[] {
  // Ghosts start in the house (rows 8-10, cols 9-11) staggered
  return [
    { gx: 10*TILE+TILE/2, gy:  9*TILE+TILE/2, dir:'up',  exitDelay:  0, exiting:true,  frightened:false, frighTimer:0, eaten:false, atIntersection:false },
    { gx:  9*TILE+TILE/2, gy:  9*TILE+TILE/2, dir:'up',  exitDelay:120, exiting:false, frightened:false, frighTimer:0, eaten:false, atIntersection:false },
    { gx: 11*TILE+TILE/2, gy:  9*TILE+TILE/2, dir:'up',  exitDelay:240, exiting:false, frightened:false, frighTimer:0, eaten:false, atIntersection:false },
    { gx: 10*TILE+TILE/2, gy: 10*TILE+TILE/2, dir:'up',  exitDelay:360, exiting:false, frightened:false, frighTimer:0, eaten:false, atIntersection:false },
  ];
}

function makeGS(): GS {
  const map = BASE_MAP.map(r => [...r]);
  return {
    map,
    pacX: 10*TILE+TILE/2, pacY: 16*TILE+TILE/2,
    pacCol: 10, pacRow: 16,
    pacDir: 'left', nextDir: 'left',
    pacAtCenter: false,
    mouth: 0.05, mouthDir: 1,
    score: 0, lives: LIVES_INIT, dots: countDots(map),
    ghosts: mkGhosts(),
    started: false, over: false, won: false, paused: false,
    level: 1, frame: 0,
    deathTimer: 0, winTimer: 0,
    ghostMult: 1, submitted: false,
  };
}

// nearest tile-center column / row for a pixel position
function nearCol(px: number) { return Math.round((px - TILE/2) / TILE); }
function nearRow(py: number) { return Math.round((py - TILE/2) / TILE); }
function cx(c: number)       { return c * TILE + TILE/2; }
function cy(r: number)       { return r * TILE + TILE/2; }

// ── Ghost AI ──────────────────────────────────────────────────────────────────
function chooseDir(gs: GS, g: Ghost, col: number, row: number, idx: number): Dir {
  const dirs: Dir[] = ['up','down','left','right'];
  const valid = dirs.filter(d => d !== OPP[g.dir] && !wall(gs.map, row+DELTA[d].dr, col+DELTA[d].dc));
  if (valid.length === 0) return OPP[g.dir];
  if (g.frightened) return valid[Math.floor(Math.random() * valid.length)];

  let tr = gs.pacRow, tc = gs.pacCol;
  switch (idx) {
    case 1: tr = gs.pacRow + DELTA[gs.pacDir].dr*4; tc = gs.pacCol + DELTA[gs.pacDir].dc*4; break;
    case 2:
      if (Math.random() < 0.35) { tr = row + (Math.random()>0.5?5:-5)|0; tc = col + (Math.random()>0.5?5:-5)|0; }
      break;
    case 3:
      if (Math.abs(col-gs.pacCol)+Math.abs(row-gs.pacRow) < 7) { tr = ROWS-2; tc = 1; }
      break;
  }
  valid.sort((a,b) => {
    const {dr:ar,dc:ac} = DELTA[a]; const {dr:br,dc:bc} = DELTA[b];
    return (Math.abs(row+ar-tr)+Math.abs(col+ac-tc)) - (Math.abs(row+br-tr)+Math.abs(col+bc-tc));
  });
  return valid[0];
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#08080e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawWallTile(ctx: CanvasRenderingContext2D, c: number, r: number) {
  const x = c*TILE, y = r*TILE, T = TILE;
  // Main gradient fill (top-left lighter → bottom-right darker = 3-D bevel look)
  const g = ctx.createLinearGradient(x, y, x+T, y+T);
  g.addColorStop(0, '#2828b8');
  g.addColorStop(1, '#0d0d68');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, T, T);
  // Top highlight
  ctx.fillStyle = '#4040d4';
  ctx.fillRect(x, y, T, 3);
  // Left highlight
  ctx.fillStyle = '#3434c4';
  ctx.fillRect(x, y, 3, T);
  // Bottom shadow
  ctx.fillStyle = '#04043a';
  ctx.fillRect(x, y+T-2, T, 2);
  // Right shadow
  ctx.fillStyle = '#060650';
  ctx.fillRect(x+T-2, y, 2, T);
}

function drawDot(ctx: CanvasRenderingContext2D, c: number, r: number) {
  const x = cx(c), y = cy(r);
  ctx.save();
  ctx.shadowColor = '#ffffaa'; ctx.shadowBlur = 5;
  const g = ctx.createRadialGradient(x-0.6,y-0.6,0, x,y,2.5);
  g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#ffee88');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPellet(ctx: CanvasRenderingContext2D, c: number, r: number, frame: number) {
  const x = cx(c), y = cy(r);
  const rad = 5.5 + Math.sin(frame*0.13)*1.5;
  ctx.save();
  ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(x-1.5,y-1.5,0, x,y,rad);
  g.addColorStop(0,'#ffffff'); g.addColorStop(0.3,'#ffff00'); g.addColorStop(1,'#ff9900');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPacman(
  ctx: CanvasRenderingContext2D,
  px: number, py: number,
  dir: Dir, mouth: number,
  dying: boolean,
) {
  const R = 9;
  const rot: Record<Dir,number> = { right:0, down:Math.PI/2, left:Math.PI, up:-Math.PI/2 };
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rot[dir]);
  ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 14;

  // 3-D sphere gradient – light from top-left
  const g = ctx.createRadialGradient(-R*0.35,-R*0.35,0, 0,0,R);
  g.addColorStop(0,'#ffffc0');
  g.addColorStop(0.3,'#ffff00');
  g.addColorStop(0.8,'#ddaa00');
  g.addColorStop(1,'#886600');
  ctx.fillStyle = g;

  const ma = dying ? 0.5 : Math.max(0.02, mouth);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0,0,R, ma, Math.PI*2 - ma);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(R*0.2,-R*0.5,1.8,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function clampRGB(n: number) { return Math.min(255, Math.max(0, n)); }

function drawGhost(
  ctx: CanvasRenderingContext2D,
  gx: number, gy: number,
  color: string,
  frightened: boolean,
  eaten: boolean,
  frame: number,
) {
  const R = 9;
  ctx.save();
  ctx.translate(gx, gy);

  if (eaten) {
    // Only draw "dead" eyes floating back to house
    ctx.fillStyle = 'rgba(160,210,255,0.9)';
    for (const ox of [-3.5, 3.5]) {
      ctx.beginPath(); ctx.ellipse(ox,-2,3,2.5,0,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#0044ff';
    for (const ox of [-3.5, 3.5]) {
      ctx.beginPath(); ctx.arc(ox,-2,1.2,0,Math.PI*2); ctx.fill();
    }
    ctx.restore(); return;
  }

  // Body colour: frightened = blue, flashing white near end
  const blinkWhite = frightened && frame%20 < 10;
  const bodyHex = frightened ? (blinkWhite ? '#aaaaff' : '#0033cc') : color;

  // Parse hex to rgb for gradient derivation
  const br = parseInt(bodyHex.slice(1,3),16);
  const bg = parseInt(bodyHex.slice(3,5),16);
  const bb = parseInt(bodyHex.slice(5,7),16);
  const lighter = `rgb(${clampRGB(br+65)},${clampRGB(bg+65)},${clampRGB(bb+65)})`;
  const darker  = `rgb(${clampRGB(br-45)},${clampRGB(bg-45)},${clampRGB(bb-45)})`;

  ctx.shadowColor = bodyHex; ctx.shadowBlur = 12;

  const g = ctx.createRadialGradient(-R*0.3,-R*0.4,0, 0,0,R*1.3);
  g.addColorStop(0, lighter);
  g.addColorStop(0.5, bodyHex);
  g.addColorStop(1, darker);
  ctx.fillStyle = g;

  // Ghost body path: rounded top + wavy skirt
  ctx.beginPath();
  ctx.arc(0, -R*0.15, R, Math.PI, 0);      // top dome
  ctx.lineTo(R, R*0.75);                    // right side
  const bw = (R*2)/3;
  for (let i=2; i>=0; i--) {
    const bx = -R + (i+1)*bw;
    ctx.quadraticCurveTo(bx-bw*0.5, R*0.75+R*0.35, bx-bw, R*0.75);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  if (frightened) {
    // Simple scared face
    ctx.fillStyle = 'rgba(200,200,255,0.85)';
    for (const ox of [-3, 3]) { ctx.beginPath(); ctx.arc(ox,-2,2,0,Math.PI*2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(200,200,255,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4.5,3);
    for (let i=0;i<5;i++) ctx.lineTo(-4.5+i*2.25, 3+(i%2===0?-2:2));
    ctx.stroke();
  } else {
    // Normal eyes
    ctx.fillStyle = 'white';
    for (const ox of [-3.5, 3.5]) {
      ctx.beginPath(); ctx.ellipse(ox,-2,3,2.5,0,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#0033ff';
    for (const ox of [-3.5, 3.5]) {
      ctx.beginPath(); ctx.arc(ox+0.5,-2,1.3,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = 'white';
    for (const ox of [-3.5, 3.5]) {
      ctx.beginPath(); ctx.arc(ox+1.1,-2.8,0.55,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, gs: GS) {
  drawBg(ctx);
  // Walls
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (gs.map[r][c]===1) drawWallTile(ctx,c,r);
  // Dots & pellets
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (gs.map[r][c]===0) drawDot(ctx,c,r);
    if (gs.map[r][c]===2) drawPellet(ctx,c,r,gs.frame);
  }
  // Ghosts
  gs.ghosts.forEach((g,i) => {
    if (g.exitDelay > 0) {
      drawGhost(ctx,g.gx,g.gy,GHOST_COLORS[i],false,false,gs.frame);
      return;
    }
    const showFright = g.frightened && (g.frighTimer > 100 || gs.frame%20 < 10);
    drawGhost(ctx,g.gx,g.gy,GHOST_COLORS[i],showFright,g.eaten,gs.frame);
  });
  // Pac-Man (flash during death)
  if (gs.deathTimer===0 || gs.frame%6<3) {
    drawPacman(ctx,gs.pacX,gs.pacY,gs.pacDir,gs.mouth,gs.deathTimer>0);
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PacmanGame() {
  const navigate   = useNavigate();
  const { isLoggedIn, username, token } = useAuth();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gsRef      = useRef<GS>(makeGS());
  const animRef    = useRef(0);
  const authRef    = useRef({ isLoggedIn, username, token });

  useEffect(() => { authRef.current = { isLoggedIn, username, token }; }, [isLoggedIn, username, token]);

  const [disp, setDisp] = useState({ score:0, lives:LIVES_INIT, started:false, over:false, won:false, paused:false });
  const [showHelp, setShowHelp] = useState(false);

  // ── Submit score ────────────────────────────────────────────────────────────
  const trySubmit = useCallback((score: number, level: number) => {
    const { isLoggedIn: li, username: un, token: tok } = authRef.current;
    const gs = gsRef.current;
    if (score > 0 && li && un && !gs.submitted) {
      gs.submitted = true;
      void submitScore(
        { game_id:'pacman', player_name:un, score, lines_cleared:0, level },
        tok ?? undefined,
      ).catch(()=>undefined);
    }
  }, []);

  // ── Move Pac-Man ────────────────────────────────────────────────────────────
  const movePac = useCallback((gs: GS) => {
    const T = TILE, s = PAC_SPEED;
    // nearest tile center
    const nc = nearCol(gs.pacX), nr = nearRow(gs.pacY);
    const tcx = cx(nc), tcy = cy(nr);
    const close = Math.abs(gs.pacX - tcx) <= s && Math.abs(gs.pacY - tcy) <= s;

    if (close && !gs.pacAtCenter) {
      // Arrived at (or still at) a tile center — snap and decide direction
      gs.pacX = tcx; gs.pacY = tcy;
      gs.pacAtCenter = true;
      // try queued turn
      const { dr:ndr, dc:ndc } = DELTA[gs.nextDir];
      if (!wall(gs.map, nr+ndr, nc+ndc)) gs.pacDir = gs.nextDir;
      // blocked in chosen direction → stay, re-allow check next frame
      const { dr, dc } = DELTA[gs.pacDir];
      if (wall(gs.map, nr+dr, nc+dc)) {
        gs.pacAtCenter = false;
        gs.pacCol = nc; gs.pacRow = nr; return;
      }
    } else if (!close) {
      gs.pacAtCenter = false;
    }

    const { dr, dc } = DELTA[gs.pacDir];
    const nx = gs.pacX + dc * s;
    const ny = gs.pacY + dr * s;

    // Leading-edge wall check: stop before entering a wall tile
    const ledgeX = dc > 0 ? nx + T/2 - 1 : dc < 0 ? nx - T/2 + 1 : nx;
    const ledgeY = dr > 0 ? ny + T/2 - 1 : dr < 0 ? ny - T/2 + 1 : ny;
    const lc = Math.floor(ledgeX / T);
    const lr = Math.floor(ledgeY / T);
    if (wall(gs.map, lr, lc)) {
      // Snap to current tile center so player can turn at the corner
      gs.pacX = tcx; gs.pacY = tcy;
      gs.pacAtCenter = false; // allow direction re-check
      gs.pacCol = nc; gs.pacRow = nr; return;
    }

    // Tunnel row wrap
    const curRow = Math.floor(gs.pacY / T);
    if (curRow === TUNNEL_ROW) {
      if (nx < 0)       { gs.pacX = (COLS-1)*T + T/2; gs.pacAtCenter = false; gs.pacCol = COLS-1; gs.pacRow = TUNNEL_ROW; return; }
      if (nx >= COLS*T) { gs.pacX = T/2;               gs.pacAtCenter = false; gs.pacCol = 0;      gs.pacRow = TUNNEL_ROW; return; }
    }

    gs.pacX = nx; gs.pacY = ny;
    gs.pacCol = Math.max(0, Math.min(COLS-1, Math.floor(gs.pacX / T)));
    gs.pacRow = Math.max(0, Math.min(ROWS-1, Math.floor(gs.pacY / T)));
  }, []);

  // ── Move ghosts ─────────────────────────────────────────────────────────────
  const moveGhosts = useCallback((gs: GS) => {
    const T = TILE;
    gs.ghosts.forEach((g, idx) => {
      // Exit-delay countdown
      if (g.exitDelay > 0) { g.exitDelay--; if (g.exitDelay===0) g.exiting=true; return; }

      const spd = g.eaten ? GHOST_SPEED*2.5 : g.frightened ? GHOST_SPEED*0.55 : GHOST_SPEED;

      // ── Exiting ghost house: glide to (row 4, col 10) ──────────────────────
      if (g.exiting) {
        const ex = cx(10), ey = cy(4);
        const dx = ex - g.gx, dy = ey - g.gy;
        if (Math.abs(dx) > spd) {
          g.gx += Math.sign(dx)*spd;
        } else if (Math.abs(dy) > spd) {
          g.gx = ex;
          g.gy += Math.sign(dy)*spd;
        } else {
          g.gx = ex; g.gy = ey;
          g.exiting = false;
          g.dir = Math.random()<0.5 ? 'left' : 'right';
          g.atIntersection = true;
        }
        return;
      }

      // ── Eaten ghost: drift back to house ───────────────────────────────────
      if (g.eaten) {
        const hx = cx(10), hy = cy(9);
        const dx = hx - g.gx, dy = hy - g.gy;
        const d  = Math.sqrt(dx*dx+dy*dy);
        if (d < spd+1) {
          g.gx=hx; g.gy=hy;
          g.eaten=false; g.frightened=false;
          g.exiting=true; g.exitDelay=60;
        } else {
          g.gx += (dx/d)*spd; g.gy += (dy/d)*spd;
        }
        return;
      }

      // ── Normal / frightened movement ───────────────────────────────────────
      const col = nearCol(g.gx), row = nearRow(g.gy);
      const gcx = cx(col), gcy = cy(row);
      const near = Math.abs(g.gx-gcx) < spd+0.6 && Math.abs(g.gy-gcy) < spd+0.6;

      if (near && !g.atIntersection) {
        g.gx = gcx; g.gy = gcy;
        g.atIntersection = true;
        g.dir = chooseDir(gs, g, col, row, idx);
      } else if (!near) {
        g.atIntersection = false;
      }

      const { dr, dc } = DELTA[g.dir];
      const nx = g.gx + dc*spd;
      const ny = g.gy + dr*spd;

      // Tunnel wrap for ghosts
      if (row === TUNNEL_ROW) {
        if (nx < 0)       { g.gx = COLS*T - T/2; return; }
        if (nx >= COLS*T) { g.gx = T/2;            return; }
      }

      // Simple wall check: check leading-edge tile
      const lc = dc > 0 ? Math.floor((nx+T/2-2)/T) : dc < 0 ? Math.floor((nx-T/2+2)/T) : col;
      const lr = dr > 0 ? Math.floor((ny+T/2-2)/T) : dr < 0 ? Math.floor((ny-T/2+2)/T) : row;
      if (!wall(gs.map, lr, lc)) { g.gx = nx; g.gy = ny; }
      else g.atIntersection = false; // force re-choose next frame
    });
  }, []);

  // ── Collision / pickup ──────────────────────────────────────────────────────
  const checkHits = useCallback((gs: GS, syncDisp: (f:(d:typeof disp)=>typeof disp)=>void) => {
    const { pacCol:c, pacRow:r } = gs;
    const cell = gs.map[r]?.[c];

    if (cell === 0) {
      gs.map[r][c] = 3; gs.score += DOT_PTS; gs.dots--; sfxDot();
    } else if (cell === 2) {
      gs.map[r][c] = 3; gs.score += POWER_PTS; gs.dots--;
      gs.ghostMult = 1; sfxPower();
      gs.ghosts.forEach(g => {
        if (!g.exiting && !g.eaten && g.exitDelay===0) {
          g.frightened=true; g.frighTimer=FRIGHT_FRAMES;
        }
      });
    }

    if (gs.dots <= 0 && gs.winTimer===0) { gs.winTimer=90; sfxWin(); }

    // Fright timers
    gs.ghosts.forEach(g => {
      if (g.frightened) { g.frighTimer--; if (g.frighTimer<=0) { g.frightened=false; } }
    });

    // Ghost collision
    let died = false;
    gs.ghosts.forEach((g, _i) => {
      if (g.exitDelay>0 || g.exiting || g.eaten) return;
      const dx = gs.pacX-g.gx, dy = gs.pacY-g.gy;
      if (dx*dx+dy*dy < (TILE*0.85)*(TILE*0.85)) {
        if (g.frightened) {
          g.eaten=true; g.frightened=false; g.frighTimer=0;
          gs.score += GHOST_BASE_PTS * gs.ghostMult;
          gs.ghostMult = Math.min(gs.ghostMult*2, 8);
          sfxGhostEaten();
        } else if (!died) {
          died = true;
          gs.lives--; gs.deathTimer=90; sfxDeath();
          syncDisp(d=>({...d, lives:gs.lives}));
        }
      }
    });
  }, []);

  // ── Main step ───────────────────────────────────────────────────────────────
  const step = useCallback((gs: GS, syncDisp: (f:(d:typeof disp)=>typeof disp)=>void) => {
    if (!gs.started || gs.paused || gs.over || gs.won) return;
    gs.frame++;

    // Death countdown
    if (gs.deathTimer > 0) {
      gs.deathTimer--;
      if (gs.deathTimer === 0) {
        if (gs.lives <= 0) {
          gs.over = true;
          trySubmit(gs.score, gs.level);
          syncDisp(d=>({...d, over:true, score:gs.score}));
        } else {
          // Respawn
          gs.pacX=cx(10); gs.pacY=cy(16); gs.pacCol=10; gs.pacRow=16;
          gs.pacDir='left'; gs.nextDir='left'; gs.pacAtCenter=false;
          gs.ghosts=mkGhosts(); gs.ghostMult=1;
          gs.started=false;
          syncDisp(d=>({...d, started:false}));
        }
      }
      return;
    }

    // Win countdown
    if (gs.winTimer > 0) {
      gs.winTimer--;
      if (gs.winTimer === 0) {
        gs.won=true;
        trySubmit(gs.score, gs.level);
        syncDisp(d=>({...d, won:true, score:gs.score}));
      }
      return;
    }

    movePac(gs);
    moveGhosts(gs);
    checkHits(gs, syncDisp);

    // Animate mouth
    gs.mouth += gs.mouthDir * 0.09;
    if (gs.mouth > 0.42) gs.mouthDir = -1;
    if (gs.mouth < 0.02) gs.mouthDir =  1;

    if (gs.frame % 6 === 0) syncDisp(d=>({...d, score:gs.score}));
  }, [movePac, moveGhosts, checkHits, trySubmit]);

  // ── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    gsRef.current = makeGS();

    const loop = () => {
      step(gsRef.current, setDisp);
      drawScene(ctx, gsRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [step]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); gs.nextDir='up';    break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); gs.nextDir='down';  break;
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); gs.nextDir='left';  break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); gs.nextDir='right'; break;
        case ' ': case 'Enter':
          e.preventDefault();
          if (!gs.started && !gs.over && !gs.won) {
            gs.started=true; void actx();
            setDisp(d=>({...d, started:true}));
          }
          break;
        case 'p': case 'P':
          if (gs.started && !gs.over && !gs.won) {
            gs.paused=!gs.paused;
            setDisp(d=>({...d, paused:gs.paused}));
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleStart = useCallback(() => {
    const gs = gsRef.current;
    if (!gs.started && !gs.over && !gs.won) {
      gs.started=true; void actx();
      setDisp(d=>({...d, started:true}));
    }
  }, []);

  const handleRestart = useCallback(() => {
    gsRef.current = makeGS();
    setDisp({ score:0, lives:LIVES_INIT, started:false, over:false, won:false, paused:false });
  }, []);

  return (
    <div className="pac-page">
      {/* Top bar */}
      <div className="pac-topbar">
        <button className="pac-back-btn" onClick={()=>navigate('/')}>← Back</button>
        <button className="pac-help-btn" onClick={()=>setShowHelp(true)} title="How to play">?</button>
      </div>

      <header className="pac-header">
        <h1 className="pac-title">PAC-MAN</h1>
      </header>

      <div className="pac-hud">
        <div className="pac-hud-item">
          <span className="pac-hud-label">SCORE</span>
          <span className="pac-hud-value">{disp.score}</span>
        </div>
        <div className="pac-hud-item">
          <span className="pac-hud-label">LIVES</span>
          <span className="pac-hud-value pac-lives">{'●'.repeat(Math.max(0, disp.lives))}</span>
        </div>
      </div>

      {/* 3-D perspective wrapper */}
      <div className="pac-scene-outer">
        <div className="pac-scene-tilt">
          <div className="pac-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="pac-canvas"
            />

            {/* Overlays */}
            {!disp.started && !disp.over && !disp.won && (
              <div className="pac-overlay">
                <span className="pac-ol-title">PAC-MAN</span>
                <p className="pac-ol-sub">Use <kbd>Arrow keys</kbd> or <kbd>WASD</kbd> to move</p>
                <p className="pac-ol-sub">Eat all dots · avoid ghosts · eat power pellets to hunt them!</p>
                <button className="pac-btn" onClick={handleStart}>▶ Start Game</button>
              </div>
            )}
            {disp.paused && !disp.over && !disp.won && (
              <div className="pac-overlay">
                <span className="pac-ol-title">PAUSED</span>
                <p className="pac-ol-sub">Press <kbd>P</kbd> to resume</p>
              </div>
            )}
            {disp.over && (
              <div className="pac-overlay pac-overlay--over">
                <span className="pac-ol-title">GAME OVER</span>
                <p className="pac-ol-sub">Score: {disp.score}</p>
                <button className="pac-btn" onClick={handleRestart}>Play Again</button>
              </div>
            )}
            {disp.won && (
              <div className="pac-overlay pac-overlay--win">
                <span className="pac-ol-title">YOU WIN! 🎉</span>
                <p className="pac-ol-sub">Score: {disp.score}</p>
                <button className="pac-btn" onClick={handleRestart}>Play Again</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHelp && <GameInstructionsModal gameId="pacman" onClose={()=>setShowHelp(false)} />}
    </div>
  );
}
