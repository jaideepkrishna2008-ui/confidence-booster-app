export interface MemeInfo {
  id: string;
  name: string;
  image: string;
  description: string;
  features: Record<string, number>;
}

export const MEME_PROFILES: MemeInfo[] = [
  {
    id: 'leonardo_dicaprio',
    name: 'Leonardo DiCaprio',
    image: '/memes/leonardo_dicaprio.jpg',
    description: 'Great Gatsby toast with raised glass',
    features: {
      surprise_score: 0.08,
      smile_score: 0.72,
      concern_score: 0.05,
      cheers_score: 0.72,
      hand_raised: 1.0,
      num_hands: 1,
      eye_openness: 0.22,
      eyes_symmetry: 0.02,
      mouth_openness: 0.2,
      mouth_width_ratio: 0.65,
      mouth_elevation: 0.08,
      eyebrow_height: 0.08,
      brow_symmetry: 0.02,
    },
  },
  {
    id: 'success_kid',
    name: 'Success Kid',
    image: '/memes/success_kid.jpg',
    description: 'Determined baby fist pump on the beach',
    features: {
      surprise_score: 0.05,
      smile_score: 0.52,
      concern_score: 0.08,
      cheers_score: 0.52,
      hand_raised: 1.0,
      num_hands: 1,
      eye_openness: 0.2,
      eyes_symmetry: 0.02,
      mouth_openness: 0.14,
      mouth_width_ratio: 0.55,
      mouth_elevation: 0.05,
      eyebrow_height: 0.06,
      brow_symmetry: 0.02,
    },
  },
  {
    id: 'disaster_girl',
    name: 'Disaster Girl',
    image: '/memes/disaster_girl.jpg',
    description: 'Smirking girl with burning house behind',
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
    },
  },
  {
    id: 'gene_wilder',
    name: 'Gene Wilder',
    image: '/memes/gene_wilder.jpg',
    description: 'Willy Wonka sarcastic smirk with hand on chin',
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
    },
  },
  {
    id: 'overly_attached_girlfriend',
    name: 'Overly Attached Girlfriend',
    image: '/memes/overly_attached_girlfriend.jpg',
    description: 'Intense wide-eyed stare into the camera',
    features: {
      surprise_score: 0.45,
      smile_score: 0.5,
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
    },
  },
  {
    id: 'angry_baby',
    name: 'Angry Baby',
    image: '/memes/angry_baby.jpg',
    description: 'Furious furrowed brow infant',
    features: {
      surprise_score: 0.02,
      smile_score: 0.05,
      concern_score: 0.42,
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
];

const FEATURE_WEIGHTS = [25, 20, 20, 30, 25, 15, 20, 10, 25, 20, 15, 20, 10];
const FEATURE_FACTORS = [10, 10, 10, 10, 15, 15, 5, 5, 5, 5, 5, 5, 5];

export class MemeMatcher {
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

  static findBestMatch(userFeatures: Record<string, number> | null): {
    meme: MemeInfo | null;
    score: number;
    percentage: number;
  } {
    if (!userFeatures) return { meme: null, score: 0, percentage: 0 };

    let bestMeme: MemeInfo | null = null;
    let maxScore = -1;
    const maxPossible = FEATURE_WEIGHTS.reduce((a, b) => a + b, 0); // ~245

    for (const meme of MEME_PROFILES) {
      const score = this.computeSimilarity(userFeatures, meme.features);
      if (score > maxScore) {
        maxScore = score;
        bestMeme = meme;
      }
    }

    const percentage = Math.min(100, Math.round((maxScore / maxPossible) * 100));
    return { meme: bestMeme, score: maxScore, percentage };
  }
}
