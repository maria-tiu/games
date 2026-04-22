import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GAME_INSTRUCTIONS } from '../data/gameInstructions';
import './GameInfoButton.css';

interface Props {
  gameId: string;
}

interface TooltipPos {
  top?: number;
  bottom?: number;
  left: number;
  maxHeight: number;
}

const TOOLTIP_W = 340;
const PAD = 10;
const GAP = 8;

export default function GameInfoButton({ gameId }: Props) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instructions = GAME_INSTRUCTIONS[gameId];

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();

    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    const left = Math.max(PAD, Math.min(idealLeft, window.innerWidth - TOOLTIP_W - PAD));

    const spaceBelow = window.innerHeight - rect.bottom - GAP - PAD;
    const spaceAbove = rect.top - GAP - PAD;

    if (spaceBelow >= spaceAbove) {
      setPos({ top: rect.bottom + GAP, left, maxHeight: spaceBelow });
    } else {
      setPos({ bottom: window.innerHeight - rect.top + GAP, left, maxHeight: spaceAbove });
    }
  }, []);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setPos(null), 80);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (!instructions) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 2000,
    width: TOOLTIP_W,
    boxSizing: 'border-box',
    maxHeight: pos?.maxHeight ?? undefined,
    overflowY: 'auto',
    ...(pos?.top !== undefined ? { top: pos.top } : { bottom: pos?.bottom }),
    left: pos?.left ?? 0,
  };

  return (
    <>
      <button
        ref={btnRef}
        className="btn-info"
        onMouseEnter={show}
        onMouseLeave={hide}
        aria-label={`How to play ${instructions.title}`}
      >
        ?
      </button>
      {pos &&
        createPortal(
          <div
            className="game-info-tooltip"
            style={tooltipStyle}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
          >
            <div className="git-title">{instructions.title}</div>
            <p className="git-desc">{instructions.description}</p>
            <div className="git-section">Controls</div>
            <ul className="git-controls">
              {instructions.controls.map((ctrl) => (
                <li key={ctrl.key} className="git-control-row">
                  <kbd className="git-key">{ctrl.key}</kbd>
                  <span className="git-action">{ctrl.action}</span>
                </li>
              ))}
            </ul>
            {instructions.tips && instructions.tips.length > 0 && (
              <>
                <div className="git-section">Tips</div>
                <ul className="git-tips">
                  {instructions.tips.map((tip, i) => (
                    <li key={i} className="git-tip">{tip}</li>
                  ))}
                </ul>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
