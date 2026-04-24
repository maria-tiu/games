import { useRef, useCallback, useEffect, useState } from 'react';

export type GameSoundTheme = 'sliding-puzzle' | '2048' | 'breakout' | 'mario' | 'dashboard';

// ── Note durations (BPM 120 for most, ~200 for mario) ─────────────────────────
// Dashboard: slow ambient, BPM 60
const DB_W = 2.0;  // whole note at 60 BPM

// Sliding puzzle: pentatonic BPM 100
const SP_Q = 0.6;

// 2048: jazz arpeggio BPM 90
const J_Q = 0.667;
const J_E = J_Q / 2;

// Breakout: upbeat arcade BPM 160
const BR_Q = 0.375;
const BR_E = BR_Q / 2;

// Mario: BPM 200
const M_Q = 0.3;
const M_E = M_Q / 2;
const M_S = M_E / 2;
const M_DQ = M_Q * 1.5;

// ── Melodies ──────────────────────────────────────────────────────────────────
// [freq_hz, duration_s] — freq 0 = rest

const DASHBOARD_THEME: [number, number][] = [
  [261.63, DB_W], // C4
  [329.63, DB_W], // E4
  [392.00, DB_W], // G4
  [523.25, DB_W], // C5
  [392.00, DB_W], // G4
  [329.63, DB_W], // E4
  [293.66, DB_W], // D4
  [261.63, DB_W], // C4
  [0,      DB_W], // rest
  [261.63, DB_W],
  [392.00, DB_W],
  [329.63, DB_W],
  [440.00, DB_W],
  [392.00, DB_W],
  [349.23, DB_W],
  [329.63, DB_W],
];

const SLIDING_PUZZLE_THEME: [number, number][] = [
  // C pentatonic: C D E G A
  [523.25, SP_Q], [587.33, SP_Q], [659.25, SP_Q], [783.99, SP_Q],
  [880.00, SP_Q], [783.99, SP_Q], [659.25, SP_Q], [587.33, SP_Q],
  [523.25, SP_Q], [659.25, SP_Q], [783.99, SP_Q], [880.00, SP_Q],
  [659.25, SP_Q], [587.33, SP_Q], [523.25, SP_Q], [0, SP_Q],
  [587.33, SP_Q], [659.25, SP_Q], [783.99, SP_Q], [659.25, SP_Q],
  [523.25, SP_Q], [440.00, SP_Q], [523.25, SP_Q], [587.33, SP_Q],
  [659.25, SP_Q], [523.25, SP_Q], [587.33, SP_Q], [659.25, SP_Q],
  [783.99, SP_Q], [659.25, SP_Q], [523.25, SP_Q], [0, SP_Q],
];

const GAME2048_THEME: [number, number][] = [
  // Smooth jazz arpeggio in C major 7 / Am7
  [261.63, J_Q], [329.63, J_E], [392.00, J_E], [493.88, J_Q], [392.00, J_E], [329.63, J_E],
  [440.00, J_Q], [523.25, J_E], [587.33, J_E], [523.25, J_Q], [440.00, J_Q],
  [392.00, J_Q], [329.63, J_E], [261.63, J_E], [293.66, J_Q], [329.63, J_Q],
  [261.63, J_Q], [0, J_Q],
  [220.00, J_Q], [261.63, J_E], [329.63, J_E], [392.00, J_Q], [329.63, J_E], [261.63, J_E],
  [349.23, J_Q], [440.00, J_E], [523.25, J_E], [440.00, J_Q], [349.23, J_Q],
  [329.63, J_Q], [261.63, J_E], [220.00, J_E], [246.94, J_Q], [261.63, J_Q],
  [220.00, J_Q], [0, J_Q],
];

const BREAKOUT_THEME: [number, number][] = [
  // Upbeat arcade square wave melody
  [523.25, BR_E], [659.25, BR_E], [783.99, BR_Q], [659.25, BR_E], [783.99, BR_E],
  [880.00, BR_Q], [0, BR_E], [880.00, BR_E], [783.99, BR_Q],
  [659.25, BR_E], [783.99, BR_E], [659.25, BR_E], [523.25, BR_E], [440.00, BR_Q],
  [523.25, BR_E], [659.25, BR_E],
  [698.46, BR_E], [783.99, BR_E], [880.00, BR_Q], [783.99, BR_E], [698.46, BR_E],
  [659.25, BR_Q], [0, BR_E], [659.25, BR_E], [783.99, BR_Q],
  [523.25, BR_E], [587.33, BR_E], [523.25, BR_E], [493.88, BR_E], [440.00, BR_Q],
  [523.25, BR_E], [523.25, BR_E],
];

// Mario opening phrase (approximate)
const MARIO_THEME: [number, number][] = [
  [659.25, M_E], [0, M_S], [659.25, M_E], [0, M_Q],
  [523.25, M_E], [659.25, M_E], [0, M_Q],
  [783.99, M_Q], [0, M_Q], [392.00, M_Q], [0, M_Q],
  [523.25, M_E], [0, M_Q], [392.00, M_E], [0, M_Q],
  [329.63, M_E], [0, M_Q],
  [440.00, M_E], [0, M_E], [493.88, M_E], [0, M_E],
  [466.16, M_E], [440.00, M_E],
  [392.00, M_DQ], [659.25, M_DQ], [783.99, M_DQ],
  [880.00, M_E], [698.46, M_E], [783.99, M_E],
  [0, M_E], [659.25, M_E], [523.25, M_E], [587.33, M_E], [493.88, M_E],
  [0, M_Q],
];

