/**
 * Procedural Web Audio API sound synthesizer for Tamil Nadu Bus Simulator
 * 100% Zero-404 procedural audio synthesis: engine, Indian air horn, air brakes, siren, whistle, puncture.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Sound channels
  private engineGain: GainNode | null = null;
  private hornGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineNoiseNode: AudioNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Rain noise node
  private rainNode: AudioNode | null = null;
  private isRaining: boolean = false;

  // Active horn nodes
  private activeHornNodes: OscillatorNode[] = [];

  // Active siren node
  private sirenOsc: OscillatorNode | null = null;
  private sirenTimer: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub gains
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.hornGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);
    } catch (e) {
      console.warn('AudioContext failed to initialize', e);
    }
  }

  public setVolumes(master: number, engine: number, horn: number, ambience: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : master, now, 0.05);
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(engine, now, 0.05);
    if (this.hornGain) this.hornGain.gain.setTargetAtTime(horn, now, 0.05);
    if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(ambience, now, 0.05);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Start procedural diesel engine loop
   */
  public startEngine() {
    this.initContext();
    if (!this.ctx || this.isEngineRunning || !this.engineGain) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Low frequency pulse oscillator (cylinder stroke simulation)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(32, now); // ~750 RPM idle

      // 2. Harmonic rumble oscillator
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(64, now);

      // Lowpass filter for heavy diesel engine enclosure sound
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, now);
      this.engineFilter.Q.setValueAtTime(2.5, now);

      // Engine white noise buffer for exhaust hiss
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(90, now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.engineGain);
      noiseSource.start();
      this.engineNoiseNode = noiseSource;

      // Connect oscillators through filter
      const subMix = this.ctx.createGain();
      subMix.gain.setValueAtTime(0.4, now);

      this.engineOsc1.connect(subMix);
      this.engineOsc2.connect(subMix);
      subMix.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);

      this.engineOsc1.start();
      this.engineOsc2.start();

      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Could not start procedural engine', e);
    }
  }

  /**
   * Modulate engine pitch and filter cutoff based on speed (0 - 90 km/h) and RPM
   */
  public updateEngine(speedKmh: number, rpmNormalized: number) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    const baseFreq = 30 + rpmNormalized * 65 + (speedKmh / 90) * 35;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.08);

    // Increase filter cutoff for throaty acceleration growl
    const cutoff = 130 + rpmNormalized * 280 + (speedKmh / 90) * 150;
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.08);
  }

  public stopEngine() {
    if (this.engineOsc1) {
      try { this.engineOsc1.stop(); } catch { /* ignore */ }
      this.engineOsc1.disconnect();
      this.engineOsc1 = null;
    }
    if (this.engineOsc2) {
      try { this.engineOsc2.stop(); } catch { /* ignore */ }
      this.engineOsc2.disconnect();
      this.engineOsc2 = null;
    }
    if (this.engineNoiseNode) {
      try { (this.engineNoiseNode as AudioScheduledSourceNode).stop(); } catch { /* ignore */ }
      this.engineNoiseNode.disconnect();
      this.engineNoiseNode = null;
    }
    this.isEngineRunning = false;
  }

  /**
   * Iconic Indian Tamil Nadu dual/triple tone air horn!
   * Musical blast reminiscent of Indian highway buses ("Paaa-Paaa-Pooo!")
   */
  public playIndianBusHorn() {
    this.initContext();
    if (!this.ctx || !this.hornGain) return;

    this.stopHorn(); // Stop any currently playing horn

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (Major triad trumpet chord)

    const hornMaster = this.ctx.createGain();
    hornMaster.gain.setValueAtTime(0, now);
    hornMaster.gain.linearRampToValueAtTime(0.85, now + 0.04);
    hornMaster.gain.setValueAtTime(0.85, now + 0.45);
    hornMaster.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    hornMaster.connect(this.hornGain);

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Pitch vibrato/slide for brassy trumpet horn character
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.2, now);
      filter.Q.setValueAtTime(1.5, now);

      osc.connect(filter);
      filter.connect(hornMaster);

      osc.start(now);
      osc.stop(now + 0.7);
      this.activeHornNodes.push(osc);
    });

    setTimeout(() => {
      this.activeHornNodes = [];
    }, 700);
  }

  public stopHorn() {
    this.activeHornNodes.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch { /* ignore */ }
    });
    this.activeHornNodes = [];
  }

  /**
   * Air Brake pneumatic discharge hiss ("Pshhh!")
   */
  public playAirBrakeSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.45;
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  /**
   * Brake squeal for heavy stops
   */
  public playBrakeSqueal() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * Conductor's traditional double whistle / bell ("Right, Right!")
   */
  public playConductorWhistle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [0, 0.18].forEach((delay) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(2450, now + delay + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.45, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  /**
   * Bus pneumatic passenger door opening/closing
   */
  public playDoorSound(isOpening: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.5;
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isOpening ? 400 : 900, now);
    filter.frequency.linearRampToValueAtTime(isOpening ? 1100 : 350, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Speeding Police siren (repeating dual-tone emergency wail)
   */
  public playPoliceSiren(durationSeconds: number = 3.5) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    this.stopPoliceSiren();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);

    // LFO to modulate siren frequency between 600Hz and 950Hz
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.8, now); // ~2 wails per second

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
    gain.gain.setValueAtTime(0.4, now + durationSeconds - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    lfo.start(now);

    osc.stop(now + durationSeconds);
    lfo.stop(now + durationSeconds);

    this.sirenOsc = osc;
    this.sirenTimer = window.setTimeout(() => {
      this.sirenOsc = null;
      this.sirenTimer = null;
    }, durationSeconds * 1000);
  }

  public stopPoliceSiren() {
    if (this.sirenOsc) {
      try { this.sirenOsc.stop(); } catch { /* ignore */ }
      this.sirenOsc = null;
    }
    if (this.sirenTimer) {
      clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
  }

  /**
   * Tyre Puncture blowout sound & continuous hiss
   */
  public playPunctureSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // 1. Initial "POP" impact
    const popOsc = this.ctx.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(140, now);
    popOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.7, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + 0.2);

    // 2. High frequency air escaping hiss
    const hissDuration = 1.8;
    const bufferSize = this.ctx.sampleRate * hissDuration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const hissSource = this.ctx.createBufferSource();
    hissSource.buffer = noiseBuffer;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.setValueAtTime(3200, now);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.5, now);
    hissGain.gain.exponentialRampToValueAtTime(0.01, now + hissDuration);

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.sfxGain);

    hissSource.start(now);
    hissSource.stop(now + hissDuration);
  }

  /**
   * Rain ambience synthesizer
   */
  public setRain(enabled: boolean) {
    this.initContext();
    if (!this.ctx || !this.ambienceGain) return;

    if (enabled && !this.isRaining) {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const rainBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = rainBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(1400, now);
      rainFilter.Q.setValueAtTime(0.8, now);

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(0.2, now);

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.ambienceGain);

      rainSource.start();
      this.rainNode = rainSource;
      this.isRaining = true;
    } else if (!enabled && this.isRaining) {
      if (this.rainNode) {
        try { (this.rainNode as AudioScheduledSourceNode).stop(); } catch { /* ignore */ }
        this.rainNode.disconnect();
        this.rainNode = null;
      }
      this.isRaining = false;
    }
  }

  /**
   * Refuel sound (fuel pump click and liquid gushing)
   */
  public playRefuelSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Mechanical pump nozzle click
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Cash / Fare collection chime
   */
  public playCashChime() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(g);
      g.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  /**
   * Vehicle crash / collision metal crunch and impact sound
   */
  public playCrashSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // 1. Heavy low impact thud
    const thud = this.ctx.createOscillator();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.9, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.4);

    // 2. Metal scrape & glass crunch noise burst
    const duration = 0.5;
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.linearRampToValueAtTime(450, now + duration);
    filter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }
}

export const sound = new SoundManager();

