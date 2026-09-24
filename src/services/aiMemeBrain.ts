import { MemeInfo, MemeMatcher } from './memeMatcher';
import { EditPreset, TrackId } from '../types';
import { ShuffleBag } from './shuffleBag';

export interface AiBrainDecision {
  matchedMeme: MemeInfo | null;
  confidence: number;
  aiThought: string;
  recommendedPreset: EditPreset;
  recommendedTrack: TrackId;
  funnyFaceType: 'sigma' | 'laugh' | 'shock' | 'glasses' | 'divine' | 'neutral';
  isFunnyFace: boolean;
}

// ─── Vastly expanded AI thought lines per expression ─────────────────────────
const SIGMA_THOUGHTS = new ShuffleBag<string>([
  'SIGMA NEURAL PATTERN LOCKED — PHONK INBOUND',
  'COLD-BLOODED AURA CONFIRMED AT {s}% — INITIATING MOG SEQUENCE',
  'BATEMAN PROTOCOL ENGAGED — CONFIDENCE MAXED',
  'SIGMA WAVE DETECTED — DEPLOYING CHAD FILTER',
  'ZERO EMOTIONAL OUTPUT — SIGMA MODE: ACTIVE',
  'NEGATIVE RIZZ SUCCESSFULLY WEAPONIZED',
  'TUNNEL VISION CONFIRMED — ENTERING BEAST MODE',
  'FACIAL SIGMA INDEX: {s}% — ABOVE THRESHOLD',
  'COLD STARE ENERGY = 10,000 GIGA-MOGGS',
  'PSYCHOLOGICAL DAMAGE TO BETA MALES: CRITICAL',
  'UNSMILING DOMINANCE DETECTED — PLAYING ANTHEM',
  'CHAD JAWLINE SIGNATURE ACQUIRED — LOCKING THEME',
]);

const LAUGH_THOUGHTS = new ShuffleBag<string>([
  'HAPPINESS SPIKE {sl}% — DEPLOYING TOMADA ENERGY',
  'CONTAGIOUS LAUGH PATTERN DETECTED — TOMADA INBOUND',
  'HIGH JOY COEFFICIENTS CONFIRMED — VIBE UNLOCKED',
  'SMILE AMPLITUDE: {sl}% — MOGGING WITH HAPPINESS',
  'LAUGHTER DETECTED — SIGMA WITH RIZZ: RARE COMBO',
  'AUTHENTIC GLEE SIGNATURE — CHAD HAPPINESS MODE ON',
  'POSITIVE ENERGY FIELD DETECTED — PLAYING BIG TRACK',
  'GIGACHAD SMILE CONFIRMED — CROWD MOGGED',
  'EXPRESSION: RADIANT — TRACK: CERTIFIED BANGER',
  'SMILE WAVEFORM EXCEEDS SIGMA THRESHOLD — UPLOADING',
]);

const SHOCK_THOUGHTS = new ShuffleBag<string>([
  'EXTREME JAW DROP {m}% — SHOCK PROTOCOL ACTIVE',
  'SURPRISE VECTOR {su}% — DEPLOYING CRAZY EDIT',
  'MAXIMUM BEWILDERMENT DETECTED — PHONK DROPPING',
  'CORTISOL SPIKE CONFIRMED — INITIATING CHAOS MODE',
  'MOUTH GAP: {m}% — SHOCK ABSORPTION ENGAGED',
  'BRAIN.EXE STOPPED RESPONDING — REBOOTING WITH MOGGER',
  'HORROR FACE ENERGY — UNDERTAKER MODE: ACTIVE',
  'EXPRESSION: PURE CHAOS — PLAY CRAZY TRACK NOW',
  'OVERLY ATTACHED PATTERN FOUND — STARING INITIATED',
  'WIDE EYE COEFFICIENT CRITICAL — DEPLOYING NOISE',
]);

