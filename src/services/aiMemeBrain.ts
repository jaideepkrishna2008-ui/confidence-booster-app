import { MemeInfo, MemeMatcher } from './memeMatcher';
import { EditPreset, TrackId } from '../types';

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

  static analyze(userFeatures: Record<string, number> | null): AiBrainDecision {
    if (!userFeatures) {
      return this.lastDecision;
    }

    const match = MemeMatcher.findBestMatch(userFeatures);
    const smile = userFeatures.smile_score ?? 0;
    const sigma = userFeatures.sigma_score ?? 0;
    const mouthOpen = userFeatures.mouth_openness ?? 0;
    const surprise = userFeatures.surprise_score ?? 0;
    const cheers = userFeatures.cheers_score ?? 0;
    const handRaised = userFeatures.hand_raised ?? 0;

    let funnyFaceType: 'sigma' | 'laugh' | 'shock' | 'glasses' | 'divine' | 'neutral' = 'neutral';
    let aiThought = 'AI SCANNING FACIAL EXPRESSION...';
    let recommendedPreset: EditPreset = 'ghost_trail_impact';
    let recommendedTrack: TrackId = 'montagem_tomada';
    let isFunnyFace = false;

    // AI Reasoning Logic
    // 1. High Sigma Face (Squint + Smirk / Pout) -> Christian Bale Batman Sigma
    if (sigma > 0.50 || (match.meme?.id.includes('batman') && match.percentage > 60)) {
      funnyFaceType = 'sigma';
      isFunnyFace = true;
      recommendedPreset = 'sigma_hard_snaps';
      recommendedTrack = 'marlon_mogged';
      aiThought = `SIGMA ENERGY DETECTED (${Math.round(sigma * 100)}%) -> PAIRING WITH BATMAN SIGMA`;
    }
    // 2. Laugh / Wide Smile -> Jaideep Chad / Leonardo Cheers
    else if (smile > 0.55) {
      funnyFaceType = 'laugh';
      isFunnyFace = true;
      recommendedPreset = 'ghost_trail_impact';
      recommendedTrack = 'montagem_tomada';
      aiThought = `HIGH CONFIDENCE LAUGH (${Math.round(smile * 100)}%) -> PAIRING WITH JAIDEEP CHAD`;
    }
    // 3. Shock / Screaming / Jaw Drop -> The Undertaker Eyes Roll
    else if (mouthOpen > 0.42 || surprise > 0.55) {
      funnyFaceType = 'shock';
      isFunnyFace = true;
      recommendedPreset = 'dark_manga_strobe';
      recommendedTrack = 'mogger';
      aiThought = `EXTREME JAW DROP (${Math.round(mouthOpen * 100)}%) -> PAIRING WITH UNDERTAKER CRAZY EYES`;
    }
    // 4. Drink / Hand to Mouth Cheers
    else if (cheers > 0.50 || (handRaised > 0 && smile > 0.35)) {
      funnyFaceType = 'glasses';
      isFunnyFace = true;
      recommendedPreset = 'parallax_dual_speed';
      recommendedTrack = 'montagem_tomada';
      aiThought = 'DRINK SIP / GATSBY TOAST -> PAIRING WITH LEONARDO TOAST';
    }
    // 5. Serene / Peaceful calm
    else if (smile > 0.25 && mouthOpen < 0.15 && sigma < 0.3) {
      funnyFaceType = 'divine';
      isFunnyFace = false;
      recommendedPreset = 'ghost_trail_impact';
      recommendedTrack = 'montagem_tomada';
      aiThought = 'CALM SERENE GAZE -> PAIRING WITH LORD KRISHNA DIVINE AURA';
    } else {
      aiThought = `ANALYZING EXPRESSION: CONFIDENCE ${match.percentage}%`;
    }

    const decision: AiBrainDecision = {
      matchedMeme: match.meme,
      confidence: match.percentage,
      aiThought,
      recommendedPreset,
      recommendedTrack,
      funnyFaceType,
      isFunnyFace,
    };

    this.lastDecision = decision;
    return decision;
  }
}
