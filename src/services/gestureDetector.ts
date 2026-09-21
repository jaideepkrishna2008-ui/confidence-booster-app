import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { FaceData, HandData, DetectionMetrics, DetectionResult, TriggerMode } from '../types';
import { deviceManager } from './deviceManager';

class GestureDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private lastTriggerTime: number = 0;
  private triggerCooldownMs: number = 4000;
  private sensitivity: number = 1;
  private downscaleCanvas: HTMLCanvasElement | null = null;
  private downscaleCtx: CanvasRenderingContext2D | null = null;
  private lastDownscaleW: number = 0;
  private lastDownscaleH: number = 0;

  // Motion tracking for crazy head events
  private lastPitch: number = 0;
  private lastYaw: number = 0;
  private lastRoll: number = 0;
  private lastDetectTimestamp: number = 0;
  private smoothedMotion: number = 0;

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
    triggerMode: TriggerMode = 'all'
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
      smileScore: 0,
      mouthOpenness: 0,
      surpriseScore: 0,
      sigmaScore: 0,
      crazyScore: 0,
      detectedExpression: null,
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

    let faceFeatures: Record<string, number> | undefined = undefined;

    // Expression & geometry variables
    let smileScore = 0;
    let mouthOpenness = 0;
    let surpriseScore = 0;
    let sigmaScore = 0;
    let crazyScore = 0;
    let mouthWidthRatio = 0.55;
    let mouthElevation = 0.05;
    let eyeOpenness = 0.22;
    let eyesSymmetry = 0.02;
    let eyebrowHeight = 0.08;
    let browSymmetry = 0.02;

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

          const faceHeight = Math.max(0.01, Math.hypot(bottomChin.x - topForehead.x, bottomChin.y - topForehead.y));
          const noseRelY = (noseTip.y - topForehead.y) / faceHeight;
          face.pitch = (0.5 - noseRelY) * 90;

          const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
          face.yaw = (noseTip.x - eyeCenterX) * 120;

          const dy = rightEyeOuter.y - leftEyeOuter.y;
          const dx = rightEyeOuter.x - leftEyeOuter.x;
          face.roll = Math.atan2(dy, dx) * (180 / Math.PI);

          // -------------------------------------------------------------
          // Advanced Facial Feature Extraction from 468 MediaPipe Points
          // -------------------------------------------------------------
          // Mouth geometry: left corner = 61, right corner = 291
          const mouthLeftCorner = lms[61] || leftEyeOuter;
          const mouthRightCorner = lms[291] || rightEyeOuter;
          const mouthW = Math.hypot(mouthRightCorner.x - mouthLeftCorner.x, mouthRightCorner.y - mouthLeftCorner.y);
          const mouthH = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);

          mouthWidthRatio = Math.min(1, Math.max(0.1, mouthW / (faceHeight * 0.72)));
          mouthOpenness = Math.min(1, Math.max(0, mouthH / (faceHeight * 0.40)));

          // Smile & mouth corner lift
          const lipCornersAvgY = (mouthLeftCorner.y + mouthRightCorner.y) / 2;
          const lipCenterY = (upperLip.y + lowerLip.y) / 2;
          mouthElevation = (lipCenterY - lipCornersAvgY) / faceHeight;

          // Smile formula (mouth width expansion + lip corners lifting upward)
          smileScore = Math.min(1, Math.max(0, (mouthWidthRatio - 0.46) * 2.5 + mouthElevation * 4.0));

          // Eyelid Aperture & EAR: Left (top 159, btm 145, out 33, in 133), Right (top 386, btm 374, out 263, in 362)
          const leftEyeTop = lms[159] || leftEyeOuter;
          const leftEyeBtm = lms[145] || leftEyeOuter;
          const leftEyeIn = lms[133] || leftEyeOuter;
          const leftEyeH = Math.hypot(leftEyeTop.x - leftEyeBtm.x, leftEyeTop.y - leftEyeBtm.y);
          const leftEyeW = Math.max(0.005, Math.hypot(leftEyeOuter.x - leftEyeIn.x, leftEyeOuter.y - leftEyeIn.y));
          const leftEAR = leftEyeH / leftEyeW;

          const rightEyeTop = lms[386] || rightEyeOuter;
          const rightEyeBtm = lms[374] || rightEyeOuter;
          const rightEyeIn = lms[362] || rightEyeOuter;
          const rightEyeH = Math.hypot(rightEyeTop.x - rightEyeBtm.x, rightEyeTop.y - rightEyeBtm.y);
          const rightEyeW = Math.max(0.005, Math.hypot(rightEyeOuter.x - rightEyeIn.x, rightEyeOuter.y - rightEyeIn.y));
          const rightEAR = rightEyeH / rightEyeW;

          eyeOpenness = Math.min(1, Math.max(0.05, (leftEAR + rightEAR) / 2));
          eyesSymmetry = Math.min(1, Math.abs(leftEAR - rightEAR));

          // Eyebrow Elevation: Left brow 70 to eye 159, Right brow 300 to eye 386
          const leftBrow = lms[70] || topForehead;
          const rightBrow = lms[300] || topForehead;
          const leftBrowH = Math.hypot(leftBrow.x - leftEyeTop.x, leftBrow.y - leftEyeTop.y) / faceHeight;
          const rightBrowH = Math.hypot(rightBrow.x - rightEyeTop.x, rightBrow.y - rightEyeTop.y) / faceHeight;

          eyebrowHeight = Math.min(1, Math.max(0.02, (leftBrowH + rightBrowH) / 2));
          browSymmetry = Math.min(1, Math.abs(leftBrowH - rightBrowH));

          // Surprise score (wide open eyes + raised eyebrows)
          surpriseScore = Math.min(1, Math.max(0, (eyebrowHeight - 0.12) * 4.5 + (eyeOpenness - 0.28) * 3.0));

          // Patrick Bateman Sigma face score (Christian Bale squint + knowing smirk / pout + confident brow)
          const squintFactor = Math.max(0, (0.24 - eyeOpenness) * 3.5);
          const smirkFactor = Math.max(0, mouthElevation * 3.5 + (mouthWidthRatio < 0.45 ? 0.35 : 0));
          const asymmetricBrowFactor = Math.min(0.4, browSymmetry * 5.0);
          sigmaScore = Math.min(1, Math.max(0, squintFactor * 0.45 + smirkFactor * 0.40 + asymmetricBrowFactor));

          // Crazy Head Motion / Shake / Tilt tracking
          if (this.lastDetectTimestamp > 0) {
            const dt = Math.max(16, timestamp - this.lastDetectTimestamp) / 1000;
            const deltaPitch = Math.abs(face.pitch - this.lastPitch) / dt;
            const deltaYaw = Math.abs(face.yaw - this.lastYaw) / dt;
            const deltaRoll = Math.abs(face.roll - this.lastRoll) / dt;
            const totalVelocity = Math.hypot(deltaPitch, deltaYaw, deltaRoll);

            // Roll extreme tilt or wild head shake
            const tiltBonus = Math.abs(face.roll) > 28 ? 0.45 : 0;
            const motionInstant = Math.min(1, (totalVelocity / 220) * this.sensitivity + tiltBonus);
            this.smoothedMotion = this.smoothedMotion * 0.55 + motionInstant * 0.45;
          }
          crazyScore = Math.min(1, this.smoothedMotion);

          this.lastPitch = face.pitch;
          this.lastYaw = face.yaw;
          this.lastRoll = face.roll;
          this.lastDetectTimestamp = timestamp;
        }
      } catch {}
    }

    // Hand tracking for drinks / glasses
    const needHands =
      triggerMode === 'all' ||
      triggerMode === 'glasses' ||
      triggerMode === 'both' ||
      (triggerMode === 'drink' && face.pitch > 4);

    if (this.handLandmarker && face.detected && needHands) {
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

    // Detection Scores
    let triggeredAction: 'drink' | 'glasses' | 'expression' | 'crazy' | null = null;
    let detectedExprLabel: string | null = null;
    const now = performance.now();
    const canTrigger = now - this.lastTriggerTime > this.triggerCooldownMs;

    if (face.detected) {
      const isPitchSip = face.pitch > 11 / this.sensitivity;
      const isHandMouth = hands.points.some((p) => p.isNearMouth);
      const isHandEyes = hands.points.some((p) => p.isNearEyes);

      // Drink score
      let drinkScore = 0;
      if (face.pitch > 0) {
        drinkScore = Math.min(1, (face.pitch / 25) * this.sensitivity);
        if (isHandMouth) drinkScore = Math.min(1, drinkScore + 0.45);
      }
      metrics.drinkScore = drinkScore;

      // Glasses score
      let glassesScore = 0;
      if (isHandEyes) {
        glassesScore = Math.min(1, 0.85 * this.sensitivity);
      }
      metrics.glassesScore = glassesScore;

      // Expression scores
      metrics.smileScore = smileScore;
      metrics.mouthOpenness = mouthOpenness;
      metrics.surpriseScore = surpriseScore;
      metrics.sigmaScore = sigmaScore;
      metrics.crazyScore = crazyScore;

      // Build realistic user features map for MemeMatcher
      faceFeatures = {
        surprise_score: surpriseScore,
        smile_score: smileScore,
        concern_score: Math.min(1, Math.max(0, (0.08 - eyebrowHeight) * 3 + (mouthElevation < 0 ? 0.3 : 0))),
        cheers_score: drinkScore * (hands.detected ? 1 : 0.3),
        hand_raised: hands.detected ? 1 : 0,
        num_hands: hands.points.length > 0 ? 1 : 0,
        eye_openness: eyeOpenness,
        eyes_symmetry: eyesSymmetry,
        mouth_openness: mouthOpenness,
        mouth_width_ratio: mouthWidthRatio,
        mouth_elevation: mouthElevation,
        eyebrow_height: eyebrowHeight,
        brow_symmetry: browSymmetry,
        sigma_score: sigmaScore,
      };

      // Specific Expression Recognitions
      const isLaughing = smileScore > 0.62 && mouthOpenness > 0.28;
      const isJawDrop = mouthOpenness > 0.48;
      const isSigmaFace = sigmaScore > 0.65;
      const isEyebrowRaise = eyebrowHeight > 0.20 || browSymmetry > 0.05;
      const isCrazyEvent = crazyScore > 0.65;

      if (isLaughing) detectedExprLabel = 'LAUGHING (MOGGED!)';
      else if (isSigmaFace) detectedExprLabel = 'BATMAN SIGMA FACE';
      else if (isJawDrop) detectedExprLabel = 'JAW DROP / SCREAM';
      else if (isEyebrowRaise) detectedExprLabel = 'THE ROCK EYEBROW';
      else if (isCrazyEvent) detectedExprLabel = 'CRAZY HEAD MOTION';

      metrics.detectedExpression = detectedExprLabel;

      // Check Auto-Trigger conditions
      if (canTrigger) {
        // 1. ALL mode (Triggers on ANY event: Expression, Drink, Glasses, Crazy!)
        if (triggerMode === 'all') {
          if ((isPitchSip && isHandMouth) || face.pitch > 22 / this.sensitivity) {
            triggeredAction = 'drink';
          } else if (isHandEyes) {
            triggeredAction = 'glasses';
          } else if (isLaughing || isSigmaFace || isJawDrop || isEyebrowRaise) {
            triggeredAction = 'expression';
          } else if (isCrazyEvent) {
            triggeredAction = 'crazy';
          }
        }
        // 2. EXPRESSION mode (No glasses or drink required!)
        else if (triggerMode === 'expression') {
          if (isLaughing || isSigmaFace || isJawDrop || isEyebrowRaise) {
            triggeredAction = 'expression';
          }
        }
        // 3. CRAZY mode (Fast head motion, intense shakes, crazy faces)
        else if (triggerMode === 'crazy') {
          if (isCrazyEvent || isJawDrop) {
            triggeredAction = 'crazy';
          }
        }
        // 4. BOTH (Drink or Glasses)
        else if (triggerMode === 'both') {
          if ((isPitchSip && isHandMouth) || face.pitch > 22 / this.sensitivity) {
            triggeredAction = 'drink';
          } else if (isHandEyes) {
            triggeredAction = 'glasses';
          }
        }
        // 5. DRINK ONLY
        else if (triggerMode === 'drink') {
          if ((isPitchSip && isHandMouth) || face.pitch > 22 / this.sensitivity) {
            triggeredAction = 'drink';
          }
        }
        // 6. GLASSES ONLY
        else if (triggerMode === 'glasses') {
          if (isHandEyes) {
            triggeredAction = 'glasses';
          }
        }

        if (triggeredAction) {
          this.lastTriggerTime = now;
        }
      }

      // HUD Status Readout Text
      if (triggeredAction) {
        metrics.statusText = `ACTION DETECTED: ${
          detectedExprLabel ? detectedExprLabel : triggeredAction.toUpperCase()
        }`;
      } else if (detectedExprLabel) {
        metrics.statusText = `EXPRESSION: ${detectedExprLabel}`;
      } else if (isPitchSip || isHandMouth) {
        metrics.statusText = 'TRIGGER: DRINK SIP DETECTING...';
      } else if (isHandEyes) {
        metrics.statusText = 'TRIGGER: GLASSES ADJUST DETECTING...';
      } else {
        metrics.statusText = 'SUBJECT: LOCKED // WAITING...';
      }
    }

    return { face, hands, metrics, faceFeatures, triggeredAction };
  }

  resetCooldown(): void {
    this.lastTriggerTime = performance.now();
  }
}

export const gestureDetector = new GestureDetector();
