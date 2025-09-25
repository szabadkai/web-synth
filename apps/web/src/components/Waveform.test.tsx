import { render, screen } from '@testing-library/react';
import Waveform from './Waveform';

const fakeEngine = {
  isRunning: false,
  context: () => null,
  ensureContext: async () => undefined,
  startNote: () => undefined,
  stopNote: () => undefined,
  setFrequency: () => undefined,
  setWave: () => undefined,
  setFilter: () => undefined,
  setEnvelope: () => undefined,
  setMasterGain: () => undefined,
  getAnalyser: () => null,
} as any;

describe('Waveform', () => {
  it('renders a canvas', () => {
    render(<Waveform engine={fakeEngine} width={200} height={80} />);
    const canvas = screen.getByRole('img', { hidden: true });
    // HTMLCanvasElement is not easily queried by role; fallback to querySelector if needed
    expect(document.querySelector('canvas')).toBeTruthy();
  });
});

