import { mtof, noteName } from './midi';

describe('midi utils', () => {
  it('maps MIDI to frequency (A4=440)', () => {
    expect(Math.round(mtof(69))).toBe(440);
    expect(Math.round(mtof(60))).toBe(261); // ~261.63
  });

  it('formats note names', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(69)).toBe('A4');
  });
});

