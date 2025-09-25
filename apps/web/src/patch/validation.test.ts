import { isPatch, clampPatch } from './validation';

const good = {
  osc: { wave: 'sawtooth', freq: 440 },
  filter: { type: 'lowpass', cutoff: 1000, q: 1 },
  env: { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.2 },
  masterGain: 0.5,
};

describe('patch validation', () => {
  it('accepts valid patch', () => {
    expect(isPatch(good)).toBe(true);
  });

  it('rejects invalid patch', () => {
    const bad: any = { ...good, osc: { wave: 'noise', freq: 440 } };
    expect(isPatch(bad)).toBe(false);
  });

  it('clamps out-of-range values', () => {
    const c = clampPatch({
      osc: { wave: 'sine', freq: 1 },
      filter: { type: 'lowpass', cutoff: 50000, q: 1000 },
      env: { attack: -1, decay: -2, sustain: 2, release: 99 },
      masterGain: 2,
    });
    expect(c.osc.freq).toBeGreaterThanOrEqual(20);
    expect(c.filter.cutoff).toBeLessThanOrEqual(20000);
    expect(c.filter.q).toBeLessThanOrEqual(40);
    expect(c.env.attack).toBeGreaterThanOrEqual(0);
    expect(c.env.sustain).toBeLessThanOrEqual(1);
    expect(c.masterGain).toBeLessThanOrEqual(1);
  });
});

