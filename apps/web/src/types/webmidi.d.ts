// Minimal Web MIDI typings used in this project
interface MIDIInputMap extends Map<string, MIDIInput> {}
interface MIDIOutputMap extends Map<string, MIDIOutput> {}

interface MIDIOptions {
  sysex?: boolean;
}

interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

interface MIDIInput extends EventTarget {
  id: string;
  name?: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => any) | null;
}

interface MIDIOutput {}

interface MIDIAccess extends EventTarget {
  inputs: MIDIInputMap;
  outputs: MIDIOutputMap;
  sysexEnabled: boolean;
}

interface Navigator {
  requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
}

