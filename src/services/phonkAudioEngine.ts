import { broadcastAudio, SOUND_TRACKS } from './broadcastAudioEngine';
import { TrackId } from '../types';

class PhonkAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;
  private isPlaying: boolean = false;
  private activeTimers: number[] = [];
  private volume: number = 0.9;
  private muted: boolean = false;
  private moggedAudioBuffer: AudioBuffer | null = null;
  private tomadaAudioBuffer: AudioBuffer | null = null;
  private moggerAudioBuffer: AudioBuffer | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private isPreloadingAudio: boolean = false;
  private isPreloadingTomada: boolean = false;
  private isPreloadingMogger: boolean = false;
  private keepAliveOscillator: OscillatorNode | null = null;

  initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.recordingDestination = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.recordingDestination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startKeepAlive(): void {
    this.initContext();
    if (!this.ctx || this.keepAliveOscillator) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.003, this.ctx.currentTime);
      osc.frequency.setValueAtTime(18, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      this.keepAliveOscillator = osc;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } catch (e) {
      console.warn('[PhonkAudioEngine] Could not start keep-alive oscillator:', e);
    }
  }

  async preloadMoggedAudio(): Promise<void> {
    if (this.moggedAudioBuffer || this.isPreloadingAudio) return;
    this.isPreloadingAudio = true;
    this.initContext();
    try {
      const res = await fetch('/audios/marlon_gets_mogged.mp3');
      if (!res.ok) throw new Error(`Failed to fetch audio: ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      if (this.ctx) {
        this.moggedAudioBuffer = await this.ctx.decodeAudioData(arrayBuf);
        console.log(
          'Viral Mog Audio loaded successfully! Duration:',
          this.moggedAudioBuffer.duration.toFixed(2),
          's'
        );
      }
    } catch (e) {
      console.warn('Could not load custom mog audio file, will use procedural fallback:', e);
    } finally {
      this.isPreloadingAudio = false;
    }
  }

  async preloadTomadaAudio(): Promise<void> {
    if (this.tomadaAudioBuffer || this.isPreloadingTomada) return;
    this.isPreloadingTomada = true;
    this.initContext();
    try {
      const res = await fetch('/audios/Montagem_Tomada.mp3');
      if (!res.ok) throw new Error(`Failed to fetch audio: ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      if (this.ctx) {
        this.tomadaAudioBuffer = await this.ctx.decodeAudioData(arrayBuf);
        console.log(
          'Montagem Tomada Audio loaded successfully! Duration:',
          this.tomadaAudioBuffer.duration.toFixed(2),
          's'
        );
      }
    } catch (e) {
      console.warn('Could not load Montagem Tomada audio file, checking fallback path...', e);
      try {
        const fallback = await fetch('/src/audios/Montagem_Tomada.mp3');
        if (fallback.ok && this.ctx) {
          const buf = await fallback.arrayBuffer();
          this.tomadaAudioBuffer = await this.ctx.decodeAudioData(buf);
          console.log('Montagem Tomada fallback loaded successfully!');
        }
      } catch (err) {
        console.warn('Failed to load Montagem Tomada fallback:', err);
      }
    } finally {
      this.isPreloadingTomada = false;
    }
  }

  async preloadMoggerAudio(): Promise<void> {
    if (this.moggerAudioBuffer || this.isPreloadingMogger) return;
    this.isPreloadingMogger = true;
    this.initContext();
    try {
      const res = await fetch('/audios/mogger.mp3');
      if (!res.ok) throw new Error(`Failed to fetch mogger audio: ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      if (this.ctx) {
        this.moggerAudioBuffer = await this.ctx.decodeAudioData(arrayBuf);
        console.log(
          'Mogger Audio loaded successfully! Duration:',
          this.moggerAudioBuffer.duration.toFixed(2),
          's'
        );
      }
    } catch (e) {
      console.warn('Could not load mogger audio file, checking fallback path...', e);
      try {
        const fallback = await fetch('/src/audios/mogger.mp3');
        if (fallback.ok && this.ctx) {
          const buf = await fallback.arrayBuffer();
          this.moggerAudioBuffer = await this.ctx.decodeAudioData(buf);
          console.log('Mogger fallback audio loaded successfully!');
        }
      } catch (err) {
        console.warn('Failed to load mogger fallback audio:', err);
      }
    } finally {
      this.isPreloadingMogger = false;
    }
  }

  async preloadAllAudios(): Promise<void> {
    await Promise.allSettled([
      this.preloadTomadaAudio(),
      this.preloadMoggedAudio(),
      this.preloadMoggerAudio(),
    ]);
  }

  getRandomTrack(): TrackId {
    const tracks: TrackId[] = ['montagem_tomada', 'marlon_mogged', 'mogger'];
    return tracks[Math.floor(Math.random() * tracks.length)];
  }

  getAudioStream(): MediaStream | null {
    this.initContext();
    return this.recordingDestination ? this.recordingDestination.stream : null;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  connectBroadcastNode(node: AudioNode): void {
    this.initContext();
    if (this.masterGain) {
      try {
        this.masterGain.connect(node);
      } catch {}
    }
  }

  disconnectBroadcastNode(node: AudioNode): void {
    if (this.masterGain) {
      try {
        this.masterGain.disconnect(node);
      } catch {}
    }
  }

  private makeDistortionCurve(amount: number = 25): Float32Array {
    const k = typeof amount === 'number' ? amount : 25;
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  playPhonkCowbell(time: number, freq: number, gainVal: number = 0.6): void {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.485, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.2, time);
    filter.Q.setValueAtTime(4, time);

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(18) as any;
    shaper.oversample = '2x';

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.36);
    osc2.stop(time + 0.36);
  }

  playKick(time: number, gainVal: number = 1): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  play808Sub(time: number, duration: number, freq1: number, freq2: number, gainVal: number = 0.9): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(10) as any;

    osc.type = 'sawtooth';
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, time);

    osc.frequency.setValueAtTime(freq1 * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq1, time + 0.03);
    if (freq1 !== freq2) {
      osc.frequency.linearRampToValueAtTime(freq2, time + duration * 0.8);
    }

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playHiHat(time: number, open: boolean = false, gainVal: number = 0.3): void {
    if (!this.ctx || !this.masterGain) return;
    const length = this.ctx.sampleRate * (open ? 0.2 : 0.05);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.2 : 0.04));

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start(time);
    src.stop(time + (open ? 0.21 : 0.05));
  }

  playSnare(time: number): void {
    if (!this.ctx || !this.masterGain) return;
    const length = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.1);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.19);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  playRiser(time: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.35, time + duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBassDropImpact(delay: number = 0): void {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.8);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 1.25);
    this.playKick(time, 1.2);
  }

  ensureBroadcastPhonkBuffer(
    buffer: AudioBuffer,
    offset: number = 0,
    duration?: number,
    filterConfig?: any
  ): void {
    if (broadcastAudio.getIsBroadcasting()) {
      broadcastAudio.playPhonkBuffer(buffer, offset, duration, filterConfig);
    } else {
      broadcastAudio
        .startBroadcast()
        .then(() => {
          broadcastAudio.playPhonkBuffer(buffer, offset, duration, filterConfig);
        })
        .catch((e) => console.warn('[PhonkAudioEngine] Auto-start broadcast error:', e));
    }
  }

  ensureBroadcastProceduralDrop(delay: number): void {
    if (broadcastAudio.getIsBroadcasting()) {
      broadcastAudio.playProceduralDrop(delay);
    } else {
      broadcastAudio
        .startBroadcast()
        .then(() => {
          broadcastAudio.playProceduralDrop(delay);
        })
        .catch((e) => console.warn('[PhonkAudioEngine] Auto-start broadcast drop error:', e));
    }
  }

  async playQuickPhonkTest(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.stop();

    if (!this.tomadaAudioBuffer) {
      await this.preloadTomadaAudio();
    }

    const buf = this.tomadaAudioBuffer || this.moggedAudioBuffer;
    if (buf && this.ctx && this.masterGain) {
      this.isPlaying = true;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.masterGain);
      src.start(0, 3.2, 4.2);
      this.currentAudioSource = src;
      this.ensureBroadcastPhonkBuffer(buf, 3.2, 4.2);

      const timer = window.setTimeout(() => {
        this.stop();
      }, 4250);
      this.activeTimers.push(timer);
    } else {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      this.playPhonkCowbell(now, 740, 0.7);
      this.playPhonkCowbell(now + 0.2, 880, 0.75);
      this.playBassDropImpact(0.55);
      this.playKick(now + 0.55, 1.3);
      this.play808Sub(now + 0.55, 1.2, 46.2, 55, 1);
      this.ensureBroadcastProceduralDrop(0.55);
    }
  }

  playMemeSound(meme: string): void {
    this.initContext();
    if (!this.ctx) return;

    if (meme === 'bass_cannon') {
      this.playBassDropImpact(0);
      return;
    }
    if (meme === 'vinyl_scratch') {
      this.playVinylScratch();
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(meme);
      utt.pitch = 0.6;
      utt.rate = 1.1;
      utt.volume = this.muted ? 0 : this.volume;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('David'))
      );
      if (voice) utt.voice = voice;
      window.speechSynthesis.speak(utt);
    }
  }

  playVinylScratch(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2500, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.12);
    osc.frequency.linearRampToValueAtTime(1800, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  async playEditSequence(
    trackId: string = 'marlon_mogged',
    onDropImpact?: () => void,
    onComplete?: () => void
  ): Promise<{ startTime: number; durationMs: number }> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.stop();
    this.isPlaying = true;

    if (!this.ctx) {
      return { startTime: performance.now(), durationMs: 15940 };
    }

    if (trackId === 'montagem_tomada') {
      if (!this.tomadaAudioBuffer) await this.preloadTomadaAudio();
      if (this.tomadaAudioBuffer && this.isPlaying) {
        const dur = this.tomadaAudioBuffer.duration * 1000;
        const src = this.ctx.createBufferSource();
        src.buffer = this.tomadaAudioBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const now = this.ctx.currentTime;
        filter.frequency.setValueAtTime(420, now);
        filter.frequency.exponentialRampToValueAtTime(3600, now + 3.4);
        filter.frequency.exponentialRampToValueAtTime(20000, now + 3.57);

        src.connect(filter);
        filter.connect(this.masterGain!);
        this.lowpassFilter = filter;
        src.start(0);
        this.currentAudioSource = src;

        const startTime = performance.now();
        this.ensureBroadcastPhonkBuffer(this.tomadaAudioBuffer, 0, this.tomadaAudioBuffer.duration, {
          startFreq: 420,
          midFreq: 3600,
          endFreq: 20000,
          midTime: 3.4,
          endTime: 3.57,
        });

        if (onComplete) {
          src.onended = () => {
            if (this.isPlaying) onComplete();
          };
        }

        const dropTimer = window.setTimeout(() => {
          if (this.isPlaying && onDropImpact) onDropImpact();
        }, 3570);
        this.activeTimers.push(dropTimer);

        return { startTime, durationMs: dur };
      }
    }

    if (trackId === 'marlon_mogged') {
      if (!this.moggedAudioBuffer) await this.preloadMoggedAudio();
      if (this.moggedAudioBuffer && this.isPlaying) {
        const dur = this.moggedAudioBuffer.duration * 1000;
        const src = this.ctx.createBufferSource();
        src.buffer = this.moggedAudioBuffer;
        src.connect(this.masterGain!);
        src.start(0);
        this.currentAudioSource = src;

        const startTime = performance.now();
        this.ensureBroadcastPhonkBuffer(this.moggedAudioBuffer, 0, this.moggedAudioBuffer.duration);

        if (onComplete) {
          src.onended = () => {
            if (this.isPlaying) onComplete();
          };
        }

        const drop1 = window.setTimeout(() => {
          if (this.isPlaying && onDropImpact) onDropImpact();
        }, 4750);
        this.activeTimers.push(drop1);

        const drop2 = window.setTimeout(() => {
          if (this.isPlaying && onDropImpact) onDropImpact();
        }, 6710);
        this.activeTimers.push(drop2);

        return { startTime, durationMs: dur };
      }
    }

    if (trackId === 'mogger') {
      if (!this.moggerAudioBuffer) await this.preloadMoggerAudio();
      if (this.moggerAudioBuffer && this.isPlaying) {
        const dur = this.moggerAudioBuffer.duration * 1000;
        const src = this.ctx.createBufferSource();
        src.buffer = this.moggerAudioBuffer;
        src.connect(this.masterGain!);
        src.start(0);
        this.currentAudioSource = src;

        const startTime = performance.now();
        this.ensureBroadcastPhonkBuffer(this.moggerAudioBuffer, 0, this.moggerAudioBuffer.duration);

        if (onComplete) {
          src.onended = () => {
            if (this.isPlaying) onComplete();
          };
        }

        const dropTimer = window.setTimeout(() => {
          if (this.isPlaying && onDropImpact) onDropImpact();
        }, 2500);
        this.activeTimers.push(dropTimer);

        return { startTime, durationMs: dur };
      }
    }

    // Procedural Fallback Phonk track
    const track = SOUND_TRACKS[trackId] || SOUND_TRACKS.tokyo_drift;
    const now = this.ctx.currentTime + 0.05;
    const dropTime = now + track.dropDelaySeconds;
    const beatSec = 60 / track.bpm;
    const subDiv = beatSec / 4;

    this.playRiser(now, track.dropDelaySeconds);

    let t = now + 0.2;
    let snStep = beatSec;
    while (t < dropTime - 0.1) {
      this.playSnare(t);
      this.playHiHat(t, false, 0.25);
      snStep *= 0.85;
      t += Math.max(snStep, subDiv);
    }

    const dropDelayMs = (dropTime - this.ctx.currentTime) * 1000;
    const timer = window.setTimeout(() => {
      if (this.isPlaying && onDropImpact) onDropImpact();
    }, Math.max(0, dropDelayMs));
    this.activeTimers.push(timer);

    this.playBassDropImpact(track.dropDelaySeconds);
    if (broadcastAudio.getIsBroadcasting()) {
      broadcastAudio.playProceduralDrop(track.dropDelaySeconds);
    }

    const melody = [740, 880, 988, 1109, 880, 740, 659, 740, 988, 1109, 1319, 1109];
    const totalBars = 16;
    for (let bar = 0; bar < totalBars; bar++) {
      const barTime = dropTime + bar * beatSec;
      if (bar % 2 === 0 || bar === 3 || bar === 7 || bar === 11 || bar === 14) {
        this.playKick(barTime, 1.1);
      }
      if (bar % 2 === 1) {
        this.playSnare(barTime);
      }
      if (bar % 4 === 0) {
        this.play808Sub(barTime, beatSec * 1.8, 46.2, 55, 0.95);
      } else if (bar % 4 === 2) {
        this.play808Sub(barTime, beatSec * 1.8, 41.2, 46.2, 0.95);
      }

      for (let s = 0; s < 4; s++) {
        const hatTime = barTime + s * subDiv;
        if ((bar === 3 || bar === 7 || bar === 11) && s >= 2) {
          this.playHiHat(hatTime, false, 0.35);
          this.playHiHat(hatTime + subDiv / 2, false, 0.25);
        } else {
          this.playHiHat(hatTime, s === 0 && bar % 2 === 1, 0.3);
        }
      }

      const m1 = melody[(bar * 2) % melody.length];
      const m2 = melody[(bar * 2 + 1) % melody.length];
      this.playPhonkCowbell(barTime, m1, 0.65);
      this.playPhonkCowbell(barTime + subDiv * 2, m2, 0.6);
    }

    const totalDurationMs = (track.dropDelaySeconds + totalBars * beatSec) * 1000;
    if (onComplete) {
      const endTimer = window.setTimeout(() => {
        if (this.isPlaying) onComplete();
      }, totalDurationMs);
      this.activeTimers.push(endTimer);
    }

    return { startTime: performance.now(), durationMs: totalDurationMs };
  }

  stop(): void {
    this.isPlaying = false;
    this.activeTimers.forEach((t) => clearTimeout(t));
    this.activeTimers = [];

    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch {}
      this.currentAudioSource = null;
    }

    if (this.lowpassFilter) {
      try {
        this.lowpassFilter.disconnect();
      } catch {}
      this.lowpassFilter = null;
    }

    broadcastAudio.stopPhonkBuffer();
  }
}

export const phonkAudio = new PhonkAudioEngine();