const TOAST_THOUGHTS = new ShuffleBag<string>([
  'CHEERS GESTURE DETECTED — GATSBY MODE ENGAGED',
  'HAND-TO-MOUTH MOVEMENT CONFIRMED — TOAST INITIATED',
  'DRINK ANIMATION SEQUENCE — {c}% CONFIDENCE',
  'SUCCESS KID ENERGY CONFIRMED — FIST PUMP LOADING',
  'CELEBRATORY SIGNATURE — CHAMPAGNE TRACK INBOUND',
  'SOCIAL INTERACTION SPIKE — CROWD PLEASER MODE ON',
  'GATSBY PROTOCOL ENGAGED — GREAT PARTY ENERGY',
  'TOAST DETECTED — DEPLOYING CELEBRATION THEME',
]);

const DIVINE_THOUGHTS = new ShuffleBag<string>([
  'CALM SERENE GAZE — DIVINE AURA CONFIRMED',
  'KRISHNA ENERGY: ACTIVATED — INNER PEACE MODE',
  'MEDITATION FACE DETECTED — ZEN SIGMA UNLOCKED',
  'TRANQUIL EXPRESSION SIGNATURE — AURA: CELESTIAL',
  'DEEP STILLNESS DETECTED — SPIRITUAL PHONK MOMENT',
]);

const NEUTRAL_THOUGHTS = new ShuffleBag<string>([
  'ANALYZING EXPRESSION — CONFIDENCE: {p}%',
  'MEME MATCH COMPUTING... {p}% MATCH',
  'FACE TOPOLOGY SCAN IN PROGRESS — {p}%',
  'AI CROSS-REFERENCING MEME DATABASE...',
  'EXPRESSION READING: LOADING... {p}%',
  'MEDIAPIPE LANDMARKS ACTIVE — MATCHING NOW',
  'NEURAL MEME NETWORK ONLINE — CALIBRATING',
  'FEATURE EXTRACTION: COMPLETE — MATCHING AT {p}%',
  'SCANNING SIGMA RESONANCE FIELD...',
  'JUMIN & JUMOUT MEME AI — PROCESSING FACE...',
]);

function fillTemplate(template: string, vars: Record<string, number>): string {
  return template
    .replace('{s}', String(Math.round((vars.sigma ?? 0) * 100)))
    .replace('{sl}', String(Math.round((vars.smile ?? 0) * 100)))
    .replace('{m}', String(Math.round((vars.mouth ?? 0) * 100)))
    .replace('{su}', String(Math.round((vars.surprise ?? 0) * 100)))
    .replace('{c}', String(Math.round((vars.cheers ?? 0) * 100)))
    .replace('{p}', String(vars.pct ?? 88));
}

export class AiMemeBrain {
  private static lastDecision: AiBrainDecision = {
    matchedMeme: null,
    confidence: 0,
    aiThought: 'AI SCANNING SUBJECT FACIAL TOPOLOGY...',
    recommendedPreset: 'ghost_trail_impact',
    recommendedTrack: 'montagem_tomada',
    funnyFaceType: 'neutral',
    isFunnyFace: false,
  };

  private static lockedFaceType: string | null = null;
  private static lockedPreset: EditPreset = 'ghost_trail_impact';
  private static lockedTrack: TrackId = 'montagem_tomada';

  // ShuffleBags per expression type — guaranteed no immediate repeats
  private static sigmaTracksBag = new ShuffleBag<TrackId>(['marlon_mogged', 'cyber_sigma', 'gigachad_anthem']);
  private static laughTracksBag = new ShuffleBag<TrackId>(['montagem_tomada', 'tokyo_drift', 'gigachad_anthem']);
  private static shockTracksBag = new ShuffleBag<TrackId>(['mogger', 'cyber_sigma', 'marlon_mogged']);
  private static toastTracksBag = new ShuffleBag<TrackId>(['montagem_tomada', 'gigachad_anthem', 'tokyo_drift']);
  private static allPresetsBag = new ShuffleBag<EditPreset>([
    'sigma_hard_snaps', 'ghost_trail_impact', 'dark_manga_strobe', 'parallax_dual_speed',
  ]);
  private static sigmaPresetsBag = new ShuffleBag<EditPreset>([
    'sigma_hard_snaps', 'dark_manga_strobe',
  ]);
  private static laughPresetsBag = new ShuffleBag<EditPreset>([
    'ghost_trail_impact', 'parallax_dual_speed', 'sigma_hard_snaps',
  ]);

