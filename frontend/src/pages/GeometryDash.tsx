import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameInfoButton from '../components/GameInfoButton';
import './GeometryDash.css';

type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface GeometryLevel {
  name: string;
  speed: number;
  gravity: number;
  jumpVelocity: number;
  length: number;
  obstacles: Obstacle[];
}

const PLAYER_X = 110;
const PLAYER_SIZE = 30;
const KEY_TO_LEVEL: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,
};

function obstaclePattern(startX: number, gap: number, heights: number[]): Obstacle[] {
  return heights.map((height, index) => ({
    x: startX + index * gap,
    width: height > 60 ? 36 : 30,
    height,
  }));
}

const LEVELS: GeometryLevel[] = [
  { name: 'Level 1 · Warm Up', speed: 260, gravity: 1200, jumpVelocity: 520, length: 3000, obstacles: obstaclePattern(420, 180, [40, 46, 42, 56, 42, 46, 52, 44, 56, 46, 48, 52]) },
  { name: 'Level 2 · Tiny Steps', speed: 280, gravity: 1220, jumpVelocity: 530, length: 3200, obstacles: obstaclePattern(400, 165, [42, 50, 42, 60, 42, 62, 44, 60, 46, 64, 48, 58, 46]) },
  { name: 'Level 3 · Bounce Path', speed: 300, gravity: 1240, jumpVelocity: 540, length: 3350, obstacles: obstaclePattern(450, 170, [48, 58, 48, 64, 52, 68, 50, 64, 56, 70, 52, 62, 50]) },
  { name: 'Level 4 · Tight Rhythm', speed: 320, gravity: 1260, jumpVelocity: 545, length: 3500, obstacles: obstaclePattern(380, 150, [44, 62, 46, 66, 48, 62, 50, 68, 52, 64, 54, 70, 56, 66]) },
  { name: 'Level 5 · Stair Peaks', speed: 335, gravity: 1280, jumpVelocity: 555, length: 3650, obstacles: obstaclePattern(420, 160, [40, 50, 60, 70, 58, 50, 62, 72, 64, 54, 66, 74, 68]) },
  { name: 'Level 6 · Mid Boss', speed: 350, gravity: 1290, jumpVelocity: 560, length: 3800, obstacles: obstaclePattern(420, 145, [52, 64, 56, 72, 60, 76, 62, 70, 58, 74, 66, 78, 60, 70]) },
  { name: 'Level 7 · Double Time', speed: 368, gravity: 1310, jumpVelocity: 570, length: 3950, obstacles: obstaclePattern(430, 138, [56, 70, 58, 76, 62, 78, 64, 74, 60, 80, 66, 76, 62, 82]) },
  { name: 'Level 8 · Turbo Lane', speed: 382, gravity: 1320, jumpVelocity: 575, length: 4100, obstacles: obstaclePattern(410, 132, [60, 74, 62, 82, 64, 80, 68, 84, 66, 78, 70, 86, 68, 84, 66]) },
  { name: 'Level 9 · Night Sprint', speed: 395, gravity: 1340, jumpVelocity: 585, length: 4300, obstacles: obstaclePattern(440, 126, [62, 78, 66, 86, 68, 84, 70, 88, 72, 86, 74, 90, 70, 88, 76]) },
  { name: 'Level 10 · Final Rush', speed: 410, gravity: 1360, jumpVelocity: 595, length: 4500, obstacles: obstaclePattern(420, 122, [66, 82, 70, 90, 72, 88, 74, 92, 76, 90, 78, 94, 80, 92, 82, 96]) },
];

