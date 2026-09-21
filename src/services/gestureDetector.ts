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

  // Motion tracking for crazy head events
  private lastPitch: number = 0;
  private lastYaw: number = 0;
  private lastRoll: number = 0;
  private lastDetectTimestamp: number = 0;
  private smoothedMotion: number = 0;

  // Anti-jitter & Debounce: Expression must be held for 350ms before triggering
  private expressionHoldMs: number = 0;
  private candidateAction: 'expression' | 'crazy' | 'drink' | 'glasses' | null = null;
  private candidateLabel: string = '';

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

    // Metric variables
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

          // Inter-Ocular Reference Distance (IOD): Stable, scale-invariant reference
          const eyeDist = Math.max(0.035, Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y));

          // Pitch, Yaw, Roll
          const noseRelY = (noseTip.y - noseBridge.y) / eyeDist;
          face.pitch = (0.55 - noseRelY) * 60;

          const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
          face.yaw = ((noseTip.x - eyeCenterX) / eyeDist) * 80;

          const dy = rightEyeOuter.y - leftEyeOuter.y;
          const dx = rightEyeOuter.x - leftEyeOuter.x;
          face.roll = Math.atan2(dy, dx) * (180 / Math.PI);

          // -------------------------------------------------------------
          // Advanced Geometric Feature Extraction (Normalized by eyeDist)
          // -------------------------------------------------------------
          // 1. Mouth Geometry (corners: 61, 291)
          const mouthLeftCorner = lms[61] || leftEyeOuter;
          const mouthRightCorner = lms[291] || rightEyeOuter;
          const mouthW = Math.hypot(mouthRightCorner.x - mouthLeftCorner.x, mouthRightCorner.y - mouthLeftCorner.y);
          const mouthH = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);

          // Ratios normalized by inter-ocular distance:
          // Neutral mouth width / eyeDist is ~0.76 - 0.84. Smiling expands to 1.05 - 1.35!
          const widthRatio = mouthW / eyeDist;
          const openRatio = mouthH / eyeDist;

          mouthWidthRatio = Math.min(1, Math.max(0, (widthRatio - 0.5) / 0.8));
          mouthOpenness = Math.min(1, Math.max(0, (openRatio - 0.05) * 4.0));

          // Corner elevation relative to lip center (positive when corners lift up in smile)
          const cornersAvgY = (mouthLeftCorner.y + mouthRightCorner.y) / 2;
          const centerLipY = (upperLip.y + lowerLip.y) / 2;
          mouthElevation = (centerLipY - cornersAvgY) / eyeDist;

          // Smile Score: Smooth analog response. Resting face = 0-10%, slight grin = 30-50%, full smile = 75-100%
          const smileWidthExpansion = Math.max(0, widthRatio - 0.76);
          const smileCornerLift = Math.max(0, mouthElevation);
          smileScore = Math.min(1, Math.max(0, (smileWidthExpansion * 2.8 + smileCornerLift * 5.0) * this.sensitivity));

          // 2. Eye Aspect Ratio & Eyelid Aperture
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

          // 3. Eyebrow Elevation (70, 300)
          const leftBrow = lms[70] || topForehead;
          const rightBrow = lms[300] || topForehead;
          const leftBrowDist = Math.hypot(leftBrow.x - leftEyeTop.x, leftBrow.y - leftEyeTop.y) / eyeDist;
          const rightBrowDist = Math.hypot(rightBrow.x - rightEyeTop.x, rightBrow.y - rightEyeTop.y) / eyeDist;

          eyebrowHeight = Math.min(1, Math.max(0.02, (leftBrowDist + rightBrowDist) / 2));
          browSymmetry = Math.min(1, Math.abs(leftBrowDist - rightBrowDist));

          // Surprise score (raised eyebrows + open eyes)
          const browLift = Math.max(0, eyebrowHeight - 0.28);
          surpriseScore = Math.min(1, Math.max(0, browLift * 4.0 + (eyeOpenness > 0.28 ? (eyeOpenness - 0.28) * 3.0 : 0)));

          // 4. Christian Bale / Batman Sigma Face calculation:
          // Signature components:
          // a) Squinted eyes (EAR narrows from ~0.24 down to 0.12 - 0.17)
          const squintComponent = Math.min(1, Math.max(0, (0.23 - eyeOpenness) / 0.13));
          // b) Asymmetrical mouth smirk or compressed pout
          const mouthAsymmetry = Math.abs(mouthLeftCorner.y - mouthRightCorner.y) / eyeDist;
          const smirkComponent = Math.min(1, mouthAsymmetry * 6.5);
          const poutComponent = widthRatio < 0.74 && openRatio > 0.07 && openRatio < 0.22 ? 0.35 : 0;
          // c) Head angle confidence tilt
          const tiltComponent = (Math.abs(face.yaw) > 6 || Math.abs(face.roll) > 5) ? 0.18 : 0;

          sigmaScore = Math.min(1, Math.max(0, (squintComponent * 0.45 + smirkComponent * 0.40 + poutComponent + tiltComponent) * this.sensitivity));

          // 5. Smooth Motion Tracking (EMA filtered, immune to single-frame glitch)
          if (this.lastDetectTimestamp > 0) {
            const dt = Math.max(20, Math.min(250, timestamp - this.lastDetectTimestamp)) / 1000;
            const deltaPitch = Math.abs(face.pitch - this.lastPitch);
            const deltaYaw = Math.abs(face.yaw - this.lastYaw);
            const deltaRoll = Math.abs(face.roll - this.lastRoll);
            const rawVelocity = (deltaPitch + deltaYaw + deltaRoll * 0.8) / dt;

            // Damped velocity (ignoring micro-tremors < 35 deg/s)
            const clampedVel = Math.max(0, rawVelocity - 35);
            const instantMotion = Math.min(1, (clampedVel / 180) * this.sensitivity);
            this.smoothedMotion = this.smoothedMotion * 0.7 + instantMotion * 0.3;
          }
          crazyScore = Math.min(1, this.smoothedMotion);

          this.lastPitch = face.pitch;
          this.lastYaw = face.yaw;
          this.lastRoll = face.roll;
          this.lastDetectTimestamp = timestamp;
        }
      } catch {}
    }

    // Hand tracking for drinks / glasses adjust
    if (this.handLandmarker && face.detected) {
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
                isNearMouth: distToMouth < 0.20,
                isNearEyes: distToEyes < 0.18,
              });
            }
          }
        }
      } catch {}
    }

    // Metric Calculations
    const isHandMouth = hands.points.some((p) => p.isNearMouth);
    const isHandEyes = hands.points.some((p) => p.isNearEyes);

    // Drink Score: Analog rise with head pitch and hand
    let drinkScore = 0;
    if (face.pitch > 3) {
      const pitchNorm = Math.min(1, (face.pitch / 22) * this.sensitivity);
      drinkScore = Math.min(1, pitchNorm * 0.65 + (isHandMouth ? 0.45 : 0));
    } else if (isHandMouth) {
      drinkScore = 0.35 * this.sensitivity;
    }
    metrics.drinkScore = drinkScore;

    // Glasses Score: Smooth analog response
    let glassesScore = 0;
    if (isHandEyes) {
      glassesScore = Math.min(1, 0.90 * this.sensitivity);
    }
    metrics.glassesScore = glassesScore;

    // Store expressions in metrics
    metrics.smileScore = smileScore;
    metrics.mouthOpenness = mouthOpenness;
    metrics.surpriseScore = surpriseScore;
    metrics.sigmaScore = sigmaScore;
    metrics.crazyScore = crazyScore;

    // Feature profile map for MemeMatcher & AI Brain
    faceFeatures = {
      surprise_score: surpriseScore,
      smile_score: smileScore,
      concern_score: Math.min(1, Math.max(0, (0.28 - eyebrowHeight) * 2.5)),
      cheers_score: drinkScore,
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

    // Determine current expression candidate
    let instantCandidate: 'expression' | 'crazy' | 'drink' | 'glasses' | null = null;
    let exprLabel: string | null = null;

    const isLaughing = smileScore > 0.58 && mouthOpenness > 0.22;
    const isSigmaFace = sigmaScore > 0.52;
    const isJawDrop = mouthOpenness > 0.40;
    const isEyebrowRaise = surpriseScore > 0.55 || browSymmetry > 0.08;
    const isCrazyMotion = crazyScore > 0.65;
    const isDrinkSip = (drinkScore > 0.60 && isHandMouth) || face.pitch > 24 / this.sensitivity;
    const isGlassesAdjust = glassesScore > 0.60 && isHandEyes;

    if (isLaughing) {
      instantCandidate = 'expression';
      exprLabel = 'LAUGHING (MOGGED!)';
    } else if (isSigmaFace) {
      instantCandidate = 'expression';
      exprLabel = 'BATMAN SIGMA FACE';
    } else if (isJawDrop) {
      instantCandidate = 'expression';
      exprLabel = 'JAW DROP / SCREAM';
    } else if (isEyebrowRaise) {
      instantCandidate = 'expression';
      exprLabel = 'THE ROCK EYEBROW';
    } else if (isCrazyMotion) {
      instantCandidate = 'crazy';
      exprLabel = 'CRAZY HEAD MOTION';
    } else if (isDrinkSip) {
      instantCandidate = 'drink';
      exprLabel = 'DRINK SIP';
    } else if (isGlassesAdjust) {
      instantCandidate = 'glasses';
      exprLabel = 'GLASSES ADJUST';
    }

    metrics.detectedExpression = exprLabel;

    // -------------------------------------------------------------
    // Anti-Jitter & Debounce Accumulator (350ms sustained hold)
    // -------------------------------------------------------------
    const now = performance.now();
    const dt = this.lastTriggerTime > 0 ? Math.min(100, now - (this.lastDetectTimestamp || now)) : 33;
    const canTrigger = now - this.lastTriggerTime > this.triggerCooldownMs;

    let triggeredAction: 'drink' | 'glasses' | 'expression' | 'crazy' | null = null;

    if (canTrigger && instantCandidate) {
      // Check mode compatibility
      let isModeAllowed = false;
      if (triggerMode === 'all') isModeAllowed = true;
      else if (triggerMode === 'expression' && instantCandidate === 'expression') isModeAllowed = true;
      else if (triggerMode === 'crazy' && (instantCandidate === 'crazy' || instantCandidate === 'expression')) isModeAllowed = true;
      else if (triggerMode === 'both' && (instantCandidate === 'drink' || instantCandidate === 'glasses')) isModeAllowed = true;
      else if (triggerMode === 'drink' && instantCandidate === 'drink') isModeAllowed = true;
      else if (triggerMode === 'glasses' && instantCandidate === 'glasses') isModeAllowed = true;

      if (isModeAllowed) {
        if (this.candidateAction === instantCandidate) {
          this.expressionHoldMs += 40; // Increment hold time
        } else {
          this.candidateAction = instantCandidate;
          this.candidateLabel = exprLabel || '';
          this.expressionHoldMs = 40;
        }

        // Must sustain for at least 320ms to trigger (filters out all webcam jitter!)
        if (this.expressionHoldMs >= 320) {
          triggeredAction = instantCandidate;
          this.lastTriggerTime = now;
          this.expressionHoldMs = 0;
          this.candidateAction = null;
        }
      } else {
        this.expressionHoldMs = 0;
        this.candidateAction = null;
      }
    } else {
      // Decay accumulator smoothly if expression released
      this.expressionHoldMs = Math.max(0, this.expressionHoldMs - 50);
      if (this.expressionHoldMs === 0) {
        this.candidateAction = null;
      }
    }

    // Status Text
    if (triggeredAction) {
      metrics.statusText = `ACTION TRIGGERED: ${exprLabel || triggeredAction.toUpperCase()}!`;
    } else if (this.expressionHoldMs > 60 && this.candidateLabel) {
      const holdPct = Math.min(100, Math.round((this.expressionHoldMs / 320) * 100));
      metrics.statusText = `LOCKING IN: ${this.candidateLabel} (${holdPct}%)`;
    } else if (exprLabel) {
      metrics.statusText = `EXPRESSION: ${exprLabel}`;
    } else if (face.detected) {
      metrics.statusText = 'SUBJECT: LOCKED // WAITING FOR EXPRESSION...';
    } else {
      metrics.statusText = 'SEARCHING FOR SUBJECT...';
    }

    return { face, hands, metrics, faceFeatures, triggeredAction };
  }

  resetCooldown(): void {
    this.lastTriggerTime = performance.now();
    this.expressionHoldMs = 0;
    this.candidateAction = null;
  }
}

export const gestureDetector = new GestureDetector();
