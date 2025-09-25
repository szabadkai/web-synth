import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAudioEngine, type AudioEngine } from '../audio/engine';
import { useSynthStore } from '../state/synthStore';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [frequency, setFreqState] = useState(440);

  const engine = useMemo(() => {
    if (!engineRef.current) {
      const { patch } = useSynthStore.getState();
      engineRef.current = createAudioEngine({
        masterGain: patch.masterGain,
        wave: patch.osc.wave,
        filter: patch.filter,
        env: patch.env,
      });
    }
    return engineRef.current;
  }, []);

  const ensure = useCallback(async () => {
    await engine.ensureContext();
  }, [engine]);

  const start = useCallback(
    async (freq?: number, tag?: string) => {
      await ensure();
      const f = typeof freq === 'number' ? freq : frequency;
      engine.startNote(f, tag);
      setRunning(true);
    },
    [engine, ensure, frequency]
  );

  const stop = useCallback(
    (freq?: number, tag?: string) => {
      engine.stopNote(freq, tag);
      if (!engine.isRunning) setRunning(false);
    },
    [engine]
  );

  const setFrequency = useCallback(
    (f: number) => {
      setFreqState(f);
      engine.setFrequency(f);
    },
    [engine]
  );

  // Keep engine params in sync with store
  const patch = useSynthStore((s) => s.patch);
  useEffect(() => {
    engine.setWave(patch.osc.wave);
    engine.setFilter(patch.filter.type, patch.filter.cutoff, patch.filter.q);
    engine.setEnvelope(patch.env.attack, patch.env.decay, patch.env.sustain, patch.env.release);
    engine.setMasterGain(patch.masterGain);
  }, [engine, patch]);

  return { engine, running, start, stop, frequency, setFrequency, ensure } as const;
}
