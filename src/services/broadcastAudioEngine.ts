import { OutputDevice } from '../types';

export interface SoundTrackInfo {
  id: string;
  title: string;
  bpm: number;
  vibe: string;
  dropDelaySeconds: number;
}

export const SOUND_TRACKS: Record<string, SoundTrackInfo> = {
  marlon_mogged: {
    id: 'marlon_mogged',
    title: 'MARLON GETS MOGGED (VIRAL 2026)',
    bpm: 104,
    vibe: 'Wasted Effect + Slowed Mog Beat',
    dropDelaySeconds: 4.7,
  },
  montagem_tomada: {
    id: 'montagem_tomada',
    title: 'MONTAGEM TOMADA (GHOST IMPACT 2026)',
    bpm: 130,
    vibe: 'Phonk Ghost-Trails + 808 Sub Shatter',
    dropDelaySeconds: 3.57,
  },
  tokyo_drift: {
    id: 'tokyo_drift',
    title: 'TOKYO DRIFT PHONK',
    bpm: 140,
    vibe: 'Aggressive 808 Cowbell Drift',
    dropDelaySeconds: 1.6,
  },
  cyber_sigma: {
    id: 'cyber_sigma',
    title: 'CYBER SIGMA 2077',
    bpm: 130,
    vibe: 'Dark Cyberpunk Trap & Glitch',
    dropDelaySeconds: 1.5,
  },
  gigachad_anthem: {
    id: 'gigachad_anthem',
    title: 'GIGACHAD ASCENDED',
    bpm: 145,
    vibe: 'Triumphant Sigma Cowbell Anthem',
    dropDelaySeconds: 1.4,
  },
  mogger: {
    id: 'mogger',
    title: 'MOGGER (DARK MANGA 2026)',
    bpm: 130,
    vibe: 'Dark Manga Invert & Strobe Glitch',
    dropDelaySeconds: 2.5,
  },
};

class BroadcastAudioEngine {
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micGainNode: GainNode | null = null;
  private phonkGainNode: GainNode | null = null;
  private broadcastCtx: AudioContext | null = null;
  private broadcastMixer: GainNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private formantFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private analyserData: Uint8Array | null = null;
  private currentPhonkSource: AudioBufferSourceNode | null = null;
  private currentPhonkFilter: BiquadFilterNode | null = null;
  private vadCarrierOsc: OscillatorNode | null = null;
  private vadCarrierGain: GainNode | null = null;
  private isBroadcasting: boolean = false;
  private selectedDeviceId: string = '';
  private availableDevices: OutputDevice[] = [];
  private listeners: Set<(isBroadcasting: boolean) => void> = new Set();
  private phonkBroadcastVolume: number = 0.42;

  setPhonkBroadcastVolume(val: number): void {
    this.phonkBroadcastVolume = Math.max(0.1, Math.min(1, val));
    if (this.phonkGainNode && this.broadcastCtx) {
      this.phonkGainNode.gain.setValueAtTime(
        this.phonkBroadcastVolume,
        this.broadcastCtx.currentTime
      );
    }
  }

  getPhonkBroadcastVolume(): number {
    return this.phonkBroadcastVolume;
  }

