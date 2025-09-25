export type EngineConfig = {
  masterGain?: number; // 0..1
  wave?: OscillatorType;
  filter?: { type: BiquadFilterType; cutoff: number; q: number };
  env?: { attack: number; decay: number; sustain: number; release: number };
};

export type AudioEngine = {
  isRunning: boolean;
  context(): AudioContext | null;
  ensureContext(): Promise<void>;
  startNote(frequency: number, tag?: string): void;
  stopNote(frequency?: number, tag?: string): void;
  setFrequency(freq: number): void;
  setWave(w: OscillatorType): void;
  setFilter(type: BiquadFilterType, cutoff: number, q: number): void;
  setEnvelope(a: number, d: number, s: number, r: number): void;
  setMasterGain(g: number): void;
  getAnalyser(): AnalyserNode | null;
};

function resolveAudioContext(): typeof AudioContext | null {
  // @ts-expect-error webkit fallback for Safari
  return window.AudioContext || window.webkitAudioContext || null;
}

export function createAudioEngine(config: EngineConfig = {}): AudioEngine {
  const Ctx = resolveAudioContext();
  let ctx: AudioContext | null = null;
  const MAX_VOICES = 8;
  type Voice = {
    osc: OscillatorNode;
    filter: BiquadFilterNode;
    amp: GainNode;
    noteHz: number;
    active: boolean;
    startedAt: number;
    tag?: string;
  };
  let master: GainNode | null = null;
  let mix: GainNode | null = null; // mix bus prior to master
  let analyser: AnalyserNode | null = null;
  let voices: (Voice | null)[] = new Array(MAX_VOICES).fill(null);
  let lastVoiceIndex: number | null = null;

  let params = {
    masterGain: Math.min(Math.max(config.masterGain ?? 0.2, 0), 1),
    wave: config.wave ?? 'sawtooth',
    filter: {
      type: config.filter?.type ?? 'lowpass',
      cutoff: config.filter?.cutoff ?? 1200,
      q: config.filter?.q ?? 0.8,
    },
    env: {
      attack: config.env?.attack ?? 0.01,
      decay: config.env?.decay ?? 0.2,
      sustain: config.env?.sustain ?? 0.7,
      release: config.env?.release ?? 0.4,
    },
  } as const;

  async function ensureContext() {
    if (!Ctx) throw new Error('Web Audio API not supported in this browser');
    if (!ctx) {
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = params.masterGain;
      master.connect(ctx.destination);

      // Mix/analyser/master chain
      mix = ctx.createGain();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      mix.connect(analyser);
      analyser.connect(master);
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  function context(): AudioContext | null {
    return ctx;
  }

  function startNote(frequency: number, tag?: string) {
    if (!ctx || !mix) return;
    // If a voice with the same tag is active, just retune it and return
    if (tag) {
      const existingIndex = voices.findIndex((v) => v && v.active && v.tag === tag);
      if (existingIndex >= 0) {
        const v = voices[existingIndex]!;
        v.osc.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.01);
        v.noteHz = frequency;
        lastVoiceIndex = existingIndex;
        return;
      }
    }
    // find free voice
    let idx = voices.findIndex((v) => v === null || v.active === false);
    if (idx === -1) {
      // steal oldest active voice
      let oldestTime = Number.POSITIVE_INFINITY;
      let oldestIndex = 0;
      voices.forEach((v, i) => {
        if (v && v.startedAt < oldestTime) {
          oldestTime = v.startedAt;
          oldestIndex = i;
        }
      });
      idx = oldestIndex;
      // stop the stolen voice immediately
      safeReleaseVoice(idx, 0.02);
    }

    const v = createOrReuseVoice(idx, frequency, tag);
    if (!v) return;
    // ADSR attack/decay to sustain
    const now = ctx.currentTime;
    v.amp.gain.cancelScheduledValues(now);
    v.amp.gain.setValueAtTime(v.amp.gain.value, now);
    v.amp.gain.linearRampToValueAtTime(1, now + Math.max(0.001, (params as any).env.attack));
    v.amp.gain.linearRampToValueAtTime(
      (params as any).env.sustain,
      now + Math.max(0.001, (params as any).env.attack) + Math.max(0.001, (params as any).env.decay)
    );
    lastVoiceIndex = idx;
  }

  function stopNote(frequency?: number, tag?: string) {
    if (!ctx) return;
    if (typeof frequency !== 'number') {
      // release all
      voices.forEach((_, i) => safeReleaseVoice(i, (params as any).env.release));
      return;
    }
    // Prefer matching by tag when provided
    let matchIndex: number | null = null;
    if (tag) {
      voices.forEach((v, i) => {
        if (v && v.active && v.tag === tag) matchIndex = i;
      });
    }
    if (matchIndex == null) {
      // release closest matching note (within tolerance)
      const tol = 3.0; // Hz tolerance to match voices even after small retunes
      voices.forEach((v, i) => {
        if (v && v.active && Math.abs(v.noteHz - frequency) <= tol) matchIndex = i;
      });
    }
    if (matchIndex != null) safeReleaseVoice(matchIndex, (params as any).env.release);
  }

  function setFrequency(freq: number) {
    if (!ctx) return;
    if (lastVoiceIndex != null) {
      const v = voices[lastVoiceIndex];
      if (v) {
        v.osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.01);
        v.noteHz = freq;
      }
    }
  }

  function setWave(w: OscillatorType) {
    voices.forEach((v) => {
      if (v?.osc) v.osc.type = w;
    });
    (params as any).wave = w;
  }

  function setFilter(type: BiquadFilterType, cutoff: number, q: number) {
    voices.forEach((v) => {
      if (!v) return;
      v.filter.type = type;
      v.filter.frequency.setTargetAtTime(cutoff, v.filter.context.currentTime, 0.02);
      v.filter.Q.setTargetAtTime(q, v.filter.context.currentTime, 0.02);
    });
    (params as any).filter = { type, cutoff, q };
  }

  function setEnvelope(a: number, d: number, s: number, r: number) {
    (params as any).env = { attack: a, decay: d, sustain: s, release: r };
    if (!ctx) return;
    const now = ctx.currentTime;
    voices.forEach((v) => {
      if (!v) return;
      const since = now - v.startedAt;
      const attack = Math.max(0.001, a);
      const decay = Math.max(0.001, d);

      v.amp.gain.cancelScheduledValues(now);
      const current = v.amp.gain.value;
      v.amp.gain.setValueAtTime(current, now);

      if (since < attack) {
        // still in attack: continue to 1 with remaining time, then decay to sustain
        const remainingA = Math.max(0.0, attack - since);
        v.amp.gain.linearRampToValueAtTime(1, now + remainingA);
        v.amp.gain.linearRampToValueAtTime(s, now + remainingA + decay);
      } else if (since < attack + decay) {
        // in decay: ramp to sustain with remaining decay
        const remainingD = Math.max(0.0, attack + decay - since);
        v.amp.gain.linearRampToValueAtTime(s, now + remainingD);
      } else {
        // sustain stage: glide to new sustain quickly
        v.amp.gain.setTargetAtTime(s, now, 0.05);
      }
    });
  }

  function setMasterGain(g: number) {
    if (master) master.gain.setTargetAtTime(g, master.context.currentTime, 0.05);
    (params as any).masterGain = g;
  }

  function getAnalyser(): AnalyserNode | null {
    return analyser;
  }

  function createOrReuseVoice(index: number, frequency: number, tag?: string): Voice | null {
    if (!ctx || !mix) return null;
    const existing = voices[index];
    if (existing) {
      // reconnect in case
      existing.osc.disconnect();
      existing.filter.disconnect();
      existing.amp.disconnect();
      try { /* noop */ } catch {}
    }

    const osc = ctx.createOscillator();
    osc.type = (params as any).wave;
    osc.frequency.value = frequency;

    const filter = ctx.createBiquadFilter();
    filter.type = (params as any).filter.type;
    filter.frequency.value = (params as any).filter.cutoff;
    filter.Q.value = (params as any).filter.q;

    const amp = ctx.createGain();
    amp.gain.value = 0;

    // wiring: osc -> filter -> amp -> mix
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(mix);

    const v: Voice = {
      osc,
      filter,
      amp,
      noteHz: frequency,
      active: true,
      startedAt: ctx.currentTime,
      tag,
    };
    const startTime = ctx.currentTime + 0.001;
    osc.start(startTime);
    voices[index] = v;
    return v;
  }

  function safeReleaseVoice(index: number, release: number) {
    const v = voices[index];
    if (!ctx || !v) return;
    v.active = false;
    const now = ctx.currentTime;
    v.amp.gain.cancelScheduledValues(now);
    v.amp.gain.setValueAtTime(v.amp.gain.value, now);
    v.amp.gain.linearRampToValueAtTime(0, now + Math.max(0.001, release));
    const stopAt = now + Math.max(0.01, release) + 0.005;
    try {
      v.osc.stop(stopAt);
    } catch {}
    setTimeout(() => {
      try {
        v.osc.disconnect();
        v.filter.disconnect();
        v.amp.disconnect();
      } catch {}
      voices[index] = null;
    }, (stopAt - now) * 1000 + 10);
  }

  return {
    get isRunning() {
      return voices.some((v) => v && v.active);
    },
    context,
    ensureContext,
    startNote,
    stopNote,
    setFrequency,
    setWave,
    setFilter,
    setEnvelope,
    setMasterGain,
    getAnalyser,
  };
}
