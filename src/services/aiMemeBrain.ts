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

  private static sigmaTracksBag = new ShuffleBag<TrackId>(['marlon_mogged', 'cyber_sigma', 'gigachad_anthem']);
  private static laughTracksBag = new ShuffleBag<TrackId>(['montagem_tomada', 'tokyo_drift']);
  private static shockTracksBag = new ShuffleBag<TrackId>(['mogger', 'cyber_sigma']);
  private static toastTracksBag = new ShuffleBag<TrackId>(['montagem_tomada', 'gigachad_anthem']);
  private static allPresetsBag = new ShuffleBag<EditPreset>(['sigma_hard_snaps', 'ghost_trail_impact', 'dark_manga_strobe', 'parallax_dual_speed']);

  static analyze(userFeatures: Record<string, number> | null): AiBrainDecision {
    if (!userFeatures) {
      return this.lastDecision;
    }

    // Pass true to get randomized top match instead of always the same one
    const match = MemeMatcher.findBestMatch(userFeatures, true);
    const smile = userFeatures.smile_score ?? 0;
    const sigma = userFeatures.sigma_score ?? 0;
    const mouthOpen = userFeatures.mouth_openness ?? 0;
    const surprise = userFeatures.surprise_score ?? 0;
    const cheers = userFeatures.cheers_score ?? 0;
    const handRaised = userFeatures.hand_raised ?? 0;

    let funnyFaceType: 'sigma' | 'laugh' | 'shock' | 'glasses' | 'divine' | 'neutral' = 'neutral';
    let aiThought = 'AI SCANNING FACIAL EXPRESSION...';
    let isFunnyFace = false;

    // Determine the expression type
    if (sigma > 0.50 || (match.meme?.id.includes('batman') && match.percentage > 60)) {
      funnyFaceType = 'sigma';
      isFunnyFace = true;
      aiThought = `SIGMA ENERGY DETECTED (${Math.round(sigma * 100)}%) -> SELECTING SIGMA THEME`;
    } else if (smile > 0.55) {
      funnyFaceType = 'laugh';
      isFunnyFace = true;
      aiThought = `HIGH CONFIDENCE LAUGH (${Math.round(smile * 100)}%) -> SELECTING CHAD/HAPPY THEME`;
    } else if (mouthOpen > 0.42 || surprise > 0.55) {
      funnyFaceType = 'shock';
      isFunnyFace = true;
      aiThought = `EXTREME JAW DROP (${Math.round(mouthOpen * 100)}%) -> SELECTING CRAZY/SHOCK THEME`;
    } else if (cheers > 0.50 || (handRaised > 0 && smile > 0.35)) {
      funnyFaceType = 'glasses';
      isFunnyFace = true;
      aiThought = 'DRINK SIP / GATSBY TOAST -> SELECTING TOAST THEME';
    } else if (smile > 0.25 && mouthOpen < 0.15 && sigma < 0.3) {
      funnyFaceType = 'divine';
      isFunnyFace = false;
      aiThought = 'CALM SERENE GAZE -> DIVINE AURA DETECTED';
    } else {
      aiThought = `ANALYZING EXPRESSION: CONFIDENCE ${match.percentage}%`;
    }

    // Only pick new random tracks/presets if the user's expression category changes.
    // This prevents the track/preset from flickering rapidly every frame.
    if (funnyFaceType !== this.lockedFaceType && isFunnyFace) {
      this.lockedFaceType = funnyFaceType;
      
      // Assign randomly from pools without immediate repeats
      if (funnyFaceType === 'sigma') {
        this.lockedTrack = this.sigmaTracksBag.next();
        this.lockedPreset = 'sigma_hard_snaps';
      } else if (funnyFaceType === 'laugh') {
        this.lockedTrack = this.laughTracksBag.next();
        this.lockedPreset = this.allPresetsBag.next();
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
  }
}
