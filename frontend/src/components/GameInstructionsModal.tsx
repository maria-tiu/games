import React, { useEffect } from 'react';
import { GAME_INSTRUCTIONS } from '../data/gameInstructions';
import './GameInstructionsModal.css';

interface GameInstructionsModalProps {
  gameId: string;
  onClose: () => void;
}

const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({ gameId, onClose }) => {
  const instructions = GAME_INSTRUCTIONS[gameId];

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!instructions) return null;

  return (
    <div
      className="instructions-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={instructions.title}
    >
      <div
        className="instructions-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="instructions-header">
          <h2 className="instructions-title">{instructions.title}</h2>
          <button
            className="instructions-close-btn"
            onClick={onClose}
            aria-label="Close instructions"
          >
            ✕
          </button>
        </div>

        <p className="instructions-description">{instructions.description}</p>

        <h3 className="instructions-section-heading">Controls</h3>
        <ul className="instructions-controls">
          {instructions.controls.map((ctrl) => (
            <li key={ctrl.key} className="instructions-control-row">
              <kbd className="instructions-key">{ctrl.key}</kbd>
              <span className="instructions-action">{ctrl.action}</span>
            </li>
          ))}
        </ul>

        {instructions.tips && instructions.tips.length > 0 && (
          <>
            <h3 className="instructions-section-heading">Tips</h3>
            <ul className="instructions-tips">
              {instructions.tips.map((tip, idx) => (
                <li key={idx} className="instructions-tip">
                  {tip}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default GameInstructionsModal;
