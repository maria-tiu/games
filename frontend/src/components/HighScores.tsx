import React, { useState } from 'react';
import type { ScoreEntry } from '../types';
import './HighScores.css';

interface HighScoresProps {
  scores: ScoreEntry[];
  loading: boolean;
  error: string | null;
}

const HighScores: React.FC<HighScoresProps> = ({ scores, loading, error }) => {
  return (
    <div className="high-scores">
      <h3>High Scores</h3>
      {loading && <p className="hs-loading">Loading…</p>}
      {error && <p className="hs-error">Scores unavailable</p>}
      {!loading && !error && scores.length === 0 && (
        <p className="hs-empty">No scores yet!</p>
      )}
      {!loading && !error && scores.length > 0 && (
        <ol className="hs-list">
          {scores.map((s) => (
            <li key={s.id} className="hs-item">
              <span className="hs-name">{s.player_name}</span>
              <span className="hs-score">{s.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default HighScores;

interface ScoreSubmitFormProps {
  onSubmit: (name: string) => void;
  submitting: boolean;
}

export const ScoreSubmitForm: React.FC<ScoreSubmitFormProps> = ({ onSubmit, submitting }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <form className="score-submit-form" onSubmit={handleSubmit}>
      <h3>Game Over!</h3>
      <p>Enter your name:</p>
      <input
        className="name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        placeholder="Your name"
        autoFocus
      />
      <button className="btn btn-start" type="submit" disabled={submitting || !name.trim()}>
        {submitting ? 'Saving…' : 'Save Score'}
      </button>
    </form>
  );
};
