import { ShuffleBag } from './shuffleBag';

export interface MemeInfo {
  id: string;
  name: string;
  image: string;
  description: string;
  category?: 'sigma' | 'laugh' | 'crazy' | 'smile' | 'classic';
  features: Record<string, number>;
}

export const MEME_PROFILES: MemeInfo[] = [
  // ─── SIGMA / COLD STARE ───────────────────────────────────────────────────
  {
    id: 'batman_sigma_smirk',
    name: 'Patrick Bateman Smirk',
    image: '/memes/batman_sigma_smirk.png',
    description: 'Christian Bale Patrick Bateman sigma smirk & knowing nod',
    category: 'sigma',
    features: {
      surprise_score: 0.05, smile_score: 0.70, concern_score: 0.02,
      cheers_score: 0.2, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.16, eyes_symmetry: 0.08, mouth_openness: 0.12,
      mouth_width_ratio: 0.65, mouth_elevation: 0.15,
      eyebrow_height: 0.08, brow_symmetry: 0.04, sigma_score: 0.88,
    },
  },
  {
    id: 'batman_sigma_pout',
    name: 'Bateman Sigma Pout',
    image: '/memes/batman_sigma_pout.png',
    description: 'Christian Bale Patrick Bateman intense pout and squint',
    category: 'sigma',
    features: {
      surprise_score: 0.08, smile_score: 0.15, concern_score: 0.12,
      cheers_score: 0.1, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.12, eyes_symmetry: 0.03, mouth_openness: 0.16,
      mouth_width_ratio: 0.38, mouth_elevation: 0.04,
      eyebrow_height: 0.14, brow_symmetry: 0.02, sigma_score: 0.95,
    },
  },
  {
    id: 'heisenberg_arab',
    name: 'Heisenberg Keffiyeh',
    image: '/memes/heisenberg_arab.png',
    description: 'Walter White in keffiyeh and dark sunglasses, stern gaze',
    category: 'sigma',
    features: {
      surprise_score: 0.05, smile_score: 0.10, concern_score: 0.15,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.20, eyes_symmetry: 0.02, mouth_openness: 0.08,
      mouth_width_ratio: 0.50, mouth_elevation: 0.02,
      eyebrow_height: 0.06, brow_symmetry: 0.02, sigma_score: 0.75,
    },
  },
  {
    id: 'sigma_stare',
    name: 'Sigma Thousand-Yard Stare',
    image: '/memes/batman_sigma.jpg',
    description: 'Patrick Bateman classic cold thousand-yard stare',
    category: 'sigma',
    features: {
      surprise_score: 0.03, smile_score: 0.08, concern_score: 0.10,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.10, eyes_symmetry: 0.02, mouth_openness: 0.05,
      mouth_width_ratio: 0.42, mouth_elevation: 0.01,
      eyebrow_height: 0.05, brow_symmetry: 0.01, sigma_score: 0.98,
    },
  },
  {
    id: 'disaster_girl',
    name: 'Disaster Girl',
    image: '/memes/disaster_girl.jpg',
    description: 'Smirking girl with burning house behind — chaos energy',
    category: 'sigma',
    features: {
      surprise_score: 0.04, smile_score: 0.68, concern_score: 0.06,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.21, eyes_symmetry: 0.07, mouth_openness: 0.12,
      mouth_width_ratio: 0.62, mouth_elevation: 0.12,
      eyebrow_height: 0.07, brow_symmetry: 0.05, sigma_score: 0.70,
    },
  },

  // ─── SMILE / LAUGH / HAPPY ────────────────────────────────────────────────
  {
    id: 'jaideep_smile',
    name: 'Jaideep Bright Smile',
    image: '/memes/jaideep_smile.png',
    description: 'Warm authentic outdoor smile and confident posture',
    category: 'smile',
    features: {
      surprise_score: 0.06, smile_score: 0.88, concern_score: 0.02,
      cheers_score: 0.3, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.25, eyes_symmetry: 0.02, mouth_openness: 0.38,
      mouth_width_ratio: 0.72, mouth_elevation: 0.14,
      eyebrow_height: 0.10, brow_symmetry: 0.02, sigma_score: 0.3,
    },
  },
  {
    id: 'jaideep_candid',
    name: 'Jaideep Candid Laugh',
    image: '/memes/jaideep_candid.jpg',
    description: 'Candid happy smile and sideways glance',
    category: 'laugh',
    features: {
      surprise_score: 0.08, smile_score: 0.78, concern_score: 0.03,
      cheers_score: 0.2, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.22, eyes_symmetry: 0.05, mouth_openness: 0.25,
      mouth_width_ratio: 0.64, mouth_elevation: 0.11,
      eyebrow_height: 0.09, brow_symmetry: 0.03, sigma_score: 0.4,
    },
  },
  {
    id: 'success_kid',
    name: 'Success Kid',
    image: '/memes/success_kid.jpg',
    description: 'Determined baby fist pump on the beach',
    category: 'classic',
    features: {
      surprise_score: 0.05, smile_score: 0.52, concern_score: 0.08,
      cheers_score: 0.52, hand_raised: 1.0, num_hands: 1,
      eye_openness: 0.20, eyes_symmetry: 0.02, mouth_openness: 0.14,
      mouth_width_ratio: 0.55, mouth_elevation: 0.05,
      eyebrow_height: 0.06, brow_symmetry: 0.02, sigma_score: 0.6,
    },
  },
  {
    id: 'leonardo_dicaprio',
    name: 'Leo DiCaprio Toast',
    image: '/memes/leonardo_dicaprio.jpg',
    description: 'Great Gatsby toast with raised champagne glass',
    category: 'classic',
    features: {
      surprise_score: 0.08, smile_score: 0.72, concern_score: 0.05,
      cheers_score: 0.72, hand_raised: 1.0, num_hands: 1,
      eye_openness: 0.22, eyes_symmetry: 0.02, mouth_openness: 0.20,
      mouth_width_ratio: 0.65, mouth_elevation: 0.08,
      eyebrow_height: 0.08, brow_symmetry: 0.02, sigma_score: 0.6,
    },
  },
  {
    id: 'gene_wilder',
    name: 'Gene Wilder Wonka',
    image: '/memes/gene_wilder.jpg',
    description: 'Willy Wonka sarcastic smirk with hand on chin',
    category: 'classic',
    features: {
      surprise_score: 0.06, smile_score: 0.58, concern_score: 0.09,
      cheers_score: 0.58, hand_raised: 1.0, num_hands: 1,
      eye_openness: 0.28, eyes_symmetry: 0.03, mouth_openness: 0.15,
      mouth_width_ratio: 0.58, mouth_elevation: 0.09,
      eyebrow_height: 0.12, brow_symmetry: 0.04, sigma_score: 0.6,
    },
  },
  {
    id: 'krishna_divine',
    name: 'Divine Lord Krishna Aura',
    image: '/memes/krishna_divine.jpg',
    description: 'Celestial peace, serene graceful divine calm smile',
    category: 'classic',
    features: {
      surprise_score: 0.04, smile_score: 0.58, concern_score: 0.01,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.26, eyes_symmetry: 0.01, mouth_openness: 0.06,
      mouth_width_ratio: 0.54, mouth_elevation: 0.08,
      eyebrow_height: 0.09, brow_symmetry: 0.01, sigma_score: 0.5,
    },
  },

  // ─── CRAZY / SHOCK / WILD ─────────────────────────────────────────────────
  {
    id: 'undertaker_eyes',
    name: 'Undertaker Crazy Eyes',
    image: '/memes/undertaker_eyes.png',
    description: 'The Undertaker rolled-back white eyes & open mouth grimace',
    category: 'crazy',
    features: {
      surprise_score: 0.85, smile_score: 0.15, concern_score: 0.35,
      cheers_score: 0.1, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.38, eyes_symmetry: 0.04, mouth_openness: 0.52,
      mouth_width_ratio: 0.60, mouth_elevation: -0.06,
      eyebrow_height: 0.22, brow_symmetry: 0.03, sigma_score: 0.1,
    },
  },
  {
    id: 'overly_attached_girlfriend',
    name: 'Overly Attached GF',
    image: '/memes/overly_attached_girlfriend.jpg',
    description: 'Intense wide-eyed stare into the camera — never blinking',
    category: 'crazy',
    features: {
      surprise_score: 0.55, smile_score: 0.50, concern_score: 0.12,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.42, eyes_symmetry: 0.02, mouth_openness: 0.18,
      mouth_width_ratio: 0.58, mouth_elevation: 0.06,
      eyebrow_height: 0.14, brow_symmetry: 0.02, sigma_score: 0.2,
    },
  },
  {
    id: 'angry_baby',
    name: 'Angry Baby',
    image: '/memes/angry_baby.jpg',
    description: 'Furious furrowed brow infant — maximum rage energy',
    category: 'classic',
    features: {
      surprise_score: 0.02, smile_score: 0.05, concern_score: 0.55,
      cheers_score: 0.0, hand_raised: 0.0, num_hands: 0,
      eye_openness: 0.18, eyes_symmetry: 0.02, mouth_openness: 0.12,
      mouth_width_ratio: 0.38, mouth_elevation: -0.05,
      eyebrow_height: 0.03, brow_symmetry: 0.01, sigma_score: 0.1,
    },
  },
];

