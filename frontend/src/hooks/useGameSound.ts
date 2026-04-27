import { useRef, useCallback, useEffect, useState } from 'react';

export type GameSoundTheme = 'sliding-puzzle' | '2048' | 'breakout' | 'mario' | 'dashboard';


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

// Overloads
export function useGameSound(theme: 'sliding-puzzle'): SlidingPuzzleSound;
export function useGameSound(theme: '2048'): Game2048Sound;
export function useGameSound(theme: 'breakout'): BreakoutSound;
export function useGameSound(theme: 'mario'): MarioSound;
export function useGameSound(theme: 'dashboard'): BaseSound;
export function useGameSound(theme: GameSoundTheme): BaseSound;

export function useGameSound(theme: GameSoundTheme): BaseSound {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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


  const startMusic = useCallback(() => {
    return; // music disabled
  }, []);

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
    return; // music disabled
  }, []);

  // ── Sound effects ────────────────────────────────────────────────────────────

  // sliding-puzzle SFX
  const playTileSlide = useCallback(() => {
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