  // AI thought rotation — different line per expression even on the same frame
  private static lastThoughtBag: ShuffleBag<string> | null = null;

  static analyze(userFeatures: Record<string, number> | null): AiBrainDecision {
    if (!userFeatures) return this.lastDecision;

    const match = MemeMatcher.findBestMatch(userFeatures, true);
    const smile    = userFeatures.smile_score ?? 0;
    const sigma    = userFeatures.sigma_score ?? 0;
    const mouthOpen = userFeatures.mouth_openness ?? 0;
    const surprise = userFeatures.surprise_score ?? 0;
    const cheers   = userFeatures.cheers_score ?? 0;
    const handRaised = userFeatures.hand_raised ?? 0;

    let funnyFaceType: 'sigma' | 'laugh' | 'shock' | 'glasses' | 'divine' | 'neutral' = 'neutral';
    let thoughtBag: ShuffleBag<string> = NEUTRAL_THOUGHTS;
    let isFunnyFace = false;

    // Determine expression category (priority order: sigma > laugh > shock > cheers > divine)
    if (sigma > 0.50 || (match.meme?.id.includes('batman') && match.percentage > 60)) {
      funnyFaceType = 'sigma';
      thoughtBag = SIGMA_THOUGHTS;
      isFunnyFace = true;
    } else if (smile > 0.55) {
      funnyFaceType = 'laugh';
      thoughtBag = LAUGH_THOUGHTS;
      isFunnyFace = true;
    } else if (mouthOpen > 0.42 || surprise > 0.55) {
      funnyFaceType = 'shock';
      thoughtBag = SHOCK_THOUGHTS;
      isFunnyFace = true;
    } else if (cheers > 0.50 || (handRaised > 0 && smile > 0.35)) {
      funnyFaceType = 'glasses';
      thoughtBag = TOAST_THOUGHTS;
      isFunnyFace = true;
    } else if (smile > 0.25 && mouthOpen < 0.15 && sigma < 0.3) {
      funnyFaceType = 'divine';
      thoughtBag = DIVINE_THOUGHTS;
      isFunnyFace = false;
    }

    // Rotate AI thought every call to prevent the same text appearing repeatedly
    // Only advance if the bag changed (expression changed) — prevents flickering
    if (thoughtBag !== this.lastThoughtBag) {
      this.lastThoughtBag = thoughtBag;
    }
    const rawThought = thoughtBag.next();
    const aiThought = fillTemplate(rawThought, {
      sigma, smile, mouth: mouthOpen, surprise, cheers,
      pct: match.percentage,
    });

    // Only pick new random tracks/presets when expression category changes.
    if (funnyFaceType !== this.lockedFaceType && isFunnyFace) {
      this.lockedFaceType = funnyFaceType;

      if (funnyFaceType === 'sigma') {
        this.lockedTrack = this.sigmaTracksBag.next();
        this.lockedPreset = this.sigmaPresetsBag.next();
      } else if (funnyFaceType === 'laugh') {
        this.lockedTrack = this.laughTracksBag.next();
        this.lockedPreset = this.laughPresetsBag.next();
      } else if (funnyFaceType === 'shock') {
        this.lockedTrack = this.shockTracksBag.next();
        this.lockedPreset = 'dark_manga_strobe';
      } else if (funnyFaceType === 'glasses') {
        this.lockedTrack = this.toastTracksBag.next();
        this.lockedPreset = 'parallax_dual_speed';
      }
    } else if (!isFunnyFace) {
      this.lockedFaceType = null;
    }

    const decision: AiBrainDecision = {
      matchedMeme: match.meme,
      confidence: match.percentage,
      aiThought,
      recommendedPreset: this.lockedPreset,
      recommendedTrack: this.lockedTrack,
      funnyFaceType,
      isFunnyFace,
    };

    this.lastDecision = decision;
    return decision;
  }

  static forceReRoll(): void {
    this.lockedFaceType = null;
    this.lastThoughtBag = null;
  }
}
