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
  eyeCenter?: { x: number; y: number };
  getCurrentEyeCenter?: () => { x: number; y: number } | undefined;
  getSessionFrames?: () => FrameItem[];
  getPostTriggerMoments?: (time: number) => any;
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

  constructor() {
    this.loadMoggedPng();
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
    bitmap: ImageBitmap,
    x: number,
    y: number,
    w: number,
    h: number,
    isMirrored: boolean = false
  ): void {
    if (!bitmap || bitmap.width === 0 || bitmap.height === 0) return;
    const bw = bitmap.width;
    const bh = bitmap.height;
    const scale = Math.max(w / bw, h / bh);
    const sw = Math.min(bw, w / scale);
    const sh = Math.min(bh, h / scale);
    const sx = Math.max(0, (bw - sw) / 2);
    const sy = Math.max(0, (bh - sh) / 2);

    if (isMirrored) {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(bitmap, sx, sy, sw, sh, x, y, w, h);
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
    if (frameA?.bitmap) {
      this.drawCover(ctx, frameA.bitmap, 0, 0, w, h, isMirrored);
    }
    if (frameB?.bitmap && blend > 0.02 && frameB !== frameA) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, blend));
      this.drawCover(ctx, frameB.bitmap, 0, 0, w, h, isMirrored);
      ctx.restore();
    }
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

    if (!this.moggedImageLoaded) {
      this.loadMoggedPng();
    }

    const { canvas, isMirrored = false, onComplete, onDropImpact } = options;
    const getFrames = () => {
      if (options.getSessionFrames) {
        const sFrames = options.getSessionFrames();
        if (sFrames && sFrames.length > 0) return sFrames;
      }
      return options.frames || [];
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

    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

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
      if (allFrames.length === 0) {
        ctx.restore();
        return;
      }

      const totalCount = allFrames.length;
      const getClamped = (idx: number) => allFrames[Math.min(totalCount - 1, Math.max(0, idx))];

      let currentFrame: FrameItem;
      if (elapsed < impactTime) {
        const p = Math.min(1, Math.max(0, elapsed / impactTime));
        const idx = Math.floor(p * (actionLen - 1));
        currentFrame = actionList[Math.min(actionLen - 1, Math.max(0, idx))] || allFrames[0];
      } else if (elapsed >= impactTime && elapsed < hardSnapsStart) {
        if (!freezeFrame) {
          freezeFrame = allFrames[allFrames.length - 1];
          freezeEyeCenter = options.getCurrentEyeCenter?.() ?? options.eyeCenter;
        }
        currentFrame = freezeFrame;
      } else {
        currentFrame = getClamped(totalCount - 1);
      }

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
        if (currentFrame?.bitmap) {
          this.drawCover(ctx, currentFrame.bitmap, 0, 0, cw, ch, isMirrored);
        }
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (isMogHold) {
        ctx.save();
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(95%)';
        if (currentFrame?.bitmap) {
          this.drawCover(ctx, currentFrame.bitmap, 0, 0, cw, ch, isMirrored);
        }
        ctx.restore();

        const grad = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.25, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        this.renderBeatHardSnaps(ctx, currentFrame, cw, ch, elapsed, kicks, eyePos, isMirrored);
      }

      if (isMogHold) {
        ctx.save();
        const eyes = freezeEyeCenter || options.getCurrentEyeCenter?.() || options.eyeCenter;
        const cx = eyes ? eyes.x * cw : cw / 2;
        const cy = eyes ? eyes.y * ch : ch * 0.38;
        const boxW = Math.max(160, Math.min(cw * 0.35, 360));
        const boxH = boxW / 4.2;
        const gx = cx - boxW / 2;
        const gy = cy - boxH / 2;

        const redGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, boxW * 0.55);
        redGlow.addColorStop(0, 'rgba(230, 0, 30, 0.45)');
        redGlow.addColorStop(0.6, 'rgba(180, 0, 20, 0.15)');
        redGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = redGlow;
        ctx.fillRect(gx - 30, gy - 30, boxW + 60, boxH + 60);

        if (this.moggedImage && this.moggedImageLoaded) {
          ctx.drawImage(this.moggedImage, gx, gy, boxW, boxH);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(gx, gy, boxW, boxH);
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = '#ff0033';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('MOGGED', cx, cy);
        }
        ctx.restore();
      }

      if (elapsed >= zoomTakeoverStart && elapsed < hardSnapsStart) {
        const lastF = allFrames[totalCount - 1];
        this.renderPopUpZoomTakeover(
          ctx,
          lastF,
          cw,
          ch,
          elapsed,
          zoomTakeoverStart,
          zoomTakeoverMid,
          zoomTakeoverEnd,
          isMirrored
        );
      }

      ctx.restore();

      if (elapsed >= durationMs) {
        this.stop();
        onComplete?.();
      }
    };

    const workerTick = (tNow: number) => {
      if (this.isRendering) {
        if (tNow - lastRenderTime >= 13) {
          lastRenderTime = tNow;
          render(tNow);
        }
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

  private getLastKickIndex(kicks: number[], time: number): number {
    for (let i = kicks.length - 1; i >= 0; i--) {
      if (time >= kicks[i]) return i;
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
    frame: FrameItem,
    w: number,
    h: number,
    elapsed: number,
    kicks: number[],
    eyeCenter?: { x: number; y: number },
    isMirrored: boolean = false
  ): void {
    if (!frame || !frame.bitmap) return;
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

    this.drawCover(ctx, frame.bitmap, 0, 0, w, h, isMirrored);

    if (diff < 160 && !isFlash) {
      const p = 1 - diff / 160;
      const offset = Math.pow(p, 1.2) * 26;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.pow(p, 1.5) * 0.7;
      ctx.filter = 'hue-rotate(90deg) contrast(180%) brightness(120%)';
      this.drawCover(ctx, frame.bitmap, -offset, -2, w, h, isMirrored);
      ctx.filter = 'hue-rotate(-90deg) contrast(180%) brightness(120%)';
      this.drawCover(ctx, frame.bitmap, offset, 2, w, h, isMirrored);
      ctx.restore();
    }

    if (!isFlash) {
      this.applyCinematicGrade(ctx, 0, 0, w, h);
    }
    ctx.restore();
  }

  renderPopUpZoomTakeover(
    ctx: CanvasRenderingContext2D,
    frame: FrameItem,
    w: number,
    h: number,
    elapsed: number,
    t1: number,
    t2: number,
    t3: number,
    isMirrored: boolean
  ): void {
    if (!frame?.bitmap) return;
    const progress = Math.min(1, Math.max(0, (elapsed - t1) / (t3 - t1)));
    const scale = 1 + progress * 0.4;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    this.drawCover(ctx, frame.bitmap, 0, 0, w, h, isMirrored);
    ctx.restore();
  }

  startGhostTrailImpact(options: EditRenderOptions): void {
    const { canvas, isMirrored = false, onComplete, onDropImpact } = options;
    const getFrames = () => {
      if (options.getSessionFrames) {
        const sFrames = options.getSessionFrames();
        if (sFrames && sFrames.length > 0) return sFrames;
      }
      return options.frames || [];
    };

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    const startTime = options.startTime ?? performance.now();
    const durationMs = options.durationMs ?? 15940;
    const dropTime = 4940;

    let hasDropped = false;
    let freezeFrame: FrameItem | null = null;
    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

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

      const allFrames = getFrames().filter((f) => f && f.bitmap && f.bitmap.width > 0);
      const lastF = allFrames[allFrames.length - 1] || freezeFrame;
      if (lastF) freezeFrame = lastF;

      if (elapsed < 3000) {
        const p = elapsed / 3000;
        const scale = 1 + p * 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
        const fx = eyes ? eyes.x * cw : cw / 2;
        const fy = eyes ? eyes.y * ch : ch * 0.4;
        ctx.translate(fx, fy);
        ctx.scale(scale, scale);
        ctx.translate(-fx, -fy);
        ctx.filter = 'contrast(125%) brightness(96%) saturate(106%) hue-rotate(-5deg)';
        if (lastF?.bitmap) {
          this.drawCover(ctx, lastF.bitmap, 0, 0, cw, ch, isMirrored);
        }
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (elapsed >= 3000 && elapsed < 3450) {
        const p = (elapsed - 3000) / 450;
        const scale = 1.15 + Math.sin(p * Math.PI) * 0.18;
        const shake = Math.sin(p * Math.PI) * (elapsed >= 3250 ? 12 : -12);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(cw / 2 + shake, ch / 2);
        ctx.scale(scale, scale);
        ctx.translate(-cw / 2, -ch / 2);

        if (elapsed >= 3200 && elapsed < 3270) {
          ctx.filter = 'invert(100%) contrast(140%)';
        } else if (elapsed >= 3270 && elapsed < 3360) {
          ctx.filter = 'grayscale(100%) contrast(240%) brightness(112%)';
        } else {
          ctx.filter = 'contrast(125%) saturate(106%) brightness(96%) hue-rotate(-5deg)';
        }

        if (lastF?.bitmap) {
          this.drawCover(ctx, lastF.bitmap, 0, 0, cw, ch, isMirrored);
        }
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else if (elapsed >= 3450 && elapsed < 4940) {
        const scale = 1.28 + ((elapsed - 3450) / 1490) * 0.22;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        const eyes = options.getCurrentEyeCenter?.() || options.eyeCenter;
        const fx = eyes ? eyes.x * cw : cw / 2;
        const fy = eyes ? eyes.y * ch : ch * 0.4;
        ctx.translate(fx, fy);
        ctx.scale(scale, scale);
        ctx.translate(-fx, -fy);
        ctx.filter = 'contrast(135%) brightness(102%) saturate(110%)';
        if (lastF?.bitmap) {
          this.drawCover(ctx, lastF.bitmap, 0, 0, cw, ch, isMirrored);
        }
        this.applyCinematicGrade(ctx, 0, 0, cw, ch);
        ctx.restore();
      } else {
        const beatKicks = [4940, 5220, 5470, 5720, 6010, 6230, 6450, 6730, 7080, 7320];
        this.renderBeatHardSnaps(ctx, lastF || allFrames[0], cw, ch, elapsed, beatKicks, options.eyeCenter, isMirrored);
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
      return options.frames || [];
    };

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const startTime = options.startTime ?? performance.now();
    const durationMs = options.durationMs ?? 15070;
    const dropTime = 3000;
    const strobeKicks = [3000, 3460, 3900, 4260, 4840, 5280, 5980, 6420, 6840, 7200, 7600, 8040, 8480, 8860];

    let hasDropped = false;
    let prevFrame: FrameItem | null = null;
    let targetX = canvas.width / 2;
    let targetY = canvas.height * 0.4;
    let initializedPos = false;

    const targetWin =
      canvas.ownerDocument && canvas.ownerDocument.defaultView
        ? canvas.ownerDocument.defaultView
        : window;
    this.currentTargetWin = targetWin;
    let lastRenderTime = 0;

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

      const allFrames = getFrames().filter((f) => f && f.bitmap && f.bitmap.width > 0);
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
        const currentF = allFrames[allFrames.length - 1] || prevFrame;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(98%)';

        if (currentF?.bitmap) {
          this.drawCover(ctx, currentF.bitmap, 0, 0, cw, ch, isMirrored);
          prevFrame = currentF;
        }
        ctx.restore();
      } else {
        // Strobe Manga impact phase
        const currentF = allFrames[allFrames.length - 1] || prevFrame;
        const kickIdx = this.getLastKickIndex(strobeKicks, elapsed);
        const kickTime = kickIdx >= 0 ? strobeKicks[kickIdx] : strobeKicks[0];
        const diff = elapsed - kickTime;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.clip();
        ctx.translate(targetX, targetY);
        const scale = diff < 60 ? 1.25 : 1.1;
        ctx.scale(scale, scale);
        ctx.translate(-targetX, -targetY);

        if (diff < 40) {
          ctx.filter = 'invert(100%) contrast(300%)';
        } else {
          ctx.filter = 'grayscale(100%) contrast(200%) brightness(110%)';
        }

        if (currentF?.bitmap) {
          this.drawCover(ctx, currentF.bitmap, 0, 0, cw, ch, isMirrored);
        }
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
