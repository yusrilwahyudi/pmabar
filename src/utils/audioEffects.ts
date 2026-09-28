// Pure Web Audio API Sound Synthesizer for Classroom Buzzer Game
// 100% dependency-free, zero lag, works on mobile & desktop without external audio files

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
      };

      // Listen on all possible interaction events across mobile & desktop
      window.addEventListener('click', unlock, { capture: true, passive: true });
      window.addEventListener('touchstart', unlock, { capture: true, passive: true });
      window.addEventListener('touchend', unlock, { capture: true, passive: true });
      window.addEventListener('keydown', unlock, { capture: true, passive: true });
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
      window.addEventListener('mousedown', unlock, { capture: true, passive: true });
    }
  }

  // Forcefully initialize and unlock the AudioContext on any user gesture
  public unlockAudio(): AudioContext | null {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }

        // Play an inaudible 1-sample buffer to permanently unlock iOS / Android Safari & Chrome WebAudio
        if (!this.isUnlocked && this.ctx.state === 'running') {
          const buffer = this.ctx.createBuffer(1, 1, 22050);
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.ctx.destination);
          source.start(0);
          this.isUnlocked = true;
        }
      }
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
    return this.ctx;
  }

  private getActiveCtx(): AudioContext | null {
    if (this.isMuted) return null;
    const ctx = this.unlockAudio();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.unlockAudio();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.unlockAudio();
    }
  }

  // Quick Test Sound (plays preview bell + chime)
  public playTestSound() {
    this.playBuzzerPress();
    setTimeout(() => {
      this.playBuzzerOpen();
    }, 350);
  }

  // 1. Suara Bel Siapa Cepat (Ding-Dong Kencang & Autentik Gameshow)
  public playBuzzerPress() {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Master Bell Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      masterGain.connect(ctx.destination);

      // Primary High Ding (1200Hz -> 1800Hz quick chirp)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.05);
      gain1.gain.setValueAtTime(0.9, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Resonant Metallic Bell Tone (1046.5Hz Note C6 + 2093Hz C7)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.02);
      gain2.gain.setValueAtTime(0.9, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.02);
      osc2.stop(now + 1.1);

      // Second Harmonic Ping (1318.5Hz Note E6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.5, now + 0.04);
      gain3.gain.setValueAtTime(0.7, now + 0.04);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.04);
      osc3.stop(now + 0.9);
    } catch (e) {}
  }

  // 2. Suara Bel Dibuka / Siap Adu Cepat (Energetic Upbeat 4-Note Chime)
  public playBuzzerOpen() {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.7, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {}
  }

  // 3. Suara Jawaban Benar (Victory Fanfare Tadaaa)
  public playCorrectAnswer() {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chords = [
        { freq: 523.25, time: 0, dur: 0.16 }, // C5
        { freq: 659.25, time: 0.14, dur: 0.16 }, // E5
        { freq: 783.99, time: 0.28, dur: 0.18 }, // G5
        { freq: 1046.5, time: 0.44, dur: 0.75 } // C6
      ];

      chords.forEach(({ freq, time, dur }) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const st = now + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.85, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + dur);
      });
    } catch (e) {}
  }

  // 4. Suara Jawaban Salah / Waktu Habis (Deep Error Buzzer Bzzzt)
  public playWrongAnswer() {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Dual oscillator harsh buzz
      [140, 146].forEach(freq => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 0.45);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }

  // 5. Suara Detak Waktu (Clear Woodblock / Clock Tick Countdown)
  public playTick(isUrgent: boolean = false) {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isUrgent ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(isUrgent ? 1100 : 750, now);
      osc.frequency.exponentialRampToValueAtTime(isUrgent ? 550 : 350, now + 0.05);

      gain.gain.setValueAtTime(isUrgent ? 0.7 : 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // 6. Suara Juara / Selesai Game (Fanfare Podium)
  public playVictory() {
    const ctx = this.getActiveCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0, d: 0.18 },
        { f: 523.25, t: 0.18, d: 0.18 },
        { f: 523.25, t: 0.36, d: 0.18 },
        { f: 659.25, t: 0.54, d: 0.38 },
        { f: 783.99, t: 0.92, d: 0.30 },
        { f: 1046.5, t: 1.22, d: 1.1 }
      ];

      notes.forEach(({ f, t, d }) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const st = now + t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.8, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + d);
      });
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
export const audioEffects = soundEngine;

