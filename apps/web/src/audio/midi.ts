export function mtof(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function noteName(midiNote: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const n = Math.round(midiNote);
  const name = names[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return `${name}${octave}`;
}

