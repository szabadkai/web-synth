import { useCallback, useEffect, useRef, useState } from 'react';
import { isTypingTarget, keyToMidi } from '../input/keyboard';
import { mtof } from '../audio/midi';

export type KeyboardState = {
  enabled: boolean;
  octave: number; // base octave for 'A' key mapping (C octave)
};

export function useKeyboard(
  onNoteOn: (freq: number, tag?: string) => void,
  onNoteOff: (freq: number, tag?: string) => void
) {
  const [state, setState] = useState<KeyboardState>({ enabled: true, octave: 4 });
  const downSet = useRef<Set<number>>(new Set());
  const keyToDownMidi = useRef<Map<string, number>>(new Map());

  const enable = useCallback(() => setState((s) => ({ ...s, enabled: true })), []);
  const disable = useCallback(() => setState((s) => ({ ...s, enabled: false })), []);
  const setOctave = useCallback((oct: number) => setState((s) => ({ ...s, octave: oct })), []);

  useEffect(() => {
    if (!state.enabled) return;

    const handleDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === 'z') {
        setState((s) => ({ ...s, octave: Math.max(0, s.octave - 1) }));
        return;
      }
      if (e.key === 'x') {
        setState((s) => ({ ...s, octave: Math.min(8, s.octave + 1) }));
        return;
      }

      const midi = keyToMidi(e.key, state.octave);
      if (midi == null) return;
      if (keyToDownMidi.current.has(e.key)) return; // already tracked for this physical key
      keyToDownMidi.current.set(e.key, midi);
      if (!downSet.current.has(midi)) downSet.current.add(midi);
      onNoteOn(mtof(midi), `kb-${midi}`);
    };

    const handleUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const storedMidi = keyToDownMidi.current.get(e.key);
      const midi = storedMidi ?? keyToMidi(e.key, state.octave);
      if (midi == null) return;
      keyToDownMidi.current.delete(e.key);
      if (downSet.current.has(midi)) downSet.current.delete(midi);
      onNoteOff(mtof(midi), `kb-${midi}`);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      downSet.current.clear();
      keyToDownMidi.current.clear();
    };
  }, [state.enabled, state.octave, onNoteOn, onNoteOff]);

  return { state, enable, disable, setOctave } as const;
}