  async getOutputDevices(): Promise<OutputDevice[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => {
          const label = (d.label || '').toLowerCase();
          const isCableInput = label.includes('cable input');
          const isCable = isCableInput || label.includes('cable') || label.includes('virtual');
          return {
            deviceId: d.deviceId,
            label: d.label || `Audio Output ${d.deviceId.slice(0, 5)}`,
            isCableInput,
            isCable,
          };
        });
      return this.availableDevices;
    } catch (e) {
      console.warn('[BroadcastAudioEngine] enumerateDevices error:', e);
      return [];
    }
  }

  getAutoCableDeviceId(): string | null {
    const cableInput = this.availableDevices.find((d) => d.isCableInput);
    if (cableInput) return cableInput.deviceId;
    const cable = this.availableDevices.find((d) => d.isCable && !d.label.toLowerCase().includes('16ch'));
    if (cable) return cable.deviceId;
    const fallback = this.availableDevices.find((d) => d.isCable);
    return fallback ? fallback.deviceId : null;
  }

  getIsBroadcasting(): boolean {
    return this.isBroadcasting;
  }

  getSelectedDeviceId(): string {
    return this.selectedDeviceId;
  }

  subscribe(listener: (isBroadcasting: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.isBroadcasting);
    }
  }

  getAudioLevel(): number {
    if (!this.analyserNode || !this.analyserData) return 0;
    this.analyserNode.getByteFrequencyData(this.analyserData as any);
    let sum = 0;
    const len = this.analyserData.length;
    for (let i = 0; i < len; i++) {
      sum += this.analyserData[i];
    }
    const avg = sum / len;
    return Math.min(1, avg / 128);
  }

  async startBroadcast(deviceId?: string): Promise<{ success: boolean; error?: string }> {
    if (this.isBroadcasting) {
      if (deviceId && deviceId !== this.selectedDeviceId) {
        await this.changeOutputDevice(deviceId);
      }
      return { success: true };
    }

    try {
      let tempStream: MediaStream | null = null;
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      await this.getOutputDevices();

      const micDevice =
        allDevices.find((d) => {
          if (d.kind !== 'audioinput') return false;
          const label = (d.label || '').toLowerCase();
          return (
            !label.includes('cable') &&
            !label.includes('virtual') &&
            d.deviceId !== 'default' &&
            d.deviceId !== 'communications'
          );
        }) ||
        allDevices.find((d) => d.kind === 'audioinput' && !(d.label || '').toLowerCase().includes('cable'));

      tempStream?.getTracks().forEach((t) => t.stop());

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: micDevice ? { exact: micDevice.deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (err) {
        console.warn('[BroadcastAudioEngine] Physical mic not acquired, proceeding in music-broadcast mode:', err);
        this.micStream = null;
      }

      const autoCable = this.getAutoCableDeviceId();
      const chosenDevice =
        deviceId && deviceId !== 'default' ? deviceId : autoCable || this.selectedDeviceId || 'default';
      this.selectedDeviceId = chosenDevice;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 48000 });

      if (chosenDevice && chosenDevice !== 'default' && typeof (ctx as any).setSinkId === 'function') {
        await (ctx as any).setSinkId(chosenDevice);
        console.log('[BroadcastAudioEngine] Dedicated 48kHz AudioContext setSinkId to:', chosenDevice);
      }

      this.phonkGainNode = ctx.createGain();
      this.phonkGainNode.gain.setValueAtTime(this.phonkBroadcastVolume, ctx.currentTime);

      if (this.micStream) {
        try {
          this.micSourceNode = ctx.createMediaStreamSource(this.micStream);
          this.micGainNode = ctx.createGain();
          this.micGainNode.gain.setValueAtTime(1.1, ctx.currentTime);
        } catch (err) {
          console.warn('[BroadcastAudioEngine] Could not create mic source node:', err);
        }
      }

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(80, ctx.currentTime);
      highpass.Q.setValueAtTime(0.7, ctx.currentTime);
      this.highpassFilter = highpass;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(7800, ctx.currentTime);
      lowpass.Q.setValueAtTime(0.7, ctx.currentTime);
      this.lowpassFilter = lowpass;

      const formant = ctx.createBiquadFilter();
      formant.type = 'peaking';
      formant.frequency.setValueAtTime(1350, ctx.currentTime);
      formant.gain.setValueAtTime(2.5, ctx.currentTime);
      formant.Q.setValueAtTime(1.5, ctx.currentTime);
      this.formantFilter = formant;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.setValueAtTime(2800, ctx.currentTime);
      presence.gain.setValueAtTime(2.0, ctx.currentTime);
      presence.Q.setValueAtTime(1.2, ctx.currentTime);
      this.presenceFilter = presence;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-8, ctx.currentTime);
      compressor.knee.setValueAtTime(4, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      compressor.attack.setValueAtTime(0.002, ctx.currentTime);
      compressor.release.setValueAtTime(0.05, ctx.currentTime);
      this.compressorNode = compressor;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      this.masterGainNode = masterGain;

      const mixer = ctx.createGain();
      this.broadcastMixer = mixer;

      if (this.micSourceNode && this.micGainNode) {
        this.micSourceNode.connect(this.micGainNode);
        this.micGainNode.connect(mixer);
      }
      this.phonkGainNode.connect(mixer);

      mixer.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(formant);
      formant.connect(presence);
      presence.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);
      masterGain.connect(this.analyserNode);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      this.broadcastCtx = ctx;
      this.isBroadcasting = true;
      this.notify();

      return { success: true };
    } catch (err: any) {
      console.error('[BroadcastAudioEngine] Failed to start broadcast:', err);
      this.stopBroadcast();
      return { success: false, error: err?.message || 'Failed to initialize audio broadcast' };
    }
  }

  playPhonkBuffer(
    buffer: AudioBuffer,
    offset: number = 0,
    duration?: number,
    filterConfig?: { startFreq: number; midFreq: number; midTime: number; endFreq: number; endTime: number }
  ): AudioBufferSourceNode | null {
    if (!this.isBroadcasting || !this.broadcastCtx || !this.phonkGainNode) return null;

    if (this.broadcastCtx.state === 'suspended') {
      this.broadcastCtx.resume();
    }
    this.stopPhonkBuffer();

    const src = this.broadcastCtx.createBufferSource();
    src.buffer = buffer;

    if (filterConfig) {
      const filter = this.broadcastCtx.createBiquadFilter();
      filter.type = 'lowpass';
      const now = this.broadcastCtx.currentTime;
      filter.frequency.setValueAtTime(filterConfig.startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(filterConfig.midFreq, now + filterConfig.midTime);
      filter.frequency.exponentialRampToValueAtTime(filterConfig.endFreq, now + filterConfig.endTime);
      src.connect(filter);
      filter.connect(this.phonkGainNode);
      this.currentPhonkFilter = filter;
    } else {
      src.connect(this.phonkGainNode);
    }

    if (duration !== undefined) {
      src.start(0, offset, duration);
    } else {
      src.start(0, offset);
    }

    if (!this.vadCarrierOsc && this.broadcastCtx) {
      try {
        const osc = this.broadcastCtx.createOscillator();
        const gain = this.broadcastCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.broadcastCtx.currentTime);
        gain.gain.setValueAtTime(0.018, this.broadcastCtx.currentTime);
        osc.connect(gain);
        gain.connect(this.phonkGainNode);
        osc.start();
        this.vadCarrierOsc = osc;
        this.vadCarrierGain = gain;
      } catch {}
    }

    this.currentPhonkSource = src;
    return src;
  }

  stopPhonkBuffer(): void {
    if (this.currentPhonkSource) {
      try {
        this.currentPhonkSource.stop();
        this.currentPhonkSource.disconnect();
      } catch {}
      this.currentPhonkSource = null;
    }
    if (this.currentPhonkFilter) {
      try {
        this.currentPhonkFilter.disconnect();
      } catch {}
      this.currentPhonkFilter = null;
    }
    if (this.vadCarrierOsc) {
      try {
        this.vadCarrierOsc.stop();
        this.vadCarrierOsc.disconnect();
      } catch {}
      this.vadCarrierOsc = null;
    }
    if (this.vadCarrierGain) {
      try {
        this.vadCarrierGain.disconnect();
      } catch {}
      this.vadCarrierGain = null;
    }
  }

  playProceduralDrop(delay: number): void {
    if (!this.isBroadcasting || !this.broadcastCtx || !this.phonkGainNode) return;
    if (this.broadcastCtx.state === 'suspended') {
      this.broadcastCtx.resume();
    }
    const t = this.broadcastCtx.currentTime + delay;
    const osc = this.broadcastCtx.createOscillator();
    const gain = this.broadcastCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.8);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(gain);
    gain.connect(this.phonkGainNode);
    osc.start(t);
    osc.stop(t + 1.25);
  }

  async changeOutputDevice(deviceId: string): Promise<void> {
    this.selectedDeviceId = deviceId;
    if (this.isBroadcasting && this.broadcastCtx && typeof (this.broadcastCtx as any).setSinkId === 'function') {
      try {
        await (this.broadcastCtx as any).setSinkId(deviceId);
        console.log('[BroadcastAudioEngine] Changed AudioContext sinkId to:', deviceId);
      } catch (err) {
        console.warn('[BroadcastAudioEngine] Failed to change bCtx sinkId:', err);
      }
    }
  }

  stopBroadcast(): void {
    this.stopPhonkBuffer();
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }
    if (this.micGainNode) {
      try {
        this.micGainNode.disconnect();
      } catch {}
      this.micGainNode = null;
    }
    if (this.phonkGainNode) {
      try {
        this.phonkGainNode.disconnect();
      } catch {}
      this.phonkGainNode = null;
    }
    if (this.broadcastMixer) {
      try {
        this.broadcastMixer.disconnect();
      } catch {}
      this.broadcastMixer = null;
    }
    if (this.highpassFilter) {
      try {
        this.highpassFilter.disconnect();
      } catch {}
      this.highpassFilter = null;
    }
    if (this.lowpassFilter) {
      try {
        this.lowpassFilter.disconnect();
      } catch {}
      this.lowpassFilter = null;
    }
    if (this.formantFilter) {
      try {
        this.formantFilter.disconnect();
      } catch {}
      this.formantFilter = null;
    }
    if (this.presenceFilter) {
      try {
        this.presenceFilter.disconnect();
      } catch {}
      this.presenceFilter = null;
    }
    if (this.compressorNode) {
      try {
        this.compressorNode.disconnect();
      } catch {}
      this.compressorNode = null;
    }
    if (this.masterGainNode) {
      try {
        this.masterGainNode.disconnect();
      } catch {}
      this.masterGainNode = null;
    }
    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {}
      this.analyserNode = null;
      this.analyserData = null;
    }
    if (this.broadcastCtx) {
      try {
        this.broadcastCtx.close();
      } catch {}
      this.broadcastCtx = null;
    }
    this.isBroadcasting = false;
    this.notify();
  }
}

export const broadcastAudio = new BroadcastAudioEngine();
