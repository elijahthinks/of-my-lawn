/**
 * Tiny synthesized sound effects. No audio files to license or bundle,
 * and everything is generated with Web Audio, which works in iOS WKWebView
 * once the player has touched the screen.
 */
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, endFreq: number, dur: number, type: OscillatorType, gain = 0.2, delay = 0): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function noise(dur: number, cutoff: number, gain = 0.25): void {
  const a = audio();
  if (!a) return;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  const filter = a.createBiquadFilter();
  const g = a.createGain();
  src.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  /** Call from a user gesture so iOS lets audio play. */
  unlock(): void {
    audio();
  },
  launch(): void {
    tone(220, 520, 0.18, "triangle", 0.12);
  },
  bark(): void {
    // Two gruff "ruff"s.
    tone(420, 180, 0.11, "sawtooth", 0.22);
    noise(0.09, 1400, 0.2);
    tone(380, 160, 0.12, "sawtooth", 0.2, 0.14);
  },
  thud(strength: number): void {
    tone(110, 50, 0.12, "sine", 0.15 + strength * 0.25);
  },
  crack(): void {
    noise(0.16, 2600, 0.22);
  },
  scared(): void {
    tone(700, 1500, 0.12, "square", 0.06);
  },
  win(): void {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, "triangle", 0.14, i * 0.12));
  },
  lose(): void {
    [392, 330, 262].forEach((f, i) => tone(f, f * 0.97, 0.25, "triangle", 0.12, i * 0.18));
  },
};
