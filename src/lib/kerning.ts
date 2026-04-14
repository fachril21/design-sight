export interface LetterPair {
  id: string;
  letter1: string;
  letter2: string;
  optimalKerning: number; // Offset in pixels for ideal spacing
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type AccuracyTier = 'Perfect' | 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Wrong';

export interface ScoreResult {
  points: number;
  tier: AccuracyTier;
  difference: number;
}

export const KERNING_PAIRS: LetterPair[] = [
  // Diagonal conflicts
  { id: 'pair-av', letter1: 'A', letter2: 'V', optimalKerning: -12, category: 'Diagonal', difficulty: 'easy' },
  { id: 'pair-aw', letter1: 'A', letter2: 'W', optimalKerning: -10, category: 'Diagonal', difficulty: 'medium' },
  { id: 'pair-va', letter1: 'V', letter2: 'A', optimalKerning: -12, category: 'Diagonal', difficulty: 'easy' },
  { id: 'pair-wa', letter1: 'W', letter2: 'A', optimalKerning: -10, category: 'Diagonal', difficulty: 'medium' },
  { id: 'pair-yo', letter1: 'Y', letter2: 'o', optimalKerning: -14, category: 'Diagonal', difficulty: 'medium' },
  { id: 'pair-to', letter1: 'T', letter2: 'o', optimalKerning: -10, category: 'Diagonal', difficulty: 'easy' },
  { id: 'pair-ta', letter1: 'T', letter2: 'a', optimalKerning: -12, category: 'Diagonal', difficulty: 'medium' },
  { id: 'pair-tw', letter1: 'T', letter2: 'w', optimalKerning: -8, category: 'Diagonal', difficulty: 'medium' },

  // Overhang pairs
  { id: 'pair-te-c', letter1: 'T', letter2: 'e', optimalKerning: -10, category: 'Overhang', difficulty: 'easy' },
  { id: 'pair-ty', letter1: 'T', letter2: 'y', optimalKerning: -12, category: 'Overhang', difficulty: 'medium' },
  { id: 'pair-we', letter1: 'W', letter2: 'e', optimalKerning: -8, category: 'Overhang', difficulty: 'hard' },
  { id: 'pair-wa-small', letter1: 'w', letter2: 'a', optimalKerning: -4, category: 'Overhang', difficulty: 'medium' },
  { id: 'pair-ve', letter1: 'V', letter2: 'e', optimalKerning: -8, category: 'Overhang', difficulty: 'hard' },
  { id: 'pair-fa', letter1: 'f', letter2: 'a', optimalKerning: -4, category: 'Overhang', difficulty: 'medium' },

  // Round / straight
  { id: 'pair-co', letter1: 'C', letter2: 'o', optimalKerning: -2, category: 'Round/Straight', difficulty: 'hard' },
  { id: 'pair-do', letter1: 'D', letter2: 'o', optimalKerning: -4, category: 'Round/Straight', difficulty: 'hard' },
  { id: 'pair-oc', letter1: 'O', letter2: 'c', optimalKerning: -2, category: 'Round/Straight', difficulty: 'hard' },
  { id: 'pair-op', letter1: 'O', letter2: 'p', optimalKerning: -3, category: 'Round/Straight', difficulty: 'hard' },
  { id: 'pair-od', letter1: 'O', letter2: 'd', optimalKerning: -3, category: 'Round/Straight', difficulty: 'hard' },
  { id: 'pair-ba', letter1: 'b', letter2: 'a', optimalKerning: -2, category: 'Round/Straight', difficulty: 'hard' },

  // Capital combos
  { id: 'pair-la', letter1: 'L', letter2: 'A', optimalKerning: -14, category: 'Capital Combos', difficulty: 'easy' },
  { id: 'pair-pa', letter1: 'P', letter2: 'A', optimalKerning: -10, category: 'Capital Combos', difficulty: 'medium' },
  { id: 'pair-va-cap', letter1: 'V', letter2: 'A', optimalKerning: -12, category: 'Capital Combos', difficulty: 'easy' },
  { id: 'pair-ta-cap', letter1: 'T', letter2: 'A', optimalKerning: -10, category: 'Capital Combos', difficulty: 'medium' },
  { id: 'pair-lt', letter1: 'L', letter2: 'T', optimalKerning: -12, category: 'Capital Combos', difficulty: 'medium' },

  // Punctuation
  { id: 'pair-t-comma', letter1: 'T', letter2: ',', optimalKerning: -12, category: 'Punctuation', difficulty: 'medium' },
  { id: 'pair-p-period', letter1: 'P', letter2: '.', optimalKerning: -14, category: 'Punctuation', difficulty: 'hard' },
  { id: 'pair-v-comma', letter1: 'V', letter2: ',', optimalKerning: -12, category: 'Punctuation', difficulty: 'medium' },
];

/**
 * Calculate the score and accuracy tier based on the pixel difference from optimal.
 * @param playerOffset The kerning offset set by the player.
 * @param optimalKerning The target optimal kerning offset.
 * @returns ScoreResult with points, tier, and difference.
 */
export function calculateKerningScore(playerOffset: number, optimalKerning: number): ScoreResult {
  const difference = Math.abs(playerOffset - optimalKerning);

  if (difference <= 2) {
    return { points: 100, tier: 'Perfect', difference };
  } else if (difference <= 5) {
    return { points: 90, tier: 'Excellent', difference };
  } else if (difference <= 10) {
    return { points: 75, tier: 'Good', difference };
  } else if (difference <= 20) {
    return { points: 50, tier: 'Fair', difference };
  } else if (difference <= 30) {
    return { points: 25, tier: 'Poor', difference };
  } else {
    return { points: 10, tier: 'Wrong', difference };
  }
}

/**
 * Generate a random initial kerning offset ensuring it is noticeably off from the optimal.
 * Shifts by ±30-80px.
 * @param optimalKerning The ideal offset.
 * @returns Initial offset for the question.
 */
export function generateInitialOffset(optimalKerning: number): number {
  const shiftAmount = Math.floor(Math.random() * (80 - 30 + 1)) + 30;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return optimalKerning + shiftAmount * direction;
}

/**
 * Picks a random letter pair, avoiding the recently used ones if possible.
 * @param usedIds Array of previously used pair IDs to avoid.
 * @returns A randomly selected LetterPair.
 */
export function getRandomPair(usedIds: string[]): LetterPair {
  let availablePairs = KERNING_PAIRS.filter(p => !usedIds.includes(p.id));

  // Reset used pool if we've exhausted all pairs
  if (availablePairs.length === 0) {
    availablePairs = KERNING_PAIRS;
  }

  const randomIndex = Math.floor(Math.random() * availablePairs.length);
  return availablePairs[randomIndex];
}
