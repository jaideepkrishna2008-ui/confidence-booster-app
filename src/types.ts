export type AppState = 'STANDBY' | 'EDITING' | 'PLAYING';

export type EditPreset =
  | 'ghost_trail_impact'
  | 'dark_manga_strobe'
  | 'parallax_dual_speed'
  | 'sigma_hard_snaps'
  | 'rotating_sigma_vortex'
  | 'lightning_god_aura';

export type TrackId = 'montagem_tomada' | 'mogger' | 'marlon_mogged' | 'tokyo_drift' | 'cyber_sigma' | 'gigachad_anthem';

export type TriggerMode = 'all' | 'expression' | 'crazy' | 'drink' | 'glasses' | 'both';

export type TakeoverMode = 'fullscreen' | 'pip';

export interface FaceData {
  detected: boolean;
  box: { x: number; y: number; width: number; height: number };
  pitch: number;
  yaw: number;
  roll: number;
  mouthCenter: { x: number; y: number };
  noseBridge: { x: number; y: number };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
}

export interface HandPoint {
  x: number;
  y: number;
  isNearMouth: boolean;
  isNearEyes: boolean;
}

export interface HandData {
  detected: boolean;
  points: HandPoint[];
}

export interface DetectionMetrics {
  drinkScore: number;
  glassesScore: number;
  smileScore: number;
  mouthOpenness: number;
  surpriseScore: number;
  sigmaScore: number;
  crazyScore: number;
  detectedExpression: string | null;
  statusText: string;
}

export interface DetectionResult {
  face: FaceData;
  hands: HandData;
  metrics: DetectionMetrics;
  faceFeatures?: Record<string, number>;
  triggeredAction: 'drink' | 'glasses' | 'expression' | 'crazy' | null;
}

export interface FrameItem {
  bitmap: ImageBitmap;
  timestamp: number;
}

export interface OutputDevice {
  deviceId: string;
  label: string;
  isCableInput: boolean;
  isCable: boolean;
}

export interface PresetConfig {
  name: string;
  track: string;
  trackId: TrackId;
}
