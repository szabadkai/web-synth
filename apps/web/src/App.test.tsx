import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Minimal smoke test for UI presence and interaction
describe('App', () => {
  it('renders controls and adjusts frequency label', async () => {
    render(<App />);
    const initBtn = screen.getByRole('button', { name: /initialize audio/i });
    expect(initBtn).toBeInTheDocument();

    const playBtn = screen.getByRole('button', { name: /play/i });
    expect(playBtn).toBeInTheDocument();

    const slider = screen.getByRole('slider', { name: /frequency/i }) as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '880' } });

    // label displays rounded value; presence indicates binding works
    expect(screen.getByText(/Frequency: 880/)).toBeInTheDocument();
  });
});
