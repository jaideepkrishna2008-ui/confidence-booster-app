import { workerTickTimer } from './workerTickTimer';
import { FrameItem } from '../types';

export interface EditRenderOptions {
  canvas: HTMLCanvasElement;
  preset: string;
  isMirrored?: boolean;
  startTime?: number;
  durationMs?: number;
  sessionStartTime?: number;
  frames?: FrameItem[];
  actionFrames?: FrameItem[];
  videoElement?: HTMLVideoElement | null;
  eyeCenter?: { x: number; y: number };
  getCurrentEyeCenter?: () => { x: number; y: number } | undefined;
  getSessionFrames?: () => FrameItem[];
  getPostTriggerMoments?: (time: number) => any;
  matchedMemeImage?: string;
  onDropImpact?: () => void;
  onComplete?: () => void;
}

class EditRenderer {
  private isRendering: boolean = false;
  private animFrameId: number | null = null;
  private unregisterWorkerTick: (() => void) | null = null;
  private currentTargetWin: Window | null = null;
  private moggedImage: HTMLImageElement | null = null;
  private moggedImageLoaded: boolean = false;
  private currentMemeImage: HTMLImageElement | null = null;
  private currentMemeSrc: string = '';

  constructor() {
    this.loadMoggedPng();
  }

  loadMeme(src?: string): void {
    const targetSrc = src || '/memes/batman_sigma_smirk.png';
    if (this.currentMemeSrc === targetSrc && this.currentMemeImage) return;
    this.currentMemeSrc = targetSrc;
    const img = new Image();
    img.src = targetSrc;
    img.onload = () => {
      this.currentMemeImage = img;
    };
  }

