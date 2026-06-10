import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders footer label', () => {
    render(<Footer />);

    expect(screen.getByText('@GAMES FOR EVERYONE')).toBeInTheDocument();
  });
});
