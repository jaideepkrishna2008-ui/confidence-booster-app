export type AppState = 'STANDBY' | 'EDITING' | 'PLAYING';

export type EditPreset = 'ghost_trail_impact' | 'dark_manga_strobe' | 'parallax_dual_speed' | 'sigma_hard_snaps';

export type TrackId = 'montagem_tomada' | 'mogger' | 'marlon_mogged';

export type TriggerMode = 'both' | 'drink' | 'glasses';

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
  statusText: string;
}

export interface DetectionResult {
  face: FaceData;
  hands: HandData;
  metrics: DetectionMetrics;
  triggeredAction: 'drink' | 'glasses' | null;
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
