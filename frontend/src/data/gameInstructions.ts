export interface GameInstruction {
  key: string;
  action: string;
}

export interface GameInstructionsData {
  title: string;
  description: string;
  controls: GameInstruction[];
  tips?: string[];
}

export const GAME_INSTRUCTIONS: Record<string, GameInstructionsData> = {
  tetris: {
    title: 'How to play Tetris',
    description:
      'Tetromino pieces fall from the top. Arrange them to fill complete horizontal lines — filled lines are cleared and you score points. The game ends when pieces stack up to the top.',
    controls: [
      { key: '← →', action: 'Move piece left / right' },
      { key: '↑', action: 'Rotate piece clockwise' },
      { key: '↓', action: 'Soft drop (move down faster)' },
      { key: 'Space', action: 'Hard drop (instant drop)' },
      { key: 'P', action: 'Pause / Resume' },
    ],
    tips: [
      'Clear multiple lines at once for bonus points.',
      'Clearing 4 lines at once (a "Tetris") gives the highest bonus.',
      'The ghost piece shows where the current piece will land.',
    ],
  },
  'sliding-puzzle': {
    title: 'How to play Sliding Puzzle',
    description:
      'Arrange the numbered tiles in order (1, 2, 3 … left to right, top to bottom) with the blank space in the bottom-right corner. Click any tile adjacent to the blank space to slide it into the gap.',
    controls: [
      { key: 'Click', action: 'Slide an adjacent tile into the blank space' },
      { key: '↑ ↓ ← →', action: 'Move the blank space with arrow keys' },
    ],
    tips: [
      'Start by solving the top rows first, then work your way down.',
      'Fewer moves in less time gives a better score.',
      'Choose a smaller grid (3×3) to practice before trying 4×4 or 5×5.',
    ],
  },
};
