import { FrameItem } from '../types';
import { deviceManager } from './deviceManager';

export interface MultiTakeClips {
  setup: FrameItem[];
  motion: FrameItem[];
  climax: FrameItem[];
  allAction: FrameItem[];
}

export interface PostTriggerMoments {
  startMoment: FrameItem[];
  motionMoment: FrameItem[];
  climaxMoment: FrameItem[];
  dropMoments: FrameItem[][];
  allRecorded: FrameItem[];
}

class FrameBufferManager {
  private buffer: FrameItem[] = [];
  private isCapturing: boolean = true;
  private isPushing: boolean = false;
  private protectedBitmaps: Set<ImageBitmap> = new Set();
  private clipProtectedBitmaps: Set<ImageBitmap> = new Set();
  private isSessionActive: boolean = false;
  private sessionFrames: FrameItem[] = [];
  private sessionStartTimestamp: number = 0;

  startLiveSession(leadTimeMs: number = 0): void {
    this.stopLiveSession();
    this.isSessionActive = true;
    const now = performance.now();
    this.sessionStartTimestamp = now;

    if (leadTimeMs > 0) {
      const startTime = now - leadTimeMs;
      const valid = this.buffer.filter(
        (f) => f.timestamp >= startTime && f.bitmap && f.bitmap.width > 0
      );
      this.sessionFrames = [...valid];
      for (const item of this.sessionFrames) {
        this.protectedBitmaps.add(item.bitmap);
      }
    } else {
      this.sessionFrames = [];
    }

    console.log(`[FrameBuffer] Live session started with ${this.sessionFrames.length} frames.`);
  }

  getSessionFrames(): FrameItem[] {
    return this.sessionFrames;
  }

  getSessionStartTimestamp(): number {
    return this.sessionStartTimestamp;
  }

  isLiveSessionActive(): boolean {
    return this.isSessionActive;
  }

  stopLiveSession(): void {
    if (!this.isSessionActive && this.sessionFrames.length === 0) return;

    this.isSessionActive = false;
    for (const frame of this.sessionFrames) {
      if (!this.clipProtectedBitmaps.has(frame.bitmap)) {
        this.protectedBitmaps.delete(frame.bitmap);
        if (!this.buffer.some((f) => f.bitmap === frame.bitmap)) {
          try {
            frame.bitmap.close();
          } catch {}
        }
      }
    }
    this.sessionFrames = [];
    console.log('[FrameBuffer] Live session ended and GPU resources safely recycled.');
  }

