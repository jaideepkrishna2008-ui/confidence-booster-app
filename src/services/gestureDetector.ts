import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { FaceData, HandData, DetectionMetrics, DetectionResult, TriggerMode } from '../types';
import { deviceManager } from './deviceManager';

class GestureDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private lastTriggerTime: number = 0;
  private triggerCooldownMs: number = 4500;
  private sensitivity: number = 1;
  private downscaleCanvas: HTMLCanvasElement | null = null;
  private downscaleCtx: CanvasRenderingContext2D | null = null;
  private lastDownscaleW: number = 0;
  private lastDownscaleH: number = 0;

  async initialize(): Promise<void> {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      const isMobile = deviceManager.isMobile();

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: isMobile ? 1 : 2,
      });

      this.isLoaded = true;
      console.log('MediaPipe Vision AI models loaded successfully!');
    } catch (err) {
      console.warn('MediaPipe GPU load failed, falling back to CPU or heuristics:', err);
    } finally {
      this.isLoading = false;
    }
  }

  setSensitivity(val: number): void {
    this.sensitivity = Math.max(0.5, Math.min(2, val));
  }

  getSensitivity(): number {
    return this.sensitivity;
  }

  isModelReady(): boolean {
    return this.isLoaded;
  }

  detect(
    video: HTMLVideoElement,
    timestamp: number,
    triggerMode: TriggerMode = 'both'
  ): DetectionResult {
    const defaultFace: FaceData = {
      detected: false,
      box: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
      pitch: 0,
      yaw: 0,
      roll: 0,
      mouthCenter: { x: 0.5, y: 0.65 },
      noseBridge: { x: 0.5, y: 0.45 },
      leftEye: { x: 0.4, y: 0.4 },
      rightEye: { x: 0.6, y: 0.4 },
    };

    const defaultHands: HandData = {
      detected: false,
      points: [],
    };

    const metrics: DetectionMetrics = {
      drinkScore: 0,
      glassesScore: 0,
      statusText: this.isLoaded ? 'MONITOR: LIVE' : 'INITIALIZING AI...',
    };

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (video.readyState < 2 || vw === 0 || vh === 0) {
      return {
        face: defaultFace,
        hands: defaultHands,
        metrics,
        triggeredAction: null,
      };
    }

    const { width: targetW, height: targetH } = deviceManager.getVisionInputSize();
    const aspect = vw / vh;
    let downW = targetW;
    let downH = Math.round(targetW / aspect);
    if (downH > targetH) {
      downH = targetH;
      downW = Math.round(targetH * aspect);
    }

    if (!this.downscaleCanvas) {
      this.downscaleCanvas = document.createElement('canvas');
      this.downscaleCtx = this.downscaleCanvas.getContext('2d', { willReadFrequently: false });
    }

    if (this.lastDownscaleW !== downW || this.lastDownscaleH !== downH) {
      this.downscaleCanvas.width = downW;
      this.downscaleCanvas.height = downH;
      this.lastDownscaleW = downW;
      this.lastDownscaleH = downH;
    }

    if (this.downscaleCtx) {
      this.downscaleCtx.drawImage(video, 0, 0, downW, downH);
    }

    const inputCanvas = this.downscaleCanvas || video;
    const face: FaceData = { ...defaultFace };
    const hands: HandData = { ...defaultHands };

    if (this.faceLandmarker) {
      try {
        const res = this.faceLandmarker.detectForVideo(inputCanvas, timestamp);
        if (res.faceLandmarks && res.faceLandmarks.length > 0) {
          const lms = res.faceLandmarks[0];
          face.detected = true;

          let minX = 1,
            maxX = 0,
            minY = 1,
            maxY = 0;
          for (let i = 0; i < lms.length; i += 5) {
            const p = lms[i];
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }

          const padX = (maxX - minX) * 0.15;
          const padY = (maxY - minY) * 0.15;
          face.box = {
            x: Math.max(0, minX - padX),
            y: Math.max(0, minY - padY),
            width: Math.min(1, maxX - minX + padX * 2),
            height: Math.min(1, maxY - minY + padY * 2),
          };

          const topForehead = lms[10];
          const bottomChin = lms[152];
          const noseTip = lms[4] || lms[1];
          const upperLip = lms[13];
          const lowerLip = lms[14];
          const leftEyeOuter = lms[33];
          const rightEyeOuter = lms[263];
          const noseBridge = lms[168] || lms[6];

          face.mouthCenter = {
            x: (upperLip.x + lowerLip.x) / 2,
            y: (upperLip.y + lowerLip.y) / 2,
          };
          face.noseBridge = { x: noseBridge.x, y: noseBridge.y };
          face.leftEye = { x: leftEyeOuter.x, y: leftEyeOuter.y };
          face.rightEye = { x: rightEyeOuter.x, y: rightEyeOuter.y };

          const faceHeight = Math.max(0.01, bottomChin.y - topForehead.y);
          const noseRelY = (noseTip.y - topForehead.y) / faceHeight;
          face.pitch = (0.5 - noseRelY) * 90;

          const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
          face.yaw = (noseTip.x - eyeCenterX) * 120;

          const dy = rightEyeOuter.y - leftEyeOuter.y;
          const dx = rightEyeOuter.x - leftEyeOuter.x;
          face.roll = Math.atan2(dy, dx) * (180 / Math.PI);
        }
      } catch {}
    }

    if (
      this.handLandmarker &&
      face.detected &&
      (triggerMode === 'glasses' || triggerMode === 'both' || (triggerMode === 'drink' && face.pitch > 4))
    ) {
      try {
        const handRes = this.handLandmarker.detectForVideo(inputCanvas, timestamp);
        if (handRes.landmarks && handRes.landmarks.length > 0) {
          hands.detected = true;
          for (const hand of handRes.landmarks) {
            const keyPoints = [hand[4], hand[8], hand[12], hand[0]];
            for (const pt of keyPoints) {
              const distToMouth = Math.hypot(pt.x - face.mouthCenter.x, pt.y - face.mouthCenter.y);
              const distToEyes = Math.hypot(pt.x - face.noseBridge.x, pt.y - face.noseBridge.y);
              hands.points.push({
                x: pt.x,
                y: pt.y,
                isNearMouth: distToMouth < 0.18,
                isNearEyes: distToEyes < 0.15,
              });
            }
          }
        }
      } catch {}
    }

    let triggeredAction: 'drink' | 'glasses' | null = null;
    const now = performance.now();
    const canTrigger = now - this.lastTriggerTime > this.triggerCooldownMs;

    if (face.detected) {
      const isPitchSip = face.pitch > 11 / this.sensitivity;
      const isHandMouth = hands.points.some((p) => p.isNearMouth);

      let drinkScore = 0;
      if (face.pitch > 0) {
        drinkScore = Math.min(1, (face.pitch / 25) * this.sensitivity);
        if (isHandMouth) {
          drinkScore = Math.min(1, drinkScore + 0.45);
        }
      }
      metrics.drinkScore = drinkScore;

      const isHandEyes = hands.points.some((p) => p.isNearEyes);
      let glassesScore = 0;
      if (isHandEyes) {
        glassesScore = Math.min(1, 0.85 * this.sensitivity);
      }
      metrics.glassesScore = glassesScore;

      if (canTrigger) {
        if (
          (triggerMode === 'both' || triggerMode === 'drink') &&
          ((isPitchSip && isHandMouth) || face.pitch > 22 / this.sensitivity)
        ) {
          triggeredAction = 'drink';
          this.lastTriggerTime = now;
        } else if ((triggerMode === 'both' || triggerMode === 'glasses') && isHandEyes) {
          triggeredAction = 'glasses';
          this.lastTriggerTime = now;
        }
      }

      if (triggeredAction) {
        metrics.statusText = `ACTION DETECTED: ${triggeredAction.toUpperCase()}`;
      } else if (isPitchSip || isHandMouth) {
        metrics.statusText = 'TRIGGER: DRINK SIP DETECTING...';
      } else if (isHandEyes) {
        metrics.statusText = 'TRIGGER: GLASSES ADJUST DETECTING...';
      } else {
        metrics.statusText = 'SUBJECT: LOCKED // WAITING...';
      }
    }

    return { face, hands, metrics, triggeredAction };
  }

  resetCooldown(): void {
    this.lastTriggerTime = performance.now();
  }
}

export const gestureDetector = new GestureDetector();
