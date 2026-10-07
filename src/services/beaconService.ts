type StrobeCallback = (active: boolean, color: string) => void;

class RescueBeaconService {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isAudioRunning = false;
  private audioTimer: any = null;

  private isVisualRunning = false;
  private visualTimer: any = null;
  private videoTrack: MediaStreamTrack | null = null;
  private strobeListeners: Set<StrobeCallback> = new Set();

  /**
   * Initializes or resumes AudioContext upon user gesture.
   */
  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public subscribeStrobe(callback: StrobeCallback): () => void {
    this.strobeListeners.add(callback);
    return () => this.strobeListeners.delete(callback);
  }

  private notifyStrobe(active: boolean, color: string = '#ffffff') {
    this.strobeListeners.forEach(fn => fn(active, color));
  }

  /**
   * Toggles acoustic distress siren buzzer.
   */
  public toggleAudioBeacon(volume: number = 0.8): boolean {
    if (this.isAudioRunning) {
      this.stopAudioBeacon();
      return false;
    } else {
      this.startAudioBeacon(volume);
      return true;
    }
  }

  public isAudioActive(): boolean {
    return this.isAudioRunning;
  }

  public isVisualActive(): boolean {
    return this.isVisualRunning;
  }

  public startAudioBeacon(volume: number = 0.8) {
    try {
      this.stopAudioBeacon();
      const ctx = this.getAudioContext();
      this.isAudioRunning = true;

      // Siren warble loop: oscillates between 1000Hz and 2200Hz
      let step = 0;
      const playBeep = () => {
        if (!this.isAudioRunning) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High penetration square/sawtooth harmonic waveform
        osc.type = 'sawtooth';

        const now = ctx.currentTime;
        // Frequency sweep for acoustic penetration through concrete/water
        const freq = step % 2 === 0 ? 1400 : 2100;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(step % 2 === 0 ? 2200 : 1200, now + 0.35);

        gain.gain.setValueAtTime(Math.min(volume, 1.0), now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);

        step++;
        // Repeat every 450ms
        this.audioTimer = setTimeout(playBeep, 450);
      };

      playBeep();
    } catch (err) {
      console.warn('Audio beacon activation failed:', err);
      this.isAudioRunning = false;
    }
  }

  public stopAudioBeacon() {
    this.isAudioRunning = false;
    if (this.audioTimer) {
      clearTimeout(this.audioTimer);
      this.audioTimer = null;
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {
        // Ignore
      }
      this.oscillator = null;
    }
  }

  /**
   * Toggles visual high-cadence SOS strobe.
   * Morse code SOS: ... --- ...
   */
  public async toggleVisualBeacon(): Promise<boolean> {
    if (this.isVisualRunning) {
      this.stopVisualBeacon();
      return false;
    } else {
      await this.startVisualBeacon();
      return true;
    }
  }

  public async startVisualBeacon() {
    this.stopVisualBeacon();
    this.isVisualRunning = true;

    // Try camera flashlight/torch if supported
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        if (capabilities.torch) {
          this.videoTrack = track;
        }
      }
    } catch {
      // Hardware torch not accessible or permission denied; fallback to screen strobe
      this.videoTrack = null;
    }

    // Morse timing: short = 150ms, long = 450ms, gap = 150ms
    const morsePattern = [
      { duration: 150, light: true },
      { duration: 120, light: false },
      { duration: 150, light: true },
      { duration: 120, light: false },
      { duration: 150, light: true },
      { duration: 300, light: false },
      // O
      { duration: 420, light: true },
      { duration: 120, light: false },
      { duration: 420, light: true },
      { duration: 120, light: false },
      { duration: 420, light: true },
      { duration: 300, light: false },
      // S
      { duration: 150, light: true },
      { duration: 120, light: false },
      { duration: 150, light: true },
      { duration: 120, light: false },
      { duration: 150, light: true },
      { duration: 800, light: false }, // Repeat delay
    ];

    let stepIdx = 0;
    const runStrobe = async () => {
      if (!this.isVisualRunning) return;

      const item = morsePattern[stepIdx % morsePattern.length];
      stepIdx++;

      this.notifyStrobe(item.light, item.light ? '#ffffff' : '#000000');

      if (this.videoTrack) {
        try {
          await (this.videoTrack as any).applyConstraints({
            advanced: [{ torch: item.light }]
          });
        } catch {
          // Ignore
        }
      }

      this.visualTimer = setTimeout(runStrobe, item.duration);
    };

    runStrobe();
  }

  public stopVisualBeacon() {
    this.isVisualRunning = false;
    if (this.visualTimer) {
      clearTimeout(this.visualTimer);
      this.visualTimer = null;
    }
    this.notifyStrobe(false, '#000000');

    if (this.videoTrack) {
      try {
        (this.videoTrack as any).applyConstraints({ advanced: [{ torch: false }] });
        this.videoTrack.stop();
      } catch {
        // Ignore
      }
      this.videoTrack = null;
    }
  }

  public stopAll() {
    this.stopAudioBeacon();
    this.stopVisualBeacon();
  }
}

export const beaconService = new RescueBeaconService();