  renderMemeZoomInOut(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    elapsed: number,
    triggerTime: number,
    duration: number = 850,
    label: string = 'BATMAN // SIGMA DROP'
  ): void {
    const img = this.currentMemeImage || this.moggedImage;
    if (!img) return;

    const rel = elapsed - triggerTime;
    if (rel < 0 || rel > duration) return;

    const p = rel / duration;
    // Jumin and jumout:
    // Stage 1 (0..0.38): explosive zoom in ("jumin") from 0.65x to 1.35x
    // Stage 2 (0.38..1.0): smooth cinematic zoom out ("jumout") from 1.35x down to 1.0x with fade out
    let scale: number;
    let alpha: number;
    if (p < 0.38) {
      const sub = p / 0.38;
      const ease = 1 - Math.pow(1 - sub, 3);
      scale = 0.65 + ease * 0.70; // 0.65 -> 1.35
      alpha = Math.min(1, sub * 1.6);
    } else {
      const sub = (p - 0.38) / 0.62;
      scale = 1.35 - sub * 0.35; // 1.35 -> 1.00
      alpha = 1 - sub * sub;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.95));

    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w * 0.52, h * 0.52, 360);

    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    const x = cx - size / 2;
    const y = cy - size / 2;

    // Glowing cyber neon border and drop shadow
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3.5;

    ctx.save();
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, size, size, 16);
    } else {
      ctx.rect(x, y, size, size);
    }
    ctx.clip();
    this.drawCover(ctx, img, x, y, size, size, false);
    ctx.restore();

    // Border
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, size, size, 16);
    } else {
      ctx.rect(x, y, size, size);
    }
    ctx.stroke();

    // Top cyber badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(cx - 100, y - 16, 200, 24);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 100, y - 16, 200, 24);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, y - 4);

    ctx.restore();
  }

  loadMoggedPng(): void {
    const img = new Image();
    img.src = '/pngs/MoggedPng.jpeg';
    img.onload = () => {
      this.moggedImage = img;
      this.moggedImageLoaded = true;
      console.log('MoggedPng overlay loaded successfully!');
    };
    img.onerror = () => {
      console.warn('Failed to load /pngs/MoggedPng.jpeg, checking alternative paths...');
      const fallback = new Image();
      fallback.src = '/src/pngs/MoggedPng.jpeg';
      fallback.onload = () => {
        this.moggedImage = fallback;
        this.moggedImageLoaded = true;
      };
    };
  }

  drawCover(
    ctx: CanvasRenderingContext2D,
    source: ImageBitmap | HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    isMirrored: boolean = false
  ): void {
    if (!source) return;
    try {
      const bw = (source as any).videoWidth || source.width;
      const bh = (source as any).videoHeight || source.height;
      if (!bw || !bh || bw <= 0 || bh <= 0) return;
      const scale = Math.max(w / bw, h / bh);
      const sw = Math.min(bw, w / scale);
      const sh = Math.min(bh, h / scale);
      const sx = Math.max(0, (bw - sw) / 2);
      const sy = Math.max(0, (bh - sh) / 2);

      if (isMirrored) {
        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(source as any, sx, sy, sw, sh, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(source as any, sx, sy, sw, sh, x, y, w, h);
      }
    } catch {
      // Suppress detached ImageBitmap or glitch errors so render loop never crashes
    }
  }

  drawBlendedFrame(
    ctx: CanvasRenderingContext2D,
    frameA: FrameItem | null,
    frameB: FrameItem | null,
    blend: number,
    w: number,
    h: number,
    isMirrored: boolean
  ): void {
    try {
      if (frameA?.bitmap) {
        this.drawCover(ctx, frameA.bitmap, 0, 0, w, h, isMirrored);
      }
      if (frameB?.bitmap && blend > 0.02 && frameB !== frameA) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, blend));
        this.drawCover(ctx, frameB.bitmap, 0, 0, w, h, isMirrored);
        ctx.restore();
      }
    } catch {}
  }

  startEdit(options: EditRenderOptions): void {
    this.stop();
    this.isRendering = true;

    if (options.preset === 'ghost_trail_impact' || options.preset === 'parallax_dual_speed') {
      this.startGhostTrailImpact(options);
      return;
    }
    if (options.preset === 'dark_manga_strobe') {
      this.startDarkMangaStrobe(options);
      return;
    }

    this.loadMeme(options.matchedMemeImage);
    if (!this.moggedImageLoaded) {
      this.loadMoggedPng();
    }

    const { canvas, isMirrored = false, onComplete, onDropImpact } = options;
    const getFrames = () => {
      if (options.getSessionFrames) {
        const sFrames = options.getSessionFrames();
        if (sFrames && sFrames.length > 0) return sFrames;
      }
      return options.actionFrames || options.frames || [];
    };

    const actionList =
      options.actionFrames && options.actionFrames.length > 5
        ? options.actionFrames.filter((f) => f && f.bitmap && f.bitmap.width > 0)
        : getFrames().filter((f) => f && f.bitmap && f.bitmap.width > 0);

    const actionLen = Math.max(1, actionList.length);
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    const startTime = options.startTime ?? performance.now();
    const durationMs = options.durationMs ?? 11150;
    const impactTime = 4750;
    const zoomTakeoverStart = 5250;
    const zoomTakeoverMid = 6100;
    const zoomTakeoverEnd = 6710;
    const hardSnapsStart = 6710;
    const kicks = [6710, 7470, 8050, 8640, 9260, 9880, 10500];

    let hasTriggeredImpact = false;
    let hasTriggeredDrop = false;
    let freezeFrame: FrameItem | null = null;
    let freezeEyeCenter: { x: number; y: number } | undefined;
    let lastValidFrame: FrameItem | null = null;

    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

    const drawFrameOrVideo = (frame: FrameItem | null | undefined, x = 0, y = 0, w = canvas.width, h = canvas.height) => {
      if (frame?.bitmap && frame.bitmap.width > 0) {
        this.drawCover(ctx, frame.bitmap, x, y, w, h, isMirrored);
      } else if (lastValidFrame?.bitmap && lastValidFrame.bitmap.width > 0) {
        this.drawCover(ctx, lastValidFrame.bitmap, x, y, w, h, isMirrored);
      } else if (options.videoElement && options.videoElement.readyState >= 2) {
        this.drawCover(ctx, options.videoElement, x, y, w, h, isMirrored);
      }
    };

    const render = (now: number) => {
      if (!this.isRendering) return;
      const elapsed = now - startTime;

      if (elapsed >= impactTime && !hasTriggeredImpact) {
        hasTriggeredImpact = true;
        onDropImpact?.();
      }
      if (elapsed >= hardSnapsStart && !hasTriggeredDrop) {
        hasTriggeredDrop = true;
        onDropImpact?.();
      }

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.save();
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, cw, ch);

      const allFrames = getFrames().filter((f) => f && f.bitmap && f.bitmap.width > 0);
      const fallbackList = allFrames.length > 0 ? allFrames : actionList;
      const totalCount = fallbackList.length;
      const getClamped = (idx: number) => fallbackList[Math.min(totalCount - 1, Math.max(0, idx))];

      let currentFrame: FrameItem;
      if (elapsed < impactTime) {
        const p = Math.min(1, Math.max(0, elapsed / impactTime));
        const idx = Math.floor(p * (actionLen - 1));
        currentFrame = actionList[Math.min(actionLen - 1, Math.max(0, idx))] || fallbackList[0];
      } else if (elapsed >= impactTime && elapsed < hardSnapsStart) {
        if (!freezeFrame) {
          freezeFrame = fallbackList[fallbackList.length - 1];
          freezeEyeCenter = options.getCurrentEyeCenter?.() ?? options.eyeCenter;
        }
        currentFrame = freezeFrame;
      } else {
        currentFrame = getClamped(totalCount - 1);
      }

      if (currentFrame) lastValidFrame = currentFrame;

      const liveEyes = options.getCurrentEyeCenter?.();
      const eyePos =
        elapsed >= impactTime && elapsed < hardSnapsStart
          ? freezeEyeCenter || liveEyes || options.eyeCenter
          : liveEyes || freezeEyeCenter || options.eyeCenter;

      let shakeX = 0;
      let shakeY = 0;
      if (elapsed >= impactTime && elapsed < impactTime + 300) {
        const sp = 1 - (elapsed - impactTime) / 300;
        shakeX = (Math.random() - 0.5) * sp * 30;
        shakeY = (Math.random() - 0.5) * sp * 30;
      }
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.translate(cw / 2 + shakeX, ch / 2 + shakeY);
        ctx.translate(-cw / 2, -ch / 2);
      }

      const isMogHold = elapsed >= impactTime && elapsed < hardSnapsStart;

      if (elapsed < impactTime) {
        const zoom = 1 + Math.min(1, Math.max(0, elapsed / impactTime)) * 0.08;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        const focalX = eyePos ? eyePos.x * cw : cw / 2;
        const focalY = eyePos ? eyePos.y * ch : ch * 0.4;
        ctx.translate(focalX, focalY);
        ctx.scale(zoom, zoom);
        ctx.translate(-focalX, -focalY);
        ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
        drawFrameOrVideo(currentFrame);
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (isMogHold) {
        ctx.save();
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(95%)';
        drawFrameOrVideo(currentFrame);
        ctx.restore();

        const grad = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.25, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        this.renderBeatHardSnaps(ctx, currentFrame || lastValidFrame, cw, ch, elapsed, kicks, eyePos, isMirrored, options.videoElement);
      }

      if (isMogHold) {
        ctx.save();
        const eyes = freezeEyeCenter || options.getCurrentEyeCenter?.() || options.eyeCenter;
        const cx = eyes ? eyes.x * cw : cw / 2;
        const cy = eyes ? eyes.y * ch : ch * 0.38;
        const boxW = Math.max(160, Math.min(cw * 0.35, 360));
        const boxH = boxW / 4.2;
        const boxX = cx - boxW / 2;
        const boxY = cy - boxH / 2;

        const redGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, boxW * 0.55);
        redGlow.addColorStop(0, 'rgba(230, 0, 30, 0.45)');
        redGlow.addColorStop(0.6, 'rgba(180, 0, 20, 0.15)');
        redGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = redGlow;
        ctx.fillRect(boxX - 30, boxY - 30, boxW + 60, boxH + 60);

        if (this.moggedImage && this.moggedImageLoaded) {
          ctx.drawImage(this.moggedImage, boxX, boxY, boxW, boxH);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(boxX, boxY, boxW, boxH);
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = '#ff0033';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('MOGGED', cx, cy);
        }
        ctx.restore();
      }

      if (elapsed >= zoomTakeoverStart && elapsed < zoomTakeoverEnd) {
        const topFrame = fallbackList[totalCount - 1];
        this.renderPopUpZoomTakeover(
          ctx,
          topFrame,
          cw,
          ch,
          elapsed,
          zoomTakeoverStart,
          zoomTakeoverMid,
          zoomTakeoverEnd,
          isMirrored
        );
      }

      if (elapsed >= hardSnapsStart && elapsed < hardSnapsStart + 850) {
        this.renderMemeZoomInOut(ctx, cw, ch, elapsed, hardSnapsStart, 850, 'BATMAN // SIGMA DROP');
      }

      ctx.restore();

      if (elapsed >= durationMs) {
        this.stop();
        onComplete?.();
      }
    };

    const workerTick = (tNow: number) => {
      if (this.isRendering && tNow - lastRenderTime >= 13) {
        lastRenderTime = tNow;
        render(tNow);
      }
    };

    const rafLoop = (rafNow: number) => {
      if (this.isRendering) {
        workerTickTimer.recordRafTick(rafNow);
        if (rafNow - lastRenderTime < 13) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
          return;
        }
        lastRenderTime = rafNow;
        render(rafNow);
        if (this.isRendering) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
        }
      }
    };

    this.unregisterWorkerTick = workerTickTimer.register(workerTick);
    this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
  }

  getLastKickIndex(kicks: number[], elapsed: number): number {
    for (let i = kicks.length - 1; i >= 0; i--) {
      if (elapsed >= kicks[i]) return i;
    }
    return -1;
  }

  applyCinematicGrade(
    ctx: CanvasRenderingContext2D,
    x: number = 0,
    y: number = 0,
    w?: number,
    h?: number
  ): void {
    const cw = w ?? ctx.canvas.width;
    const ch = h ?? ctx.canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(16, 14, 20, 0.12)';
    ctx.fillRect(x, y, cw, ch);

    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(x, y, x, y + ch);
    grad.addColorStop(0, 'rgba(255, 200, 150, 0.16)');
    grad.addColorStop(0.42, 'rgba(255, 180, 130, 0.09)');
    grad.addColorStop(1, 'rgba(12, 14, 22, 0.20)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, cw, ch);

    ctx.globalCompositeOperation = 'source-over';
    const cx = x + cw / 2;
    const cy = y + ch * 0.44;
    const r1 = Math.min(cw, ch) * 0.32;
    const r2 = Math.max(cw, ch) * 0.7;
    const vignette = ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.55, 'rgba(0, 0, 0, 0.08)');
    vignette.addColorStop(0.82, 'rgba(0, 0, 0, 0.32)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.60)');
    ctx.fillStyle = vignette;
    ctx.fillRect(x, y, cw, ch);
    ctx.restore();
  }

  renderBeatHardSnaps(
    ctx: CanvasRenderingContext2D,
    frame: FrameItem | null | undefined,
    w: number,
    h: number,
    elapsed: number,
    kicks: number[],
    eyeCenter?: { x: number; y: number },
    isMirrored: boolean = false,
    videoFallback?: HTMLVideoElement | null
  ): void {
    const drawBitmapOrVideo = (dx = 0, dy = 0) => {
      if (frame?.bitmap && frame.bitmap.width > 0) {
        this.drawCover(ctx, frame.bitmap, dx, dy, w, h, isMirrored);
      } else if (videoFallback && videoFallback.readyState >= 2) {
        this.drawCover(ctx, videoFallback, dx, dy, w, h, isMirrored);
      }
    };

    const kickIdx = this.getLastKickIndex(kicks, elapsed);
    const kickTime = kickIdx >= 0 ? kicks[kickIdx] : kicks[0];
    const diff = elapsed - kickTime;
    const isMajor = kickIdx === 0 || kickIdx === 2 || kickIdx === 4 || kickIdx === 6;

    let zoom = 1.12;
    if (isMajor) {
      if (kickIdx === 6) zoom = 1.82;
      else if (kickIdx === 4) zoom = 1.78;
      else if (kickIdx === 2) zoom = 1.75;
      else zoom = 1.68;
    }

    let cx = w / 2;
    let cy = h / 2;
    if (isMajor) {
      cx = eyeCenter ? eyeCenter.x * w : w / 2;
      cy = eyeCenter ? eyeCenter.y * h : h * 0.38;
    }

    let shakeX = 0;
    let shakeY = 0;
    if (diff < 60) {
      if (diff < 30) {
        const dirX = kickIdx % 2 === 0 ? 1 : -1;
        const dirY = kickIdx % 3 === 0 ? 1 : -1;
        shakeX = dirX * (14 + ((kickIdx * 5) % 5));
        shakeY = dirY * (14 + ((kickIdx * 7) % 5));
      } else {
        shakeX = (kickIdx % 2 === 0 ? 1 : -1) * 3;
        shakeY = (kickIdx % 3 === 0 ? 1 : -1) * 3;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.translate(cx + shakeX, cy + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    const isFlash = diff < 65;
    if (isFlash) {
      ctx.filter = 'contrast(280%) brightness(190%) saturate(140%)';
    } else {
      ctx.filter = 'contrast(128%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
    }

    drawBitmapOrVideo();

    if (diff < 160 && !isFlash) {
      const p = 1 - diff / 160;
      const offset = Math.pow(p, 1.2) * 26;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.pow(p, 1.5) * 0.7;
      ctx.filter = 'hue-rotate(90deg) contrast(180%) brightness(120%)';
      drawBitmapOrVideo(-offset, -2);
      ctx.filter = 'hue-rotate(-90deg) contrast(180%) brightness(120%)';
      drawBitmapOrVideo(offset, 2);
      ctx.restore();
    }

    if (!isFlash) {
      this.applyCinematicGrade(ctx, 0, 0, w, h);
    }
    ctx.restore();
  }

  renderPopUpZoomTakeover(
    ctx: CanvasRenderingContext2D,
    frame: FrameItem | null | undefined,
    w: number,
    h: number,
    elapsed: number,
    t1: number,
    t2: number,
    t3: number,
    isMirrored: boolean
  ): void {
    if (!frame?.bitmap) return;
    ctx.save();
    const boxW = w * 0.58;
    const boxH = h * 0.75;
    const startX = (w - boxW) / 2;
    const startY = h;
    const endY = h * 0.2;

    let curX = startX;
    let curY = endY;
    let curW = boxW;
    let curH = boxH;
    let radius = 16;
    let shadowAlpha = 0.92;

    if (elapsed >= t2) {
      const p = Math.min(1, Math.max(0, (elapsed - t2) / (t3 - t2)));
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      curX = startX * (1 - ease);
      curY = endY * (1 - ease);
      curW = boxW * (1 - ease) + w * ease;
      curH = boxH * (1 - ease) + h * ease;
      radius = Math.max(0, 16 * (1 - ease * 1.5));
      shadowAlpha = Math.max(0, 0.92 * (1 - ease));
    } else {
      const p = Math.min(1, Math.max(0, (elapsed - t1) / (t2 - t1)));
      const overshoot = 1.6;
      const ease = (p - 1) * (p - 1) * ((overshoot + 1) * (p - 1) + overshoot) + 1;
      const clamped = Math.max(0, ease);
      curX = startX;
      curY = startY - clamped * (startY - endY);
      curW = boxW;
      curH = boxH;
    }

    ctx.save();
    if (shadowAlpha > 0.05) {
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;
    }
    ctx.beginPath();
    if (radius > 0.5 && typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(curX, curY, curW, curH, radius);
    } else {
      ctx.rect(curX, curY, curW, curH);
    }
    ctx.clip();
    ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
    this.drawCover(ctx, frame.bitmap, curX, curY, curW, curH, isMirrored);
    this.applyCinematicGrade(ctx, curX, curY, curW, curH);
    ctx.restore();
    ctx.restore();
  }

  startGhostTrailImpact(options: EditRenderOptions): void {
    const { canvas, isMirrored = false, onComplete, onDropImpact } = options;
    const getFrames = () => {
      if (options.getSessionFrames) {
        const sFrames = options.getSessionFrames();
        if (sFrames && sFrames.length > 0) return sFrames;
      }
      return options.actionFrames || options.frames || [];
    };

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    this.loadMeme(options.matchedMemeImage);

    const startTime = options.startTime ?? performance.now();
    const durationMs = options.durationMs ?? 15940;
    const dropTime = 4940;
    const beatKicks = [
      4940, 5220, 5470, 5720, 6010, 6230, 6450, 6730, 7080, 7320, 7550, 7960,
      8260, 8510, 8720, 8950, 9160, 9400, 9620, 9900, 10120, 10360, 10580,
      10800, 11020, 11230, 11530, 11750, 12010, 12350, 12620, 12830, 13070,
      13340, 13550, 13790, 14010, 14220, 14460, 14700, 14920,
    ];

    let hasDropped = false;
    let freezeFrame: FrameItem | null = null;
    let lastValidFrame: FrameItem | null = null;

    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

    const drawFrameOrVideo = (frame: FrameItem | null | undefined, x = 0, y = 0, w = canvas.width, h = canvas.height) => {
      if (frame?.bitmap && frame.bitmap.width > 0) {
        this.drawCover(ctx, frame.bitmap, x, y, w, h, isMirrored);
      } else if (lastValidFrame?.bitmap && lastValidFrame.bitmap.width > 0) {
        this.drawCover(ctx, lastValidFrame.bitmap, x, y, w, h, isMirrored);
      } else if (options.videoElement && options.videoElement.readyState >= 2) {
        this.drawCover(ctx, options.videoElement, x, y, w, h, isMirrored);
      }
    };

    const render = (now: number) => {
      if (!this.isRendering) return;
      const elapsed = now - startTime;

      if (elapsed >= dropTime && !hasDropped) {
        hasDropped = true;
        onDropImpact?.();
      }

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.save();
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, cw, ch);

      const allFrames = getFrames().filter(
        (f) => f && f.bitmap && f.bitmap.width > 0
      );
      const validPool =
        allFrames.length > 0
          ? allFrames
          : (options.actionFrames || options.frames || []).filter(
              (f) => f && f.bitmap && f.bitmap.width > 0
            );

      const R = validPool[validPool.length - 1] || lastValidFrame;
      if (R) lastValidFrame = R;

      const moments = options.getPostTriggerMoments ? options.getPostTriggerMoments(now) : undefined;

      if (elapsed < 3000) {
        const p = elapsed / 3000;
        const targetFrame = R || lastValidFrame;
        const zoom = 1 + p * 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
        const fx = eyes ? eyes.x * cw : cw / 2;
        const fy = eyes ? eyes.y * ch : ch * 0.4;
        ctx.translate(fx, fy);
        ctx.scale(zoom, zoom);
        ctx.translate(-fx, -fy);
        ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
        drawFrameOrVideo(targetFrame);
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (elapsed >= 3000 && elapsed < 3450) {
        if (!freezeFrame && (R || lastValidFrame)) {
          freezeFrame = R || lastValidFrame;
        }
        const p = (elapsed - 3000) / 450;
        const isLate = elapsed >= 3250;
        const targetFrame = freezeFrame || R || lastValidFrame;
        const zoom = 1.15 + Math.sin(p * Math.PI) * 0.18;
        const shake = Math.sin(p * Math.PI) * (isLate ? 12 : -12);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(cw / 2 + shake, ch / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-cw / 2, -ch / 2);
        if (elapsed >= 3200 && elapsed < 3270) {
          ctx.filter = 'invert(100%) contrast(140%)';
        } else if (elapsed >= 3270 && elapsed < 3360) {
          ctx.filter = 'grayscale(100%) contrast(240%) brightness(112%)';
        } else {
          ctx.filter = 'contrast(125%) saturate(106%) brightness(96%) hue-rotate(-5deg)';
        }
        drawFrameOrVideo(targetFrame);
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (elapsed >= 3450 && elapsed < 4940) {
        const allRec = moments?.allRecorded && moments.allRecorded.length > 0 ? moments.allRecorded : validPool;
        const motion = moments?.motionMoment && moments.motionMoment.length > 3
          ? moments.motionMoment
          : allRec.length > 6
          ? allRec.slice(Math.floor(allRec.length * 0.2))
          : allRec;
        const mLen = Math.max(1, motion.length);
        const p = (elapsed - 3450) / 1490;
        const idx = Math.min(mLen - 1, Math.max(0, Math.floor(p * (mLen - 1))));
        const targetFrame = motion[idx] || freezeFrame || R || lastValidFrame;
        freezeFrame = targetFrame;

        let zoom = 1.28 + p * 0.22;
        if (elapsed >= 4200) {
          zoom += Math.sin((elapsed - 4200) * 0.025) * 0.03;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
        const fx = eyes ? eyes.x * cw : cw / 2;
        const fy = eyes ? eyes.y * ch : ch * 0.4;
        ctx.translate(fx, fy);
        ctx.scale(zoom, zoom);
        ctx.translate(-fx, -fy);
        ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
        drawFrameOrVideo(targetFrame);
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (elapsed >= 4940 && elapsed < 14500) {
        let bestDiff = 9999;
        let kickIdx = 0;
        for (let i = 0; i < beatKicks.length; i++) {
          const k = beatKicks[i];
          if (elapsed >= k && elapsed - k < bestDiff) {
            bestDiff = elapsed - k;
            kickIdx = i;
          }
        }

        let shakeX = 0;
        let shakeY = 0;
        if (bestDiff < 60) {
          if (bestDiff < 30) {
            const dirX = kickIdx % 2 === 0 ? 1 : -1;
            const dirY = kickIdx % 3 === 0 ? 1 : -1;
            shakeX = dirX * (14 + ((kickIdx * 7) % 6));
            shakeY = dirY * (14 + ((kickIdx * 11) % 6));
          } else {
            shakeX = (kickIdx % 2 === 0 ? 1 : -1) * 3;
            shakeY = (kickIdx % 3 === 0 ? 1 : -1) * 3;
          }
        }

        let mode = 'LIVE_FEED';
        let scale = 1.12;
        let isClimax = false;

        if (kickIdx === 0) {
          mode = 'POST_CLIMAX';
          scale = 1.74;
          isClimax = true;
        } else if (kickIdx === 1) {
          mode = 'LIVE_FEED';
          scale = 1.12;
        } else {
          const pseudoRand = (kickIdx * 23 + 17) % 100;
          if (pseudoRand < 36) {
            mode = 'LIVE_FEED';
            scale = 1.12;
          } else if (pseudoRand < 62) {
            mode = 'POST_CLIMAX';
            scale = 1.76;
            isClimax = true;
          } else if (pseudoRand < 80) {
            mode = 'POST_MOTION';
            scale = 1.42;
          } else if (pseudoRand < 90) {
            mode = 'POST_START';
            scale = 1.25;
          } else {
            mode = 'POST_DROP_RECENT';
            scale = 1.48;
          }
        }

        if (bestDiff < 50 && !isClimax) {
          scale = Math.max(scale, 1.26);
        }

        const climaxFrames = moments?.climaxMoment && moments.climaxMoment.length > 0
          ? moments.climaxMoment
          : freezeFrame
          ? [freezeFrame]
          : R
          ? [R]
          : validPool;
        const motionFrames = moments?.motionMoment && moments.motionMoment.length > 0
          ? moments.motionMoment
          : climaxFrames;
        const startFrames = moments?.startMoment && moments.startMoment.length > 0
          ? moments.startMoment
          : motionFrames;
        const dropFrames = moments?.dropMoments && moments.dropMoments.length > 0
          ? moments.dropMoments[moments.dropMoments.length - 1]
          : climaxFrames;

        let activeTarget: FrameItem | undefined;
        if (mode === 'POST_CLIMAX') {
          const fIdx = Math.max(0, climaxFrames.length - 1 - (Math.floor(bestDiff / 35) % Math.min(3, Math.max(1, climaxFrames.length))));
          activeTarget = climaxFrames[fIdx] || climaxFrames[climaxFrames.length - 1];
        } else if (mode === 'POST_MOTION') {
          const fIdx = Math.floor(bestDiff / 40) % Math.max(1, motionFrames.length);
          activeTarget = motionFrames[fIdx] || motionFrames[0];
        } else if (mode === 'POST_START') {
          const fIdx = Math.floor(bestDiff / 50) % Math.max(1, startFrames.length);
          activeTarget = startFrames[fIdx] || startFrames[0];
        } else if (mode === 'POST_DROP_RECENT') {
          const fIdx = Math.floor(bestDiff / 45) % Math.max(1, dropFrames.length);
          activeTarget = dropFrames[fIdx] || dropFrames[0];
        } else {
          activeTarget = R || lastValidFrame;
        }

        let focalX = cw / 2;
        let focalY = ch / 2;
        if (isClimax) {
          const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
          focalX = eyes ? eyes.x * cw : cw / 2;
          focalY = eyes ? eyes.y * ch : ch * 0.38;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(focalX + shakeX, focalY + shakeY);
        ctx.scale(scale, scale);
        ctx.translate(-focalX, -focalY);

        // Ghost trail screen blend layers
        const isPastHalf = kickIdx >= 38;
        const ghost1 = validPool[Math.max(0, validPool.length - 8)] || R || lastValidFrame;
        if (ghost1?.bitmap) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.22;
          ctx.filter = 'grayscale(90%) contrast(135%) brightness(112%)';
          ctx.translate(cw / 2 - 8, ch / 2);
          ctx.translate(-cw / 2, -ch / 2);
          this.drawCover(ctx, ghost1.bitmap, 0, 0, cw, ch, isMirrored);
          ctx.restore();
        }

        if (isPastHalf || kickIdx < 12) {
          const ghost2 = validPool[Math.max(0, validPool.length - 14)] || R || lastValidFrame;
          if (ghost2?.bitmap) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.14;
            ctx.filter = 'grayscale(90%) contrast(135%) brightness(112%)';
            ctx.translate(cw / 2 + 8, ch / 2);
            ctx.translate(-cw / 2, -ch / 2);
            this.drawCover(ctx, ghost2.bitmap, 0, 0, cw, ch, isMirrored);
            ctx.restore();
          }
        }

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        const isImpactFlash = bestDiff < 55;
        if (isImpactFlash) {
          ctx.filter = 'contrast(138%) brightness(101%) saturate(114%) hue-rotate(-5deg)';
        } else {
          ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
        }
        drawFrameOrVideo(activeTarget);

        if (isImpactFlash && activeTarget?.bitmap) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.22;
          ctx.filter = 'contrast(140%) brightness(115%)';
          this.drawCover(ctx, activeTarget.bitmap, -5, 0, cw, ch, isMirrored);
          ctx.restore();
        }

        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
        ctx.restore();

        // White drop flash impact
        if (elapsed >= 4940 && elapsed < 5010) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();
        }

        if (elapsed >= 4940 && elapsed < 5800) {
          this.renderMemeZoomInOut(ctx, cw, ch, elapsed, 4940, 850, 'SIGMA // DROP IMPACT');
        }
      } else {
        // Outro fade
        let outroTarget: FrameItem | undefined;
        const climaxFrames = moments?.climaxMoment && moments.climaxMoment.length > 0
          ? moments.climaxMoment
          : validPool;
        if (elapsed < 15200) {
          const seq = [0, 1, 2, 1, 0, 1, 2, 1];
          const sIdx = seq[Math.floor((elapsed - 14500) / 33) % seq.length];
          outroTarget = climaxFrames[(climaxFrames.length - 1 - sIdx + climaxFrames.length) % climaxFrames.length] || R;
        } else {
          outroTarget = R || lastValidFrame;
        }

        let scale = 1.12;
        let alpha = 1;
        if (elapsed >= 15200) {
          const p = Math.min(1, (elapsed - 15200) / Math.max(100, durationMs - 15200));
          scale = 1.12 - p * 0.12;
          alpha = 1 - p * 0.35;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(cw / 2, ch / 2);
        ctx.scale(scale, scale);
        ctx.translate(-cw / 2, -ch / 2);
        ctx.globalAlpha = alpha;
        ctx.filter = 'contrast(120%) brightness(97%) saturate(105%) hue-rotate(-5deg)';
        drawFrameOrVideo(outroTarget);
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      }

      ctx.restore();

      if (elapsed >= durationMs) {
        this.stop();
        onComplete?.();
      }
    };

    const workerTick = (tNow: number) => {
      if (this.isRendering && tNow - lastRenderTime >= 13) {
        lastRenderTime = tNow;
        render(tNow);
      }
    };

    const rafLoop = (rafNow: number) => {
      if (this.isRendering) {
        workerTickTimer.recordRafTick(rafNow);
        if (rafNow - lastRenderTime < 13) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
          return;
        }
        lastRenderTime = rafNow;
        render(rafNow);
        if (this.isRendering) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
        }
      }
    };

    this.unregisterWorkerTick = workerTickTimer.register(workerTick);
    this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
  }

  startDarkMangaStrobe(options: EditRenderOptions): void {
    const { canvas, isMirrored = false, onComplete, onDropImpact } = options;
    const getFrames = () => {
      if (options.getSessionFrames) {
        const sFrames = options.getSessionFrames();
        if (sFrames && sFrames.length > 0) return sFrames;
      }
      return options.actionFrames || options.frames || [];
    };

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    this.loadMeme(options.matchedMemeImage);

    const startTime = options.startTime ?? performance.now();
    const durationMs = options.durationMs ?? 15070;
    const dropTime = 3000;
    const sessionStartTime = options.sessionStartTime ?? startTime;
    const strobeKicks = [
      3000, 3460, 3900, 4260, 4840, 5280, 5980, 6420, 6840, 7200, 7600, 8040,
      8480, 8860, 9420, 9840,
    ];

    let hasDropped = false;
    let prevFrame: FrameItem | null = null;
    let lastKickIdx = -1;
    let targetX = canvas.width / 2;
    let targetY = canvas.height * 0.4;
    let initializedPos = false;
    let lastValidFrame: FrameItem | null = null;

    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

    const drawFrameOrVideo = (frame: FrameItem | null | undefined, x = 0, y = 0, w = canvas.width, h = canvas.height) => {
      if (frame?.bitmap && frame.bitmap.width > 0) {
        this.drawCover(ctx, frame.bitmap, x, y, w, h, isMirrored);
      } else if (lastValidFrame?.bitmap && lastValidFrame.bitmap.width > 0) {
        this.drawCover(ctx, lastValidFrame.bitmap, x, y, w, h, isMirrored);
      } else if (options.videoElement && options.videoElement.readyState >= 2) {
        this.drawCover(ctx, options.videoElement, x, y, w, h, isMirrored);
      }
    };

    const render = (now: number) => {
      if (!this.isRendering) return;
      const elapsed = now - startTime;

      if (elapsed >= dropTime && !hasDropped) {
        hasDropped = true;
        onDropImpact?.();
      }

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.save();
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, cw, ch);

      const sessionList = (options.getSessionFrames ? options.getSessionFrames() : []).filter(
        (f) => f && f.bitmap && f.bitmap.width > 0 && f.timestamp >= sessionStartTime
      );
      const fallbackList = (options.actionFrames || options.frames || []).filter(
        (f) => f && f.bitmap && f.bitmap.width > 0
      );
      const H = sessionList.length > 0 ? sessionList : fallbackList;
      const count = H.length;

      const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
      const curX = eyes ? eyes.x * cw : cw / 2;
      const curY = eyes ? eyes.y * ch : ch * 0.4;

      if (initializedPos) {
        targetX += (curX - targetX) * 0.08;
        targetY += (curY - targetY) * 0.08;
      } else {
        targetX = curX;
        targetY = curY;
        initializedPos = true;
      }

      if (elapsed < 3000) {
        const p = elapsed / 3000;
        const scale = 1 + (0.5 - 0.5 * Math.cos(Math.PI * p)) * 0.28;
        let frameA: FrameItem | null = null;
        let frameB: FrameItem | null = null;
        let blend = 0;

        if (count > 0) {
          const scaledIdx = p * Math.max(1, (count - 1) * 0.55);
          const iA = Math.min(count - 1, Math.max(0, Math.floor(scaledIdx)));
          const iB = Math.min(count - 1, iA + 1);
          blend = scaledIdx - Math.floor(scaledIdx);
          frameA = H[iA];
          frameB = H[iB];
        } else {
          frameA = prevFrame || lastValidFrame;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(98%)';

        if (frameA?.bitmap) {
          this.drawBlendedFrame(ctx, frameA, frameB, blend, cw, ch, isMirrored);
          prevFrame = frameA;
          lastValidFrame = frameA;
        } else {
          drawFrameOrVideo(frameA);
        }
        ctx.restore();
      } else if (elapsed >= 3000 && elapsed < 10580) {
        let kickIdx = 0;
        for (let i = 0; i < strobeKicks.length; i++) {
          if (elapsed >= strobeKicks[i]) kickIdx = i;
        }
        if (kickIdx !== lastKickIdx) {
          lastKickIdx = kickIdx;
        }

        const kStart = strobeKicks[kickIdx];
        const kNext = kickIdx < strobeKicks.length - 1 ? strobeKicks[kickIdx + 1] : 10580;
        const kDur = Math.max(100, kNext - kStart);
        const kElapsed = elapsed - kStart;
        const progress = Math.min(1, Math.max(0, kElapsed / kDur));

        const ease = Math.sin(progress * (Math.PI / 2));
        const scale = 1.22 - ease * (1.22 - 1.08);

        const permTable = [0, 8, 2, 10, 4, 12, 1, 9, 3, 11, 5, 13, 6, 14, 7, 15];
        const perm = permTable[kickIdx % 16] / 16;
        const offsetBase = Math.floor(perm * Math.max(1, count - 10));
        const offsetSpeed = Math.max(4, Math.min(8, Math.round(kDur / 75)));
        const finalOffset = offsetBase + progress * offsetSpeed;
        const iA = Math.min(count - 1, Math.max(0, Math.floor(finalOffset)));
        const iB = Math.min(count - 1, iA + 1);
        const blend = finalOffset - Math.floor(finalOffset);

        const targetA = H[iA] || prevFrame || lastValidFrame;
        const targetB = H[iB] || targetA;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(98%)';

        if (targetA?.bitmap) {
          this.drawBlendedFrame(ctx, targetA, targetB, blend, cw, ch, isMirrored);
          prevFrame = targetA;
          lastValidFrame = targetA;
        } else {
          drawFrameOrVideo(targetA);
        }

        if (kElapsed < 35) {
          const flashAlpha = 0.18 * (1 - kElapsed / 35);
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();
        }
        ctx.restore();
      } else if (elapsed >= 10580 && elapsed < 13500) {
        const p = (elapsed - 10580) / 2920;
        const scale = 1.02 - Math.sin(p * (Math.PI / 2)) * 0.015;
        const startIdx = Math.floor(count * 0.65);
        const curIdx = startIdx + p * Math.max(1, (count - 1 - startIdx) * 0.5);
        const iA = Math.min(count - 1, Math.max(0, Math.floor(curIdx)));
        const iB = Math.min(count - 1, iA + 1);
        const blend = curIdx - Math.floor(curIdx);
        const targetA = H[iA] || prevFrame || lastValidFrame;
        const targetB = H[iB] || targetA;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(98%)';

        if (targetA?.bitmap) {
          this.drawBlendedFrame(ctx, targetA, targetB, blend, cw, ch, isMirrored);
          prevFrame = targetA;
          lastValidFrame = targetA;
        } else {
          drawFrameOrVideo(targetA);
        }
        ctx.restore();
      } else {
        const p = Math.min(1, Math.max(0, (elapsed - 13500) / Math.max(100, durationMs - 13500)));
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
        const scale = 1.005 - ease * 0.005;
        const sat = Math.round(ease * 100);
        const contrast = Math.round(140 - ease * 40);
        const target = H[count - 1] || prevFrame || lastValidFrame;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);
        ctx.filter = `saturate(${sat}%) contrast(${contrast}%)`;

        if (target?.bitmap) {
          this.drawCover(ctx, target.bitmap, 0, 0, cw, ch, isMirrored);
          prevFrame = target;
          lastValidFrame = target;
        } else {
          drawFrameOrVideo(target);
        }
        ctx.restore();
      }

      if (elapsed >= dropTime && elapsed < dropTime + 850) {
        this.renderMemeZoomInOut(ctx, cw, ch, elapsed, dropTime, 850, 'DARK MANGA // MOGGED');
      }

      ctx.restore();

      if (elapsed >= durationMs) {
        this.stop();
        onComplete?.();
      }
    };

    const workerTick = (tNow: number) => {
      if (this.isRendering && tNow - lastRenderTime >= 13) {
        lastRenderTime = tNow;
        render(tNow);
      }
    };

    const rafLoop = (rafNow: number) => {
      if (this.isRendering) {
        workerTickTimer.recordRafTick(rafNow);
        if (rafNow - lastRenderTime < 13) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
          return;
        }
        lastRenderTime = rafNow;
        render(rafNow);
        if (this.isRendering) {
          this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
        }
      }
    };

    this.unregisterWorkerTick = workerTickTimer.register(workerTick);
    this.animFrameId = targetWin.requestAnimationFrame(rafLoop);
  }

  stop(): void {
    this.isRendering = false;
    if (this.unregisterWorkerTick) {
      this.unregisterWorkerTick();
      this.unregisterWorkerTick = null;
    }
    if (this.animFrameId) {
      (this.currentTargetWin || window).cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentTargetWin = null;
  }
}

export const editRenderer = new EditRenderer();