// ─── Scoring Constants ────────────────────────────────────────────────────────
const FEATURE_KEYS = [
  'surprise_score', 'smile_score', 'concern_score', 'cheers_score',
  'hand_raised', 'num_hands', 'eye_openness', 'eyes_symmetry',
  'mouth_openness', 'mouth_width_ratio', 'mouth_elevation',
  'eyebrow_height', 'brow_symmetry', 'sigma_score',
];
const FEATURE_WEIGHTS = [25, 30, 15, 20, 15, 10, 25, 10, 25, 20, 25, 20, 10, 30];
const FEATURE_FACTORS = [4.5, 4.0, 4.0, 4.0, 5.0, 5.0, 4.5, 4.0, 4.0, 4.0, 4.5, 4.0, 4.0, 4.5];

// ─── Per-Category ShuffleBags for guaranteed variety ─────────────────────────
const sigmaMemesBag = new ShuffleBag<string>(
  MEME_PROFILES.filter(m => m.category === 'sigma').map(m => m.id)
);
const laughMemesBag = new ShuffleBag<string>(
  MEME_PROFILES.filter(m => m.category === 'laugh' || m.category === 'smile').map(m => m.id)
);
const crazyMemesBag = new ShuffleBag<string>(
  MEME_PROFILES.filter(m => m.category === 'crazy').map(m => m.id)
);
const allMemesBag = new ShuffleBag<string>(MEME_PROFILES.map(m => m.id));

