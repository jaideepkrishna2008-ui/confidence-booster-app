export interface MemeInfo {
  id: string;
  name: string;
  image: string;
  description: string;
  category?: 'sigma' | 'laugh' | 'crazy' | 'smile' | 'classic';
  features: Record<string, number>;
}

export const MEME_PROFILES: MemeInfo[] = [
  {
    id: 'batman_sigma_smirk',
    name: 'Batman Sigma Smirk',
    image: '/memes/batman_sigma_smirk.png',
    description: 'Christian Bale Patrick Bateman sigma smirk & knowing nod',
    category: 'sigma',
    features: {
      surprise_score: 0.05,
      smile_score: 0.70,
      concern_score: 0.02,
      cheers_score: 0.2,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.16,
      eyes_symmetry: 0.08,
      mouth_openness: 0.12,
      mouth_width_ratio: 0.65,
      mouth_elevation: 0.15,
      eyebrow_height: 0.08,
      brow_symmetry: 0.04,
      sigma_score: 0.88,
    },
  },
  {
    id: 'batman_sigma_pout',
    name: 'Batman Sigma Pout',
    image: '/memes/batman_sigma_pout.png',
    description: 'Christian Bale Patrick Bateman intense pout and squint',
    category: 'sigma',
    features: {
      surprise_score: 0.08,
      smile_score: 0.15,
      concern_score: 0.12,
      cheers_score: 0.1,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.12,
      eyes_symmetry: 0.03,
      mouth_openness: 0.16,
      mouth_width_ratio: 0.38,
      mouth_elevation: 0.04,
      eyebrow_height: 0.14,
      brow_symmetry: 0.02,
      sigma_score: 0.95,
    },
  },
  {
    id: 'undertaker_eyes',
    name: 'The Undertaker Crazy Eyes',
    image: '/memes/undertaker_eyes.png',
    description: 'The Undertaker rolled back white eyes & open mouth grimace',
    category: 'crazy',
    features: {
      surprise_score: 0.85,
      smile_score: 0.15,
      concern_score: 0.35,
      cheers_score: 0.1,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.38,
      eyes_symmetry: 0.04,
      mouth_openness: 0.52,
      mouth_width_ratio: 0.60,
      mouth_elevation: -0.06,
      eyebrow_height: 0.22,
      brow_symmetry: 0.03,
      sigma_score: 0.1,
    },
  },
  {
    id: 'heisenberg_arab',
    name: 'Heisenberg Keffiyeh',
    image: '/memes/heisenberg_arab.png',
    description: 'Walter White in keffiyeh and dark sunglasses, stern gaze',
    category: 'sigma',
    features: {
      surprise_score: 0.05,
      smile_score: 0.10,
      concern_score: 0.15,
      cheers_score: 0.0,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.20,
      eyes_symmetry: 0.02,
      mouth_openness: 0.08,
      mouth_width_ratio: 0.50,
      mouth_elevation: 0.02,
      eyebrow_height: 0.06,
      brow_symmetry: 0.02,
      sigma_score: 0.75,
    },
  },
  {
    id: 'jaideep_smile',
    name: 'Jaideep Bright Smile',
    image: '/memes/jaideep_smile.png',
    description: 'Warm authentic outdoor smile and confident posture',
    category: 'smile',
    features: {
      surprise_score: 0.06,
      smile_score: 0.88,
      concern_score: 0.02,
      cheers_score: 0.3,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.25,
      eyes_symmetry: 0.02,
      mouth_openness: 0.38,
      mouth_width_ratio: 0.72,
      mouth_elevation: 0.14,
      eyebrow_height: 0.10,
      brow_symmetry: 0.02,
      sigma_score: 0.3,
    },
  },
  {
    id: 'jaideep_candid',
    name: 'Jaideep Candid Laugh',
    image: '/memes/jaideep_candid.jpg',
    description: 'Candid happy smile and sideways glance',
    category: 'laugh',
    features: {
      surprise_score: 0.08,
      smile_score: 0.78,
      concern_score: 0.03,
      cheers_score: 0.2,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.22,
      eyes_symmetry: 0.05,
      mouth_openness: 0.25,
      mouth_width_ratio: 0.64,
      mouth_elevation: 0.11,
      eyebrow_height: 0.09,
      brow_symmetry: 0.03,
      sigma_score: 0.4,
    },
  },
  {
    id: 'krishna_divine',
    name: 'Divine Lord Krishna Aura',
    image: '/memes/krishna_divine.jpg',
    description: 'Celestial peace, serene graceful divine calm smile',
    category: 'classic',
    features: {
      surprise_score: 0.04,
      smile_score: 0.58,
      concern_score: 0.01,
      cheers_score: 0.0,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.26,
      eyes_symmetry: 0.01,
      mouth_openness: 0.06,
      mouth_width_ratio: 0.54,
      mouth_elevation: 0.08,
      eyebrow_height: 0.09,
      brow_symmetry: 0.01,
      sigma_score: 0.5,
    },
  },
  {
    id: 'leonardo_dicaprio',
    name: 'Leonardo DiCaprio',
    image: '/memes/leonardo_dicaprio.jpg',
    description: 'Great Gatsby toast with raised champagne glass',
    category: 'classic',
    features: {
      surprise_score: 0.08,
      smile_score: 0.72,
      concern_score: 0.05,
      cheers_score: 0.72,
      hand_raised: 1.0,
      num_hands: 1,
      eye_openness: 0.22,
      eyes_symmetry: 0.02,
      mouth_openness: 0.20,
      mouth_width_ratio: 0.65,
      mouth_elevation: 0.08,
      eyebrow_height: 0.08,
      brow_symmetry: 0.02,
      sigma_score: 0.6,
    },
  },
  {
    id: 'success_kid',
    name: 'Success Kid',
    image: '/memes/success_kid.jpg',
    description: 'Determined baby fist pump on the beach',
    category: 'classic',
    features: {
      surprise_score: 0.05,
      smile_score: 0.52,
      concern_score: 0.08,
      cheers_score: 0.52,
      hand_raised: 1.0,
      num_hands: 1,
      eye_openness: 0.20,
      eyes_symmetry: 0.02,
      mouth_openness: 0.14,
      mouth_width_ratio: 0.55,
      mouth_elevation: 0.05,
      eyebrow_height: 0.06,
      brow_symmetry: 0.02,
      sigma_score: 0.6,
    },
  },
  {
    id: 'disaster_girl',
    name: 'Disaster Girl',
    image: '/memes/disaster_girl.jpg',
    description: 'Smirking girl with burning house behind',
    category: 'classic',
    features: {
      surprise_score: 0.04,
      smile_score: 0.68,
      concern_score: 0.06,
      cheers_score: 0.0,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.21,
      eyes_symmetry: 0.07,
      mouth_openness: 0.12,
      mouth_width_ratio: 0.62,
      mouth_elevation: 0.12,
      eyebrow_height: 0.07,
      brow_symmetry: 0.05,
      sigma_score: 0.7,
    },
  },
  {
    id: 'gene_wilder',
    name: 'Gene Wilder',
    image: '/memes/gene_wilder.jpg',
    description: 'Willy Wonka sarcastic smirk with hand on chin',
    category: 'classic',
    features: {
      surprise_score: 0.06,
      smile_score: 0.58,
      concern_score: 0.09,
      cheers_score: 0.58,
      hand_raised: 1.0,
      num_hands: 1,
      eye_openness: 0.28,
      eyes_symmetry: 0.03,
      mouth_openness: 0.15,
      mouth_width_ratio: 0.58,
      mouth_elevation: 0.09,
      eyebrow_height: 0.12,
      brow_symmetry: 0.04,
      sigma_score: 0.6,
    },
  },
  {
    id: 'overly_attached_girlfriend',
    name: 'Overly Attached Girlfriend',
    image: '/memes/overly_attached_girlfriend.jpg',
    description: 'Intense wide-eyed stare into the camera',
    category: 'crazy',
    features: {
      surprise_score: 0.55,
      smile_score: 0.50,
      concern_score: 0.12,
      cheers_score: 0.0,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.42,
      eyes_symmetry: 0.02,
      mouth_openness: 0.18,
      mouth_width_ratio: 0.58,
      mouth_elevation: 0.06,
      eyebrow_height: 0.14,
      brow_symmetry: 0.02,
      sigma_score: 0.2,
    },
  },
  {
    id: 'angry_baby',
    name: 'Angry Baby',
    image: '/memes/angry_baby.jpg',
    description: 'Furious furrowed brow infant',
    category: 'classic',
    features: {
      surprise_score: 0.02,
      smile_score: 0.05,
      concern_score: 0.55,
      cheers_score: 0.0,
      hand_raised: 0.0,
      num_hands: 0,
      eye_openness: 0.18,
      eyes_symmetry: 0.02,
      mouth_openness: 0.12,
      mouth_width_ratio: 0.38,
      mouth_elevation: -0.05,
      eyebrow_height: 0.03,
      brow_symmetry: 0.01,
      sigma_score: 0.1,
    },
  },
];