  async pushFrame(video: HTMLVideoElement): Promise<void> {
    if (
      this.isPushing ||
      !this.isCapturing ||
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

    this.isPushing = true;
    try {
      const targetW = deviceManager.getBufferTargetWidth();
      const r = Math.min(video.videoWidth, targetW);
      const n = Math.round(r * (video.videoHeight / video.videoWidth));
      if (r <= 0 || n <= 0) return;

      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(video, {
          resizeWidth: r,
          resizeHeight: n,
          resizeQuality: 'medium',
        });
      } catch {
        bitmap = await createImageBitmap(video);
      }

      const now = performance.now();
      const item: FrameItem = { bitmap, timestamp: now };
      this.buffer.push(item);

      if (this.isSessionActive) {
        this.protectedBitmaps.add(bitmap);
        this.sessionFrames.push(item);
      }

      const maxDuration = deviceManager.getMaxBufferDurationMs();
      const cutoff = now - maxDuration;

      while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoff) {
        const old = this.buffer.shift();
        if (old) {
          if (!this.protectedBitmaps.has(old.bitmap) && !this.clipProtectedBitmaps.has(old.bitmap)) {
            try {
              old.bitmap.close();
            } catch {}
          }
        }
      }
    } catch {
    } finally {
      this.isPushing = false;
    }
  }

  getReplayClip(durationMs: number = 4500): FrameItem[] {
    if (this.buffer.length === 0) return [];
    const cutoff = performance.now() - durationMs;
    const filtered = this.buffer.filter(
      (f) => f.timestamp >= cutoff && f.bitmap && f.bitmap.width > 0
    );
    const clip =
      filtered.length > 0
        ? filtered
        : this.buffer.filter((f) => f.bitmap && f.bitmap.width > 0);

    for (const frame of clip) {
      this.protectedBitmaps.add(frame.bitmap);
      this.clipProtectedBitmaps.add(frame.bitmap);
    }
    return [...clip];
  }

  releaseClip(clip: FrameItem[]): void {
    if (!clip || clip.length === 0) return;
    for (const frame of clip) {
      this.clipProtectedBitmaps.delete(frame.bitmap);
      this.protectedBitmaps.delete(frame.bitmap);
      if (!this.buffer.some((b) => b.bitmap === frame.bitmap)) {
        try {
          frame.bitmap.close();
        } catch {}
      }
    }
  }

  getMultiTakeClips(durationMs: number = 5000): MultiTakeClips {
    const valid = this.buffer.filter((f) => f.bitmap && f.bitmap.width > 0);
    if (valid.length === 0) {
      return { setup: [], motion: [], climax: [], allAction: [] };
    }

    const cutoff = performance.now() - durationMs;
    const filtered = valid.filter((f) => f.timestamp >= cutoff);
    const actions = filtered.length >= 10 ? filtered : valid;
    const len = actions.length;
    const l = Math.max(1, Math.floor(len * 0.35));
    const F = Math.max(l + 1, Math.floor(len * 0.75));

    const setup = actions.slice(0, l);
    const motion = actions.slice(l, F);
    const climax = actions.slice(F);

    for (const frame of actions) {
      this.protectedBitmaps.add(frame.bitmap);
    }

    return {
      setup: setup.length > 0 ? setup : actions,
      motion: motion.length > 0 ? motion : actions,
      climax: climax.length > 0 ? climax : actions,
      allAction: actions,
    };
  }

  releaseMultiTakes(takes: {
    setup?: FrameItem[];
    motion?: FrameItem[];
    climax?: FrameItem[];
    allAction?: FrameItem[];
  }): void {
    if (!takes) return;
    if (takes.allAction) this.releaseClip(takes.allAction);
    if (takes.setup) this.releaseClip(takes.setup);
    if (takes.motion) this.releaseClip(takes.motion);
    if (takes.climax) this.releaseClip(takes.climax);
  }

  getPostTriggerMoments(triggerTime: number, totalDuration: number): PostTriggerMoments {
    const valid = this.sessionFrames.filter(
      (f) => f && f.bitmap && f.bitmap.width > 0 && f.timestamp >= triggerTime
    );

    const startMoment: FrameItem[] = [];
    const motionMoment: FrameItem[] = [];
    const climaxMoment: FrameItem[] = [];
    const dropMoments: FrameItem[][] = [];

    let dropChunk: FrameItem[] = [];
    for (const frame of valid) {
      const rel = frame.timestamp - triggerTime;
      if (rel >= 100 && rel < 1600) {
        startMoment.push(frame);
      } else if (rel >= 1600 && rel < 3200) {
        motionMoment.push(frame);
      } else if (rel >= 3200 && rel <= 4940) {
        climaxMoment.push(frame);
      } else if (rel > 4940) {
        dropChunk.push(frame);
        if (dropChunk.length >= 15) {
          dropMoments.push([...dropChunk]);
          dropChunk = [];
        }
      }
    }

    if (dropChunk.length > 5) {
      dropMoments.push(dropChunk);
    }

    const fallback = valid.length > 0 ? [valid[valid.length - 1]] : [];

    return {
      startMoment:
        startMoment.length > 0
          ? startMoment
          : valid.length > 0
          ? valid.slice(0, Math.min(10, valid.length))
          : fallback,
      motionMoment:
        motionMoment.length > 0
          ? motionMoment
          : valid.length > 0
          ? valid.slice(Math.max(0, Math.floor(valid.length * 0.3)), Math.floor(valid.length * 0.7))
          : fallback,
      climaxMoment: climaxMoment.length > 0 ? climaxMoment : fallback,
      dropMoments,
      allRecorded: valid,
    };
  }

  getFrameCount(): number {
    return this.buffer.length;
  }

  setCapturing(val: boolean): void {
    this.isCapturing = val;
  }

  clear(): void {
    for (const item of this.buffer) {
      if (!this.protectedBitmaps.has(item.bitmap) && !this.clipProtectedBitmaps.has(item.bitmap)) {
        try {
          item.bitmap.close();
        } catch {}
      }
    }
    this.buffer = [];
  }
}

export const frameBuffer = new FrameBufferManager();
