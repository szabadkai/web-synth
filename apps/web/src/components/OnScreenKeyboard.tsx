import React from 'react';
import { mtof, noteName } from '../audio/midi';

type Props = {
  onNoteOn: (freq: number, tag?: string) => void;
  onNoteOff: (freq: number, tag?: string) => void;
};

const NOTES = [60, 62, 64, 65, 67, 69, 71, 72]; // C4..C5 major

export default function OnScreenKeyboard({ onNoteOn, onNoteOff }: Props) {
  return (
    <div className="keyboard" role="group" aria-label="On-screen keyboard" style={{ display: 'flex', gap: 8 }}>
      {NOTES.map((n) => (
        <Key key={n} midi={n} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
      ))}
    </div>
  );
}

function Key({
  midi,
  onNoteOn,
  onNoteOff,
}: {
  midi: number;
  onNoteOn: (f: number, tag?: string) => void;
  onNoteOff: (f: number, tag?: string) => void;
}) {
  const freq = mtof(midi);
  const label = noteName(midi);
  return (
    <button
      className="btn"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onNoteOn(freq, `osk-${midi}`);
      }}
      onPointerUp={(e) => {
        onNoteOff(freq, `osk-${midi}`);
        try {
          (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerCancel={() => onNoteOff(freq, `osk-${midi}`)}
      onPointerLeave={(e) => {
        if ((e.buttons & 1) === 1) onNoteOff(freq, `osk-${midi}`);
      }}
      aria-label={`Key ${label}`}
    >
      {label}
    </button>
  );
}
