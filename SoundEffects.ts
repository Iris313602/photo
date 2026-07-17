/**
 * Synthetic retro camera sound effects using browser Web Audio API.
 * 100% offline, zero network dependencies, perfectly responsive.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume audio context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays a vintage mechanical shutter click.
   * Consists of:
   * 1. A short high-frequency tick (the metallic shutter trigger)
   * 2. A burst of white noise for the main shutter release
   * 3. A rapid secondary click for the shutter closing
   */
  public playShutter() {
    try {
      this.init();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      // 1. First metal snap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1500, now);
      osc1.frequency.exponentialRampToValueAtTime(100, now + 0.04);
      
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // 2. White noise shutter sound
      const bufferSize = ctx.sampleRate * 0.12; // 0.12 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.12);

      // 3. Winding/Advancing sound slightly delayed
      setTimeout(() => this.playWinding(), 200);

    } catch (e) {
      console.warn('Web Audio playback failed', e);
    }
  }

  /**
   * Plays a vintage camera motor film advance click/whirr
   */
  public playWinding() {
    try {
      this.init();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      // Series of short quick pulses (gears turning)
      for (let i = 0; i < 4; i++) {
        const pulseTime = now + (i * 0.06);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(250 + (i * 40), pulseTime);
        
        gain.gain.setValueAtTime(0.08, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(pulseTime);
        osc.stop(pulseTime + 0.045);
      }
    } catch (e) {}
  }

  /**
   * Plays a physical alert bell when film is fully developed
   */
  public playDevelopmentBell() {
    try {
      this.init();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // High-pitched clean bell (A5)
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now); // Perfect fifth harmony (E6)

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long sustain

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {}
  }

  /**
   * Play a clean electronic focus lock sound
   */
  public playBeep() {
    try {
      this.init();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
}

export const sounds = new SoundSynthesizer();
