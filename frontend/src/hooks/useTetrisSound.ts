import { useRef, useCallback, useEffect, useState } from 'react';

// Tetris Theme A (Korobeiniki) — [frequency_hz, duration_seconds]
// 0 frequency = rest note
// BPM ~160: quarter = 0.375s, eighth = 0.1875s
const Q = 0.375;
const E = Q / 2;
const DQ = Q * 1.5;
const H = Q * 2;

const TETRIS_THEME: [number, number][] = [
  // Part A — first phrase
  [659.25, Q], [493.88, E], [523.25, E], [587.33, Q], [523.25, E], [493.88, E],
  [440.00, Q], [440.00, E], [523.25, E], [659.25, Q], [587.33, E], [523.25, E],
  [493.88, DQ], [523.25, E],
  [587.33, Q], [659.25, Q],
  [523.25, Q], [440.00, Q],
  [440.00, H],
  // Part A — second phrase
  [0, E], [587.33, Q], [698.46, E],
  [880.00, Q], [783.99, E], [698.46, E],
  [659.25, DQ], [523.25, E],
  [659.25, Q], [587.33, E], [523.25, E],
  [493.88, Q], [493.88, E], [523.25, E],
  [587.33, Q], [659.25, Q],
  [523.25, Q], [440.00, Q],
  [440.00, H],
  // Part B — first phrase (repeat of Part A first phrase)
  [659.25, Q], [493.88, E], [523.25, E], [587.33, Q], [523.25, E], [493.88, E],
  [440.00, Q], [440.00, E], [523.25, E], [659.25, Q], [587.33, E], [523.25, E],
  [493.88, DQ], [523.25, E],
  [587.33, Q], [659.25, Q],
  [523.25, Q], [440.00, Q],
  [440.00, H],
  // Part B — second phrase
  [0, E], [587.33, Q], [698.46, E],
  [880.00, Q], [783.99, E], [698.46, E],
  [659.25, DQ], [523.25, E],
  [659.25, Q], [587.33, E], [523.25, E],
  [493.88, Q], [493.88, E], [523.25, E],
  [587.33, Q], [659.25, Q],
  [523.25, Q], [440.00, Q],
  [440.00, H],
];

export function useTetrisSound() {
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
        master.gain.value = 0.22;
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
  }, []);

  // Named function expression so it can reference itself recursively without
  // stale-closure issues. All values are read from refs at call time.
  const scheduleNextNote = useCallback(function tick() {
    if (!isMusicActiveRef.current || isMutedRef.current) return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const [freq, duration] = TETRIS_THEME[noteIndexRef.current];
    noteIndexRef.current = (noteIndexRef.current + 1) % TETRIS_THEME.length;

    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.85);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    }

    musicTimerRef.current = setTimeout(tick, duration * 1000);
  }, []);

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

  // --- Sound effects --------------------------------------------------------

  const playMove = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [initAudio]);

  const playRotate = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [initAudio]);

  const playDrop = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [initAudio]);

  const playClear = useCallback((lines: number) => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const freqs = lines >= 4
      ? [523.25, 659.25, 783.99, 1046.5]
      : lines >= 2
        ? [523.25, 659.25, 783.99]
        : [523.25, 659.25];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.start(t0);
      osc.stop(t0 + 0.35);
    });
  }, [initAudio]);

  const playLevelUp = useCallback(() => {
    if (isMutedRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.start(t0);
      osc.stop(t0 + 0.35);
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

  return {
    isMuted,
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playMove,
    playRotate,
    playDrop,
    playClear,
    playLevelUp,
    playGameOver,
    toggleMute,
  };
}
