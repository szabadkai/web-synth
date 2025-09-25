import { keyToSemitone, keyToMidi, semitoneToMidi } from './keyboard';

describe('keyboard mapping', () => {
  it('maps white keys to semitones', () => {
    expect(keyToSemitone('a')).toBe(0); // C
    expect(keyToSemitone('s')).toBe(2); // D
    expect(keyToSemitone('d')).toBe(4); // E
    expect(keyToSemitone('f')).toBe(5); // F
    expect(keyToSemitone('g')).toBe(7); // G
    expect(keyToSemitone('h')).toBe(9); // A
    expect(keyToSemitone('j')).toBe(11); // B
    expect(keyToSemitone('k')).toBe(12); // C (next)
  });

  it('maps black keys to semitones', () => {
    expect(keyToSemitone('w')).toBe(1); // C#
    expect(keyToSemitone('e')).toBe(3); // D#
    expect(keyToSemitone('t')).toBe(6); // F#
    expect(keyToSemitone('y')).toBe(8); // G#
    expect(keyToSemitone('u')).toBe(10); // A#
  });

  it('computes MIDI from semitone and octave', () => {
    expect(semitoneToMidi(4, 0)).toBe(60); // C4
    expect(semitoneToMidi(4, 12)).toBe(72); // C5
  });

  it('maps keys to MIDI notes at base octave', () => {
    expect(keyToMidi('a', 4)).toBe(60); // C4
    expect(keyToMidi('w', 4)).toBe(61); // C#4
    expect(keyToMidi('h', 4)).toBe(69); // A4
  });
});