export class MemeMatcher {
  private static lastSmoothedScore: number = 0;
  private static lastMemeId: string = '';
  private static lastCategoryMemeId: string = '';

  // Time-based forced rotation: even if expression stays the same,
  // rotate to the next-best meme every N seconds
  private static lastRotateTime: number = 0;
  private static ROTATE_INTERVAL_MS: number = 7000; // rotate every 7 seconds

  static getAllMemes(): MemeInfo[] {
    return MEME_PROFILES;
  }

  static computeSimilarity(
    userFeatures: Record<string, number>,
    memeFeatures: Record<string, number>
  ): number {
    let totalScore = 0;
    for (let i = 0; i < FEATURE_KEYS.length; i++) {
      const key = FEATURE_KEYS[i];
      const val1 = userFeatures[key] ?? 0;
      const val2 = memeFeatures[key] ?? 0;
      const diff = Math.abs(val1 - val2);
      const similarity = Math.exp(-diff * FEATURE_FACTORS[i]);
      totalScore += FEATURE_WEIGHTS[i] * similarity;
    }
    return totalScore;
  }

  /**
   * Find the best-matching meme for the given face features.
   *
   * Improvements over v1:
   * 1. Per-category ShuffleBag rotation: cycles through memes of the same
   *    category without immediate repeats, preventing "same Batman every time".
   * 2. Time-gated rotation: every ROTATE_INTERVAL_MS the top candidate is
   *    swapped for the next-best from the same category, guaranteeing variety.
   * 3. Expression-based routing: sigma → sigma bag, laugh/smile → laugh bag,
   *    crazy/shock → crazy bag. Falls back to all-memes bag for neutrals.
   */
  static findBestMatch(
    userFeatures: Record<string, number> | null,
    _randomize: boolean = false // kept for API compat, always uses category bags now
  ): { meme: MemeInfo | null; score: number; percentage: number } {
    if (!userFeatures) return { meme: null, score: 0, percentage: 0 };

    const maxPossible = FEATURE_WEIGHTS.reduce((a, b) => a + b, 0);
    const now = performance.now();

    // Score all memes
    const scoredMemes = MEME_PROFILES.map(meme => ({
      meme,
      score: this.computeSimilarity(userFeatures, meme.features),
    })).sort((a, b) => b.score - a.score);

    if (scoredMemes.length === 0) return { meme: null, score: 0, percentage: 0 };

    const topScore = scoredMemes[0].score;
    const THRESHOLD = 0.78; // top candidates are within 22% of best score
    const topCandidates = scoredMemes.filter(m => m.score >= topScore * THRESHOLD);

    // Determine the dominant expression from features
    const sigma = userFeatures.sigma_score ?? 0;
    const smile = userFeatures.smile_score ?? 0;
    const surprise = userFeatures.surprise_score ?? 0;
    const mouthOpen = userFeatures.mouth_openness ?? 0;

    let categoryBag: ShuffleBag<string>;
    if (sigma > 0.50) {
      categoryBag = sigmaMemesBag;
    } else if (smile > 0.55) {
      categoryBag = laughMemesBag;
    } else if (surprise > 0.50 || mouthOpen > 0.40) {
      categoryBag = crazyMemesBag;
    } else {
      categoryBag = allMemesBag;
    }

    // Time-based forced rotation or first pick
    const shouldRotate =
      !this.lastMemeId || now - this.lastRotateTime >= this.ROTATE_INTERVAL_MS;

    let chosenId: string;
    if (shouldRotate) {
      // Advance the category shuffle bag and avoid repeating the last meme
      let candidateId = categoryBag.next();
      // Safeguard: if the bag only returns the same item, try once more
      if (candidateId === this.lastMemeId && topCandidates.length > 1) {
        candidateId = categoryBag.next();
      }
      chosenId = candidateId;
      this.lastRotateTime = now;
    } else {
      // Keep current meme if it's still in the top candidates
      const stillInTop = topCandidates.find(c => c.meme.id === this.lastMemeId);
      chosenId = stillInTop ? this.lastMemeId : topCandidates[0].meme.id;
    }

    // Resolve to MemeInfo (fall back to overall top if bag ID isn't in top candidates)
    let chosenMeme = MEME_PROFILES.find(m => m.id === chosenId) ?? null;
    // Ensure the chosen meme is at least somewhat plausible
    const chosenInCandidates = topCandidates.find(c => c.meme.id === chosenId);
    if (!chosenInCandidates) {
      // If the bag gave something not near the top, use actual best
      chosenMeme = scoredMemes[0].meme;
      chosenId = chosenMeme.id;
    }

    const chosenScore = scoredMemes.find(m => m.meme.id === chosenId)?.score ?? topScore;

    // Percentage display
    const rawPct = (chosenScore / maxPossible) * 100;
    const normalized = Math.min(99, Math.max(38, Math.round(rawPct * 1.08)));

    if (this.lastMemeId === chosenId) {
      this.lastSmoothedScore = Math.round(this.lastSmoothedScore * 0.7 + normalized * 0.3);
    } else {
      this.lastMemeId = chosenId;
      this.lastSmoothedScore = normalized;
    }

    return {
      meme: chosenMeme,
      score: chosenScore,
      percentage: this.lastSmoothedScore,
    };
  }

  /** Force a new meme pick on the next call (called after an edit plays). */
  static forceReRoll(): void {
    this.lastMemeId = '';
    this.lastRotateTime = 0;
  }
}
