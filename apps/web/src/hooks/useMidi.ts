import { useCallback, useEffect, useRef, useState } from 'react';
import { mtof } from '../audio/midi';

export type MidiState = {
  enabled: boolean;
  inputs: { id: string; name: string }[];
  lastMessage?: string;
};

export function useMidi(
  onNoteOn: (freq: number, velocity: number, tag?: string) => void,
  onNoteOff: (freq?: number, tag?: string) => void,
  onAllNotesOff?: () => void
) {
  const [state, setState] = useState<MidiState>({ enabled: false, inputs: [] });
  const accessRef = useRef<MIDIAccess | null>(null);
  const currentNoteRef = useRef<number | null>(null);

  const enable = useCallback(async () => {
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      const inputs: { id: string; name: string }[] = [];
      access.inputs.forEach((input) => {
        inputs.push({ id: input.id, name: input.name || input.id });
        input.onmidimessage = (ev) => {
          const [status, data1, data2] = ev.data;
          const cmd = status & 0xf0;
          if (cmd === 0x90 && data2 > 0) {
            // note on
            currentNoteRef.current = data1;
            onNoteOn(mtof(data1), data2, `midi-${data1}`);
            setState((s) => ({ ...s, lastMessage: `NoteOn ${data1} v${data2}` }));
          } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
            // note off
            onNoteOff(mtof(data1), `midi-${data1}`);
            setState((s) => ({ ...s, lastMessage: `NoteOff ${data1}` }));
            if (currentNoteRef.current === data1) currentNoteRef.current = null;
          } else if ((status & 0xf0) === 0xb0) {
            // Control Change: All Notes Off (123) or All Sound Off (120)
            if (data1 === 123 || data1 === 120) {
              onAllNotesOff?.();
            }
          }
        };
      });
      setState({ enabled: true, inputs });
    } catch (e) {
      setState({ enabled: false, inputs: [], lastMessage: 'MIDI access denied' });
    }
  }, [onNoteOff, onNoteOn]);

  useEffect(() => {
    return () => {
      // cleanup listeners
      accessRef.current?.inputs.forEach((input) => (input.onmidimessage = null));
    };
  }, []);

  return { state, enable } as const;
}
