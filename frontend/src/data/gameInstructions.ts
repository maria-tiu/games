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
  '2048': {
    title: 'How to play 2048',
    description:
      'Slide tiles on a 4×4 grid to merge matching numbers. Each merge doubles the tile value. Reach the 2048 tile to win — then keep going for an even higher score!',
    controls: [
      { key: '← →', action: 'Slide all tiles left / right' },
      { key: '↑ ↓', action: 'Slide all tiles up / down' },
      { key: 'W A S D', action: 'Alternative move keys' },
      { key: 'Swipe', action: 'Swipe on touch screens to move tiles' },
    ],
    tips: [
      'Keep your highest tile in a corner and build around it.',
      'Try to maintain a consistent direction for most moves.',
      'After reaching 2048, choose "Keep Going" to aim for 4096 or higher.',
    ],
  },
  breakout: {
    title: 'How to play Breakout',
    description:
      'Use the paddle to keep the ball in play and destroy all the bricks at the top of the screen. You have 3 lives — each time the ball falls below the paddle you lose one. Clear all bricks to win!',
    controls: [
      { key: '← →', action: 'Move the paddle left / right' },
      { key: 'Mouse', action: 'Move the paddle with the mouse' },
      { key: 'Space / Click', action: 'Launch the ball' },
      { key: 'P', action: 'Pause / Resume' },
    ],
    tips: [
      'Hit the ball near the edges of the paddle to send it at a sharper angle.',
      'Top rows are worth more points — aim for them early.',
      'Watch the ball\'s trajectory before launching so you can plan your position.',
    ],
  },
};
