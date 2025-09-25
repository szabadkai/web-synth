import { create } from 'zustand';

export type Envelope = {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0..1
  release: number; // seconds
};

export type Filter = {
  type: BiquadFilterType;
  cutoff: number; // Hz
  q: number; // resonance
};

export type Osc = {
  wave: OscillatorType;
  freq: number; // Hz
};

export type Patch = {
  osc: Osc;
  filter: Filter;
  env: Envelope;
  masterGain: number; // 0..1
};

export type SynthState = {
  patch: Patch;
  setOsc: (partial: Partial<Osc>) => void;
  setFilter: (partial: Partial<Filter>) => void;
  setEnv: (partial: Partial<Envelope>) => void;
  setMaster: (gain: number) => void;
  loadPatch: (p: Patch) => void;
  reset: () => void;
};

export const DEFAULT_PATCH: Patch = {
  osc: { wave: 'sawtooth', freq: 440 },
  filter: { type: 'lowpass', cutoff: 1200, q: 0.8 },
  env: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4 },
  masterGain: 0.2,
};

const STORAGE_KEY = 'websynth_patch_v1';

export const useSynthStore = create<SynthState>((set) => ({
  patch: DEFAULT_PATCH,
  setOsc: (partial) =>
    set((s) => ({ patch: { ...s.patch, osc: { ...s.patch.osc, ...partial } } })),
  setFilter: (partial) =>
    set((s) => ({ patch: { ...s.patch, filter: { ...s.patch.filter, ...partial } } })),
  setEnv: (partial) =>
    set((s) => ({ patch: { ...s.patch, env: { ...s.patch.env, ...partial } } })),
  setMaster: (gain) => set((s) => ({ patch: { ...s.patch, masterGain: gain } })),
  loadPatch: (p: Patch) => set(() => ({ patch: p })),
  reset: () => set(() => ({ patch: DEFAULT_PATCH })),
}));

export function savePatchToStorage(patch: Patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
  } catch {}
}

export function loadPatchFromStorage(): Patch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as Patch;
  } catch {
    return null;
  }
}