export default function GeometryDash() {
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState(0);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [distance, setDistance] = useState(0);
  const [playerY, setPlayerY] = useState(0);

  const distanceRef = useRef(0);
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);
  const level = useMemo(() => LEVELS[levelIndex], [levelIndex]);

  const resetRun = useCallback(() => {
    distanceRef.current = 0;
    playerYRef.current = 0;
    velocityRef.current = 0;
    setDistance(0);
    setPlayerY(0);
  }, []);

  const startLevel = useCallback(() => {
    resetRun();
    setStatus('playing');
  }, [resetRun]);

  const selectLevel = useCallback((index: number) => {
    setLevelIndex(index);
    resetRun();
    setStatus('ready');
  }, [resetRun]);

  const jump = useCallback(() => {
    if (status !== 'playing') return;
    if (playerYRef.current > 1) return;
    velocityRef.current = level.jumpVelocity;
  }, [level.jumpVelocity, status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key in KEY_TO_LEVEL) {
        selectLevel(KEY_TO_LEVEL[event.key]);
        return;
      }
      if (event.key === 'Enter') {
        startLevel();
        return;
      }
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [jump, selectLevel, startLevel]);

  useEffect(() => {
    if (status !== 'playing') return;

    let frame = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      velocityRef.current -= level.gravity * delta;
      playerYRef.current += velocityRef.current * delta;

      if (playerYRef.current < 0) {
        playerYRef.current = 0;
        velocityRef.current = 0;
      }

      distanceRef.current += level.speed * delta;
      setPlayerY(playerYRef.current);
      setDistance(distanceRef.current);

      const playerTop = 250 - playerYRef.current - PLAYER_SIZE;
      const playerBottom = 250 - playerYRef.current;
      const playerLeft = PLAYER_X;
      const playerRight = PLAYER_X + PLAYER_SIZE;

      const collided = level.obstacles.some((obstacle) => {
        const obstacleScreenX = obstacle.x - distanceRef.current + PLAYER_X;
        const obstacleLeft = obstacleScreenX;
        const obstacleRight = obstacleScreenX + obstacle.width;
        const obstacleTop = 250 - obstacle.height;
        const overlapX = playerRight > obstacleLeft && playerLeft < obstacleRight;
        const overlapY = playerBottom > obstacleTop && playerTop < 250;
        return overlapX && overlapY;
      });

      if (collided) {
        setStatus('lost');
        return;
      }

      if (distanceRef.current >= level.length) {
        setStatus('won');
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [level, status]);

  const progress = Math.min((distance / level.length) * 100, 100);

  return (
    <div className="geometry-page">
      <div className="geometry-topbar">
        <button className="geometry-back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="geometry-title">
          Geometry Dash
          <GameInfoButton gameId="geometry-dash" />
        </h1>
        <button className="geometry-start-btn" onClick={startLevel}>
          {status === 'playing' ? 'Restart' : 'Start'}
        </button>
      </div>

      <div className="geometry-panel">
        <div className="geometry-level-grid">
          {LEVELS.map((item, index) => (
            <button
              key={item.name}
              className={`geometry-level-btn ${index === levelIndex ? 'active' : ''}`}
              onClick={() => selectLevel(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="geometry-level-name">{level.name}</div>
        <div className="geometry-status">
          {status === 'ready' && 'Press Start or Enter'}
          {status === 'playing' && 'Space / ↑ to jump'}
          {status === 'won' && 'Level complete!'}
          {status === 'lost' && 'Crashed! Press Start to retry'}
        </div>
      </div>

      <div className="geometry-track-wrap" onClick={jump}>
        <div className="geometry-progress-track">
          <div className="geometry-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="geometry-track">
          <div className="geometry-ground" />
          <div className="geometry-player" style={{ left: `${PLAYER_X}px`, bottom: `${20 + playerY}px` }} />
          {level.obstacles.map((obstacle, index) => {
            const left = obstacle.x - distance + PLAYER_X;
            if (left < -80 || left > 980) return null;
            return (
              <div
                key={`${level.name}-${index}`}
                className="geometry-obstacle"
                style={{ left: `${left}px`, width: `${obstacle.width}px`, height: `${obstacle.height}px` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