const FEATURE_KEYS = [
  'surprise_score',
  'smile_score',
  'concern_score',
  'cheers_score',
  'hand_raised',
  'num_hands',
  'eye_openness',
  'eyes_symmetry',
  'mouth_openness',
  'mouth_width_ratio',
  'mouth_elevation',
  'eyebrow_height',
  'brow_symmetry',
  'sigma_score',
];

const FEATURE_WEIGHTS = [25, 30, 15, 20, 15, 10, 25, 10, 25, 20, 25, 20, 10, 30];
const FEATURE_FACTORS = [4.5, 4.0, 4.0, 4.0, 5.0, 5.0, 4.5, 4.0, 4.0, 4.0, 4.5, 4.0, 4.0, 4.5];

export class MemeMatcher {
  private static lastSmoothedScore: number = 0;
  private static lastMemeId: string = '';

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

  static findBestMatch(userFeatures: Record<string, number> | null, randomize: boolean = false): {
    meme: MemeInfo | null;
    score: number;
    percentage: number;
  } {
    if (!userFeatures) return { meme: null, score: 0, percentage: 0 };

    const maxPossible = FEATURE_WEIGHTS.reduce((a, b) => a + b, 0);

    // Score all memes
    const scoredMemes = MEME_PROFILES.map(meme => {
      const score = this.computeSimilarity(userFeatures, meme.features);
      return { meme, score };
    });

    // Sort descending by score
    scoredMemes.sort((a, b) => b.score - a.score);

    let bestMeme = scoredMemes[0].meme;
    let bestScore = scoredMemes[0].score;

    // Introduce randomization among the top candidates if requested
    if (randomize && scoredMemes.length > 1) {
      // Find how many memes are within 15% of the top score
      const threshold = bestScore * 0.85;
      const topCandidates = scoredMemes.filter(m => m.score >= threshold);
      
      if (topCandidates.length > 1) {
        // Only switch the selected meme periodically (e.g., if we aren't holding the same meme recently)
        // Or we just pick a random one from the top candidates. 
        // To prevent rapid flickering every frame, we only pick a new random one if the user just crossed the threshold,
        // but wait, MemeMatcher is called every frame. If we do pure random here, it will flicker wildly.
        // Instead, we can use a slow changing noise based on time, or just keep the logic deterministic but add a small random noise to the features beforehand?
        // Actually, let's keep it simple: if the last meme is in the top candidates, stick with it to prevent flicker. 
        // Otherwise pick randomly.
        const lastMemeInTop = topCandidates.find(c => c.meme.id === this.lastMemeId);
        if (lastMemeInTop) {
          bestMeme = lastMemeInTop.meme;
          bestScore = lastMemeInTop.score;
        } else {
          const randIdx = Math.floor(Math.random() * topCandidates.length);
          bestMeme = topCandidates[randIdx].meme;
          bestScore = topCandidates[randIdx].score;
        }
      }
    }

    if (!bestMeme) return { meme: null, score: 0, percentage: 0 };

    // Calculate normalized percentage (typically 45% - 98%)
    const rawPercentage = (bestScore / maxPossible) * 100;
    // Map raw percentage nicely to user-intuitive range: min baseline ~45%, peak ~98%
    const normalized = Math.min(99, Math.max(35, Math.round(rawPercentage * 1.08)));

    // Apply gentle smoothing so HUD numbers don't flicker jarringly
    if (this.lastMemeId === bestMeme.id) {
      this.lastSmoothedScore = Math.round(this.lastSmoothedScore * 0.7 + normalized * 0.3);
    } else {
      this.lastMemeId = bestMeme.id;
      this.lastSmoothedScore = normalized;
    }

    return {
      meme: bestMeme,
      score: bestScore,
      percentage: this.lastSmoothedScore,
    };
  }
}
