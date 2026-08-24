/**
 * DOS audio engine.
 *
 * Everything here produces *real* sound — there is no faked playback anywhere
 * in this portfolio. Tracks are generated live with the Web Audio API rather
 * than streamed, which keeps the payload at zero bytes and sidesteps licensing.
 *
 * The `TrackSource` union is the seam for a future real backend: add
 * `{ kind: "url", src }` handling in `startTrack` and the rest of the app
 * (transport, seeking, volume, waveform, mini-player) works unchanged.
 */

export type TrackSource =
  | { kind: "synth"; recipe: Recipe }
  | { kind: "url"; src: string };

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  hue: number; // drives the procedural cover art
  source: TrackSource;
};

type Recipe = {
  bpm: number;
  /** MIDI note numbers for the chord of each bar in the progression. */
  progression: number[][];
  /** relative weight of the plucked arpeggio voice, 0 = pad only */
  arp: number;
  /** low-pass cutoff for the pad, Hz */
  cutoff: number;
  /** breathy noise bed level, 0..1 */
  air: number;
};

const midiToFreq = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export const TRACKS: Track[] = [
  {
    id: "cold-boot",
    title: "Cold Boot",
    artist: "DOS System Audio",
    album: "Idle Cycles",
    duration: 192,
    hue: 42,
    source: {
      kind: "synth",
      recipe: {
        bpm: 76,
        progression: [
          [45, 52, 57, 64],
          [43, 50, 55, 62],
          [41, 48, 53, 60],
          [43, 50, 55, 59],
        ],
        arp: 0.35,
        cutoff: 1100,
        air: 0.1,
      },
    },
  },
  {
    id: "tree-walk",
    title: "Tree Walk",
    artist: "DOS System Audio",
    album: "Idle Cycles",
    duration: 168,
    hue: 168,
    source: {
      kind: "synth",
      recipe: {
        bpm: 92,
        progression: [
          [50, 57, 62, 69],
          [48, 55, 60, 67],
          [53, 60, 65, 72],
          [50, 57, 64, 69],
        ],
        arp: 0.8,
        cutoff: 1700,
        air: 0.06,
      },
    },
  },
  {
    id: "handshake",
    title: "Handshake",
    artist: "DOS System Audio",
    album: "Idle Cycles",
    duration: 214,
    hue: 208,
    source: {
      kind: "synth",
      recipe: {
        bpm: 64,
        progression: [
          [41, 48, 55, 60],
          [46, 53, 60, 65],
          [43, 50, 57, 62],
          [48, 55, 62, 67],
        ],
        arp: 0.18,
        cutoff: 900,
        air: 0.16,
      },
    },
  },
  {
    id: "null-terminator",
    title: "Null Terminator",
    artist: "DOS System Audio",
    album: "Idle Cycles",
    duration: 176,
    hue: 12,
    source: {
      kind: "synth",
      recipe: {
        bpm: 82,
        progression: [
          [40, 47, 52, 59],
          [40, 47, 54, 59],
          [38, 45, 50, 57],
          [43, 50, 55, 62],
        ],
        arp: 0.45,
        cutoff: 1300,
        air: 0.08,
      },
    },
  },
  {
    id: "garbage-collector",
    title: "Garbage Collector",
    artist: "DOS System Audio",
    album: "Idle Cycles",
    duration: 158,
    hue: 96,
    source: {
      kind: "synth",
      recipe: {
        bpm: 104,
        progression: [
          [48, 55, 60, 67],
          [46, 53, 58, 65],
          [51, 58, 63, 70],
          [46, 53, 60, 65],
        ],
        arp: 0.95,
        cutoff: 2000,
        air: 0.05,
      },
    },
  },
];

