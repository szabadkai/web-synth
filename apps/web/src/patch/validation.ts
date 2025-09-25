import type { Patch } from '../state/synthStore';

export function isPatch(value: unknown): value is Patch {
  if (typeof value !== 'object' || value === null) return false;
  const v: any = value;
  // basic shape checks
  const validOsc =
    v.osc &&
    typeof v.osc.freq === 'number' &&
    ['sine', 'square', 'sawtooth', 'triangle'].includes(v.osc.wave);
  const validFilter =
    v.filter &&
    typeof v.filter.cutoff === 'number' &&
    typeof v.filter.q === 'number' &&
    ['lowpass', 'highpass', 'bandpass', 'notch', 'peaking', 'lowshelf', 'highshelf'].includes(
      v.filter.type
    );
  const validEnv =
    v.env &&
    typeof v.env.attack === 'number' &&
    typeof v.env.decay === 'number' &&
    typeof v.env.sustain === 'number' &&
    typeof v.env.release === 'number';
  const validMaster = typeof v.masterGain === 'number';
  return Boolean(validOsc && validFilter && validEnv && validMaster);
}

export function clampPatch(patch: Patch): Patch {
  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
  return {
    osc: {
      wave: patch.osc.wave,
      freq: clamp(patch.osc.freq, 20, 20000),
    },
    filter: {
      type: patch.filter.type,
      cutoff: clamp(patch.filter.cutoff, 20, 20000),
      q: clamp(patch.filter.q, 0.0001, 40),
    },
    env: {
      attack: clamp(patch.env.attack, 0, 10),
      decay: clamp(patch.env.decay, 0, 10),
      sustain: clamp(patch.env.sustain, 0, 1),
      release: clamp(patch.env.release, 0, 10),
    },
    masterGain: clamp(patch.masterGain, 0, 1),
  };
}

