import React, { useEffect, useRef, useState } from 'react';
import Knob from './components/Knob';
import { useAudioEngine } from './hooks/useAudioEngine';
import { DEFAULT_PATCH, savePatchToStorage, loadPatchFromStorage, useSynthStore } from './state/synthStore';
import { clampPatch, isPatch } from './patch/validation';
import { useMidi } from './hooks/useMidi';
import OnScreenKeyboard from './components/OnScreenKeyboard';
import Waveform from './components/Waveform';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const { engine, running, start, stop, frequency, setFrequency, ensure } = useAudioEngine();
  const [supported, setSupported] = useState(true);
  const { patch, setOsc, setFilter, setEnv, setMaster, loadPatch, reset } = useSynthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onInit = async () => {
    try {
      await ensure();
    } catch (e) {
      console.error(e);
      setSupported(false);
    }
  };

  // Safety: stop all sounds on window blur or when tab becomes hidden
  React.useEffect(() => {
    const onBlur = () => stop();
    const onHide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onBlur);
    };
  }, [stop]);

  const { state: midi, enable: enableMidi } = useMidi(
    (freq, _vel, tag) => start(freq, tag),
    (freq, tag) => stop(freq, tag),
    () => stop()
  );

  const { state: kbd, enable: enableKbd, disable: disableKbd, setOctave } = useKeyboard(
    (freq, tag) => start(freq, tag),
    (freq, tag) => stop(freq, tag)
  );

  // Load saved patch on mount
  useEffect(() => {
    const stored = loadPatchFromStorage();
    if (stored && isPatch(stored)) {
      loadPatch(clampPatch(stored));
    }
  }, [loadPatch]);

  // Persist on changes
  useEffect(() => {
    savePatchToStorage(patch);
  }, [patch]);

  const onExport = () => {
    const data = JSON.stringify(patch, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'websynth-patch.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!isPatch(json)) throw new Error('Invalid patch schema');
      loadPatch(clampPatch(json));
    } catch (e) {
      alert('Failed to import patch: ' + (e as Error).message);
    }
  };

  return (
    <div className="container">
      <div className="app">
        <header className="panel header">
          <h1>WebSynth Studio</h1>
          <p>Analogue-style synth. Oscillator, filter, ADSR, MIDI/keyboard, persistence, visualizer.</p>
        </header>

        <section className="panel toolbar">
          {!supported && <p role="alert">Web Audio API not supported in this browser.</p>}

          <button className="btn" onClick={onInit} aria-label="Initialize Audio">Initialize Audio</button>
          {!running ? (
            <button className="btn primary" onClick={() => start()} aria-label="Start">Play</button>
          ) : (
            <button className="btn" onClick={() => stop()} aria-label="Stop">Stop</button>
          )}

          <button className="btn" onClick={() => setFrequency(440)} aria-label="A4">A4 (440 Hz)</button>
          <button className="btn" onClick={() => setFrequency(261.63)} aria-label="C4">C4 (261.63 Hz)</button>

          <button className="btn" onClick={onExport} aria-label="Export Patch">Export Patch</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
            }}
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()} aria-label="Import Patch">Import Patch</button>
          <button className="btn" onClick={() => reset()} aria-label="Reset Patch">Reset</button>

          <button className="btn" onClick={enableMidi} aria-label="Enable MIDI">
            {midi.enabled ? 'MIDI Enabled' : 'Enable MIDI'}
          </button>
          {midi.enabled && midi.inputs.length > 0 && (
            <span aria-live="polite">Inputs: {midi.inputs.map((i) => i.name).join(', ')}</span>
          )}

          {!kbd.enabled ? (
            <button className="btn" onClick={enableKbd} aria-label="Enable Keyboard">Enable Keyboard</button>
          ) : (
            <>
              <button className="btn" onClick={disableKbd} aria-label="Disable Keyboard">Keyboard: Enabled</button>
              <label>
                Octave
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={kbd.octave}
                  onChange={(e) => setOctave(Number(e.target.value))}
                  style={{ width: 64, marginLeft: 4 }}
                  aria-label="Keyboard Octave"
                />
                <span style={{ marginLeft: 8 }}>(Z/X to adjust)</span>
              </label>
            </>
          )}
        </section>

        <main className="panel">
          <div className="grid">
            <section className="stack" aria-label="Oscillator">
              <h2 className="section-title">Oscillator</h2>
              <div className="controls">
                <label>
                  Waveform
                  <select
                    aria-label="Waveform"
                    value={patch.osc.wave}
                    onChange={(e) => setOsc({ wave: e.target.value as any })}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Saw</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </label>
              </div>
              <div className="controls">
                <Knob label="Frequency" value={frequency} min={50} max={2000} step={1} onChange={setFrequency} unit=" Hz" />
                <Knob label="Master" value={patch.masterGain * 100} min={0} max={100} step={1} onChange={(v) => setMaster(v / 100)} unit="%" />
              </div>
            </section>

            <section className="stack" aria-label="Filter">
              <h2 className="section-title">Filter</h2>
              <div className="controls">
                <label>
                  Type
                  <select
                    aria-label="Filter Type"
                    value={patch.filter.type}
                    onChange={(e) => setFilter({ type: e.target.value as any })}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="lowpass">Low-pass</option>
                    <option value="highpass">High-pass</option>
                    <option value="bandpass">Band-pass</option>
                  </select>
                </label>
              </div>
              <div className="controls">
                <Knob label="Cutoff" value={patch.filter.cutoff} min={50} max={8000} step={1} onChange={(v) => setFilter({ cutoff: v })} unit=" Hz" />
                <Knob label="Resonance" value={patch.filter.q} min={0.1} max={20} step={0.1} onChange={(v) => setFilter({ q: v })} />
              </div>
            </section>

            <section className="stack" aria-label="Envelope">
              <h2 className="section-title">Envelope (ADSR)</h2>
              <div className="controls">
                <Knob
                  label="Attack"
                  value={Math.round(patch.env.attack * 1000)}
                  min={0}
                  max={1000}
                  step={1}
                  onChange={(v) => setEnv({ attack: v / 1000 })}
                  unit=" ms"
                />
                <Knob
                  label="Decay"
                  value={Math.round(patch.env.decay * 1000)}
                  min={0}
                  max={1000}
                  step={1}
                  onChange={(v) => setEnv({ decay: v / 1000 })}
                  unit=" ms"
                />
                <Knob
                  label="Sustain"
                  value={Math.round(patch.env.sustain * 100)}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => setEnv({ sustain: v / 100 })}
                  unit=" %"
                />
                <Knob
                  label="Release"
                  value={Math.round(patch.env.release * 1000)}
                  min={0}
                  max={5000}
                  step={10}
                  onChange={(v) => setEnv({ release: v / 1000 })}
                  unit=" ms"
                />
              </div>
            </section>
          </div>
        </main>

        <footer className="panel wave-panel">
          <Waveform engine={engine} height={140} color="#7c3aed" background="#0f172a" />
          <div style={{ height: 12 }} />
          <div className="keyboard"><OnScreenKeyboard onNoteOn={(f, tag) => start(f, tag)} onNoteOff={(f, tag) => stop(f, tag)} /></div>
        </footer>
      </div>
    </div>
  );
}