/* ── engine ──────────────────────────────────────────────────── */

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.18;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private recipe: Recipe | null = null;
  private timer: number | null = null;
  private nextBarTime = 0;
  private barIndex = 0;
  /** audioContext time at which position 0 of the current track occurred */
  private originTime = 0;
  private pausedAt = 0;
  private playing = false;

  private volume = 0.6;
  private enabled = true;

  /** Lazily create the context — browsers require a user gesture first. */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const master = ctx.createGain();
    const music = ctx.createGain();
    const sfx = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;

    music.connect(analyser);
    analyser.connect(master);
    sfx.connect(master);
    master.connect(ctx.destination);

    master.gain.value = this.enabled ? this.volume : 0;
    music.gain.value = 0.7;
    sfx.gain.value = 0.32;

    this.ctx = ctx;
    this.master = master;
    this.musicBus = music;
    this.sfxBus = sfx;
    this.analyser = analyser;
    return ctx;
  }

  resume() {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.setVolume(this.volume);
  }

  getAnalyser() {
    return this.analyser;
  }

  get isPlaying() {
    return this.playing;
  }

  /** Real playback position in seconds. */
  position(): number {
    if (!this.ctx || !this.playing) return this.pausedAt;
    return this.ctx.currentTime - this.originTime;
  }

  play(track: Track, from = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    this.resume();
    if (track.source.kind !== "synth") return; // url backend: future work
    this.stopScheduler();

    this.recipe = track.source.recipe;
    this.pausedAt = from;
    this.originTime = ctx.currentTime - from;
    this.playing = true;

    const secPerBar = (60 / this.recipe.bpm) * 4;
    this.barIndex = Math.floor(from / secPerBar);
    this.nextBarTime = this.originTime + this.barIndex * secPerBar;
    if (this.nextBarTime < ctx.currentTime) this.nextBarTime = ctx.currentTime + 0.02;

    this.timer = window.setInterval(() => this.tick(), LOOKAHEAD_MS);
  }

  pause() {
    if (!this.playing) return;
    this.pausedAt = this.position();
    this.playing = false;
    this.stopScheduler();
  }

  stop() {
    this.playing = false;
    this.pausedAt = 0;
    this.stopScheduler();
  }

  private stopScheduler() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const ctx = this.ctx;
    const recipe = this.recipe;
    if (!ctx || !recipe || !this.musicBus) return;
    const secPerBar = (60 / recipe.bpm) * 4;
    while (this.nextBarTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleBar(this.barIndex, this.nextBarTime, secPerBar, recipe);
      this.barIndex += 1;
      this.nextBarTime += secPerBar;
    }
  }

  private scheduleBar(bar: number, at: number, secPerBar: number, recipe: Recipe) {
    const ctx = this.ctx!;
    const out = this.musicBus!;
    const chord = recipe.progression[bar % recipe.progression.length];

    // pad: detuned saw pair per chord tone through a shared low-pass
    const padGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(recipe.cutoff * 0.6, at);
    filter.frequency.linearRampToValueAtTime(recipe.cutoff, at + secPerBar * 0.45);
    filter.frequency.linearRampToValueAtTime(recipe.cutoff * 0.6, at + secPerBar);
    filter.Q.value = 0.7;

    padGain.gain.setValueAtTime(0, at);
    padGain.gain.linearRampToValueAtTime(0.16, at + secPerBar * 0.35);
    padGain.gain.setTargetAtTime(0, at + secPerBar * 0.72, secPerBar * 0.2);

    padGain.connect(filter);
    filter.connect(out);

    chord.forEach((note, i) => {
      [-4, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sawtooth";
        osc.frequency.value = midiToFreq(note);
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.5 : 0.22;
        osc.connect(g);
        g.connect(padGain);
        osc.start(at);
        osc.stop(at + secPerBar + 0.6);
      });
    });

    // plucked arpeggio — deterministic per bar so a seek reproduces the same music
    if (recipe.arp > 0.05) {
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        const r = pseudoRandom(bar * 31 + s * 7);
        if (r > recipe.arp) continue;
        const note = chord[(s + bar) % chord.length] + (r > recipe.arp * 0.7 ? 12 : 0);
        const t = at + (s / steps) * secPerBar;
        this.pluck(midiToFreq(note), t, 0.075 * recipe.arp, out);
      }
    }

    // air bed
    if (recipe.air > 0.01 && bar % 2 === 0) {
      const noise = ctx.createBufferSource();
      const len = Math.ceil(ctx.sampleRate * secPerBar * 2);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(recipe.air * 0.5, at + secPerBar * 0.6);
      g.gain.linearRampToValueAtTime(0, at + secPerBar * 2);
      noise.connect(bp);
      bp.connect(g);
      g.connect(out);
      noise.start(at);
      noise.stop(at + secPerBar * 2 + 0.1);
    }
  }

  private pluck(freq: number, at: number, level: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.85);
    osc.connect(g);
    g.connect(dest);
    osc.start(at);
    osc.stop(at + 0.9);
  }

  /** Short interface sounds. No-ops silently when audio is disabled. */
  sfx(kind: "open" | "close" | "click" | "boot" | "error") {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxBus) return;
    this.resume();
    const t = ctx.currentTime;
    const out = this.sfxBus;

    const blip = (freq: number, start: number, dur: number, type: OscillatorType, lvl = 0.5) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(lvl, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(out);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      return osc;
    };

    switch (kind) {
      case "open":
        blip(660, t, 0.13, "sine", 0.4).frequency.exponentialRampToValueAtTime(990, t + 0.1);
        break;
      case "close":
        blip(520, t, 0.11, "sine", 0.32).frequency.exponentialRampToValueAtTime(300, t + 0.09);
        break;
      case "click":
        blip(1400, t, 0.045, "square", 0.11);
        break;
      case "error":
        blip(180, t, 0.16, "square", 0.22);
        break;
      case "boot":
        [261.63, 392, 523.25, 659.25].forEach((f, i) =>
          blip(f, t + i * 0.09, 1.1, "sine", 0.3 - i * 0.03),
        );
        break;
    }
  }
}

/** Deterministic hash-based noise so a seek reproduces identical music. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const audio = new AudioEngine();