// ── Oscillator types per theme ─────────────────────────────────────────────────
const THEME_OSC_TYPE: Record<GameSoundTheme, OscillatorType> = {
  'dashboard':      'sine',
  'sliding-puzzle': 'triangle',
  '2048':           'sine',
  'breakout':       'square',
  'mario':          'square',
};

const THEME_MELODY: Record<GameSoundTheme, [number, number][]> = {
  'dashboard':      DASHBOARD_THEME,
  'sliding-puzzle': SLIDING_PUZZLE_THEME,
  '2048':           GAME2048_THEME,
  'breakout':       BREAKOUT_THEME,
  'mario':          MARIO_THEME,
};

const THEME_GAIN: Record<GameSoundTheme, number> = {
  'dashboard':      0.15,
  'sliding-puzzle': 0.20,
  '2048':           0.18,
  'breakout':       0.22,
  'mario':          0.22,
};

// ── Hook return types ──────────────────────────────────────────────────────────

interface BaseSound {
  isMuted: boolean;
  startMusic: () => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  toggleMute: (gameIsActive?: boolean) => void;
}

interface SlidingPuzzleSound extends BaseSound {
  playTileSlide: () => void;
  playWin: () => void;
}

interface Game2048Sound extends BaseSound {
  playTileMove: () => void;
  playMerge: () => void;
  playWin: () => void;
  playGameOver: () => void;
}

interface BreakoutSound extends BaseSound {
  playPaddleHit: () => void;
  playBrickBreak: () => void;
  playLifeLost: () => void;
  playWin: () => void;
  playGameOver: () => void;
}

interface MarioSound extends BaseSound {
  playJump: () => void;
  playCoinCollect: () => void;
  playStomp: () => void;
  playGameOver: () => void;
  playWin: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DashboardSound extends BaseSound {
  // no SFX
}

// Overloads
export function useGameSound(theme: 'sliding-puzzle'): SlidingPuzzleSound;
export function useGameSound(theme: '2048'): Game2048Sound;
export function useGameSound(theme: 'breakout'): BreakoutSound;
export function useGameSound(theme: 'mario'): MarioSound;
export function useGameSound(theme: 'dashboard'): DashboardSound;
export function useGameSound(theme: GameSoundTheme): BaseSound;

export function useGameSound(theme: GameSoundTheme): BaseSound {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIndexRef = useRef(0);
  const isMusicActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const initAudio = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      try {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.value = THEME_GAIN[theme];
        master.connect(ctx.destination);
        audioCtxRef.current = ctx;
        masterGainRef.current = master;
      } catch {
        return null;
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [theme]);

  const scheduleNextNote = useCallback(function tick() {
    if (!isMusicActiveRef.current || isMutedRef.current) return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const melody = THEME_MELODY[theme];
    const [freq, duration] = melody[noteIndexRef.current];
    noteIndexRef.current = (noteIndexRef.current + 1) % melody.length;

    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = THEME_OSC_TYPE[theme];
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.85);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    }

    musicTimerRef.current = setTimeout(tick, duration * 1000);
  }, [theme]);

  const startMusic = useCallback(() => {
    if (isMusicActiveRef.current) return;
    initAudio();
    isMusicActiveRef.current = true;
    noteIndexRef.current = 0;
    scheduleNextNote();
  }, [initAudio, scheduleNextNote]);

  const stopMusic = useCallback(() => {
    isMusicActiveRef.current = false;
    if (musicTimerRef.current) {
      clearTimeout(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  const pauseMusic = useCallback(() => {
    isMusicActiveRef.current = false;
    if (musicTimerRef.current) {
      clearTimeout(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (isMusicActiveRef.current || isMutedRef.current) return;
    initAudio();
    isMusicActiveRef.current = true;
    scheduleNextNote();
  }, [initAudio, scheduleNextNote]);

  // ── Sound effects ────────────────────────────────────────────────────────────

  // sliding-puzzle SFX
  const playTileSlide = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [initAudio]);

  // 2048 SFX
  const playTileMove = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  }, [initAudio]);

  const playMerge = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    [440, 554, 659].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    });
  }, [initAudio]);

  // breakout SFX
  const playPaddleHit = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }, [initAudio]);

  const playBrickBreak = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }, [initAudio]);

  const playLifeLost = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    [440, 349, 293, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }, [initAudio]);

  // mario SFX
  const playJump = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  }, [initAudio]);

  const playCoinCollect = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    [1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      osc.start(t0);
      osc.stop(t0 + 0.12);
    });
  }, [initAudio]);

  const playStomp = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }, [initAudio]);

  // shared SFX
  const playWin = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  }, [initAudio]);

  const playGameOver = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const notes = [440.00, 349.23, 293.66, 246.94];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.27;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    });
  }, [initAudio]);

  const toggleMute = useCallback((gameIsActive: boolean = false) => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      pauseMusic();
    } else if (gameIsActive) {
      resumeMusic();
    }
  }, [pauseMusic, resumeMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMusicActiveRef.current = false;
      if (musicTimerRef.current) clearTimeout(musicTimerRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  // Return theme-specific shape
  const base: BaseSound = { isMuted, startMusic, stopMusic, pauseMusic, resumeMusic, toggleMute };

  switch (theme) {
    case 'sliding-puzzle':
      return { ...base, playTileSlide, playWin } as SlidingPuzzleSound;
    case '2048':
      return { ...base, playTileMove, playMerge, playWin, playGameOver } as Game2048Sound;
    case 'breakout':
      return { ...base, playPaddleHit, playBrickBreak, playLifeLost, playWin, playGameOver } as BreakoutSound;
    case 'mario':
      return { ...base, playJump, playCoinCollect, playStomp, playGameOver, playWin } as MarioSound;
    case 'dashboard':
    default:
      return base;
  }
}
