// Romantic Music Box & Ambient Harp Synthesizer for Aether Love
class RomanticAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private intervalId: any = null;
  private onTimeUpdateCallback: ((currentSec: number, durationSec: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private durationSec: number = 84; // 1m 24s matching the letter voice note
  private elapsedSec: number = 0;
  private timerStart: number = 0;

  // Romantic Pentatonic/Lydian Chime Notes (Hz)
  private notes = [
    261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00
  ];
  private melodyPattern = [
    0, 2, 4, 7, 5, 4, 2, 0,
    3, 5, 7, 9, 7, 5, 3, 2,
    4, 6, 8, 7, 5, 4, 3, 2,
    1, 3, 5, 7, 4, 2, 0, 0
  ];

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public async play(
    onTimeUpdate: (currentSec: number, durationSec: number) => void,
    onEnded: () => void
  ) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndCallback = onEnded;
    this.isPlaying = true;
    this.timerStart = Date.now() - (this.elapsedSec * 1000);

    // Play chime notes at tempo
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;

      this.elapsedSec = Math.floor((Date.now() - this.timerStart) / 1000);
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.elapsedSec, this.durationSec);
      }

      if (this.elapsedSec >= this.durationSec) {
        this.stop();
        if (this.onEndCallback) this.onEndCallback();
        return;
      }

      // Play soft bell/chime note
      const noteIdx = this.melodyPattern[this.currentStep % this.melodyPattern.length];
      const freq = this.notes[noteIdx % this.notes.length];
      this.playChime(freq);

      // Play occasional gentle bass root
      if (this.currentStep % 4 === 0) {
        this.playSoftBass(freq / 2);
      }

      this.currentStep++;
    }, 450);
  }

  private playChime(freq: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {
      // Audio fallback fail-safe
    }
  }

  private playSoftBass(freq: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.8);
    } catch (e) {
      // safe ignore
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public stop() {
    this.pause();
    this.elapsedSec = 0;
    this.currentStep = 0;
  }

  public seek(targetRatio: number) {
    this.elapsedSec = Math.floor(targetRatio * this.durationSec);
    this.timerStart = Date.now() - (this.elapsedSec * 1000);
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.elapsedSec, this.durationSec);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const romanticSynth = new RomanticAudioSynthesizer();
