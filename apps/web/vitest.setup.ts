import '@testing-library/jest-dom/vitest';

// Provide a very small stub for Web Audio to avoid reference errors in tests
class AudioContextStub {
  public currentTime = 0;
  public state: 'running' | 'suspended' | 'closed' = 'running';
  resume = async () => undefined;
  destination = {} as any;
  createGain() {
    return { gain: { value: 1 }, connect: () => undefined } as any;
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 0, setTargetAtTime: () => undefined },
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
      disconnect: () => undefined,
    } as any;
  }
  createBiquadFilter() {
    const ctx = this as any;
    return {
      type: 'lowpass',
      frequency: { value: 0, setTargetAtTime: () => undefined },
      Q: { value: 0, setTargetAtTime: () => undefined },
      context: ctx,
      connect: () => undefined,
    } as any;
  }
  createAnalyser() {
    const data = new Uint8Array(1024);
    return {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      getByteTimeDomainData: (arr: Uint8Array) => arr.set(data),
      connect: () => undefined,
      context: this as any,
    } as any;
  }
}

// @ts-ignore
window.AudioContext = AudioContextStub as any;
