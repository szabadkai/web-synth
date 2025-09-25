// Computer keyboard → MIDI mapping utilities
// Uses a common layout: A row = white keys, W/E/T/Y/U = black keys

export type KeyMapOptions = {
  baseOctave?: number; // 0..8, default 4 (C4=60)
};

const WHITE = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const BLACK: Record<string, number> = {
  w: 1, // C#
  e: 3, // D#
  t: 6, // F#
  y: 8, // G#
  u: 10, // A#
};

// Map a key to semitone offset from C within the octave block
export function keyToSemitone(key: string): number | null {
  const k = key.toLowerCase();
  const whiteIndex = WHITE.indexOf(k);
  if (whiteIndex >= 0) {
    // white keys across: C D E F G A B C
    // semitone steps:    0 2 4 5 7 9 11 12
    const table = [0, 2, 4, 5, 7, 9, 11, 12];
    return table[whiteIndex];
  }
  if (k in BLACK) return BLACK[k];
  return null;
}

export function semitoneToMidi(baseOctave = 4, semitone = 0): number {
  // MIDI note for C of given octave: 12 * (octave + 1)
  const c = 12 * (baseOctave + 1);
  return c + semitone;
}

export function keyToMidi(key: string, baseOctave = 4): number | null {
  const st = keyToSemitone(key);
  if (st === null) return null;
  return semitoneToMidi(baseOctave, st);
}

export function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName?.toLowerCase();
  if (!tag) return false;
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (node as any).isContentEditable === true
  );
}

