// ─── Kerning Word Database ────────────────────────────────────────────────────

export interface KerningWord {
  id: string;
  word: string;
  /** Font size in px used to render this word at full quality */
  fontSize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Each word has been chosen because its letter combinations create classic
 * kerning challenges (diagonal conflicts, round/straight, overhang pairs, etc.)
 */
export const KERNING_WORDS: KerningWord[] = [
  { id: 'wave', word: 'WAVE', fontSize: 120, difficulty: 'easy' },
  { id: 'type', word: 'TYPE', fontSize: 120, difficulty: 'easy' },
  { id: 'await', word: 'AWAIT', fontSize: 100, difficulty: 'easy' },
  { id: 'void', word: 'VOID', fontSize: 120, difficulty: 'easy' },
  { id: 'yacht', word: 'YACHT', fontSize: 100, difficulty: 'medium' },
  { id: 'wavy', word: 'WAVY', fontSize: 120, difficulty: 'medium' },
  { id: 'typo', word: 'TYPO', fontSize: 120, difficulty: 'medium' },
  { id: 'lave', word: 'LAVE', fontSize: 120, difficulty: 'medium' },
  { id: 'woven', word: 'WOVEN', fontSize: 100, difficulty: 'medium' },
  { id: 'tavern', word: 'TAVERN', fontSize: 90, difficulty: 'medium' },
  { id: 'avow', word: 'AVOW', fontSize: 120, difficulty: 'hard' },
  { id: 'vast', word: 'VAST', fontSize: 120, difficulty: 'hard' },
  { id: 'victory', word: 'VICTORY', fontSize: 80, difficulty: 'hard' },
  { id: 'fawning', word: 'FAWNING', fontSize: 80, difficulty: 'hard' },
  { id: 'wayward', word: 'WAYWARD', fontSize: 80, difficulty: 'hard' },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

export type AccuracyTier = 'Perfect' | 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Wrong';

export interface ScoreResult {
  /** 0–100 overall score for this word */
  score: number;
  tier: AccuracyTier;
  /** Average pixel offset across all movable letters */
  avgDifference: number;
  /** Per-letter diffs for visualisation */
  diffs: number[];
}

/**
 * Calculate a 0-100 score by comparing the player's letter positions against
 * the target (correctly kerned) positions for all *movable* letters.
 *
 * @param playerPositions  Array of the player's final X positions (movable letters only).
 * @param targetPositions  Array of the target X positions (same order).
 */
export function calculateWordKerningScore(
  playerPositions: number[],
  targetPositions: number[],
): ScoreResult {
  if (playerPositions.length !== targetPositions.length || playerPositions.length === 0) {
    return { score: 0, tier: 'Wrong', avgDifference: Infinity, diffs: [] };
  }

  const diffs = playerPositions.map((p, i) => Math.abs(p - targetPositions[i]));
  const avgDifference = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  // Map average pixel difference to a 0-100 score.
  // ≤2px → 100,  ≤5px → 90,  ≤10px → 75,  ≤20px → 50,  ≤30px → 25,  >30px → 0
  let score: number;
  let tier: AccuracyTier;

  if (avgDifference <= 2) {
    score = 100;
    tier = 'Perfect';
  } else if (avgDifference <= 5) {
    score = Math.round(90 - ((avgDifference - 2) / 3) * 10);
    tier = 'Excellent';
  } else if (avgDifference <= 10) {
    score = Math.round(75 - ((avgDifference - 5) / 5) * 15);
    tier = 'Good';
  } else if (avgDifference <= 20) {
    score = Math.round(50 - ((avgDifference - 10) / 10) * 25);
    tier = 'Fair';
  } else if (avgDifference <= 35) {
    score = Math.round(25 - ((avgDifference - 20) / 15) * 25);
    tier = 'Poor';
  } else {
    score = 0;
    tier = 'Wrong';
  }

  return { score: Math.max(0, score), tier, avgDifference, diffs };
}

// ─── Word Picker ──────────────────────────────────────────────────────────────

/**
 * Pick the next word to display, avoiding recently used ones.
 * Once the pool is exhausted it resets.
 */
export function getRandomWord(usedIds: string[]): KerningWord {
  let available = KERNING_WORDS.filter(w => !usedIds.includes(w.id));
  if (available.length === 0) available = KERNING_WORDS;
  return available[Math.floor(Math.random() * available.length)];
}

// ─── Offset Scrambler ─────────────────────────────────────────────────────────

/**
 * Given the array of target X positions (from measuring the DOM), produce an
 * array of initial (scrambled) positions that are randomly offset from the
 * target so the player has something to fix.
 *
 * The first and last letters keep their target positions (they are locked).
 */
export function scramblePositions(targetPositions: number[]): number[] {
  return targetPositions.map((x, i) => {
    // Lock first and last
    if (i === 0 || i === targetPositions.length - 1) return x;
    
    const spaceLeft = x - targetPositions[i - 1];
    const spaceRight = targetPositions[i + 1] - x;
    
    // Limit max shift to ~35% of the available space to adjacent letters.
    // This prevents letters from overlapping/intersecting and guarantees
    // they stay in a readable order.
    const maxShiftLeft = spaceLeft * 0.35;
    const maxShiftRight = spaceRight * 0.35;
    
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    let magnitude = 0;
    if (direction === 1) {
      // Random magnitude between 30% and 100% of maxShiftRight
      magnitude = maxShiftRight * (0.3 + Math.random() * 0.7);
    } else {
      // Random magnitude between 30% and 100% of maxShiftLeft
      magnitude = maxShiftLeft * (0.3 + Math.random() * 0.7);
    }
    
    return x + direction * magnitude;
  });
}
