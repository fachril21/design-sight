import { describe, it, expect } from 'vitest';
import {
  calculateWordKerningScore,
  scramblePositions,
  getRandomWord,
  KERNING_WORDS,
} from '../lib/kerning';

describe('Kerning Engine (Epic 1 – revised)', () => {

  // ─── calculateWordKerningScore ───────────────────────────────────────────
  describe('calculateWordKerningScore', () => {
    it('returns 100 / Perfect when all positions are exact', () => {
      const target = [0, 80, 160, 240];
      const result = calculateWordKerningScore(target, target);
      expect(result.score).toBe(100);
      expect(result.tier).toBe('Perfect');
      expect(result.avgDifference).toBe(0);
    });

    it('returns Excellent for avg diff 3-5px', () => {
      const target  = [0, 100, 200];
      const player  = [0, 103, 205]; // diffs: 3, 5 → avg 4
      const result  = calculateWordKerningScore(player, target);
      expect(result.tier).toBe('Excellent');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.score).toBeLessThanOrEqual(90);
    });

    it('returns Good for avg diff 6-10px', () => {
      const target = [0, 100, 200];
      const player = [0, 108, 192]; // diffs: 8, 8 → avg 8
      const result = calculateWordKerningScore(player, target);
      expect(result.tier).toBe('Good');
    });

    it('returns Fair for avg diff 11-20px', () => {
      // avg diff exactly 15px
      const target = [100, 200];
      const player = [115, 215];
      const result = calculateWordKerningScore(player, target);
      expect(result.tier).toBe('Fair');
    });

    it('returns Poor for avg diff 21-35px', () => {
      // avg diff exactly 25px
      const target = [100, 200];
      const player = [125, 225];
      const result = calculateWordKerningScore(player, target);
      expect(result.tier).toBe('Poor');
      expect(result.score).toBeGreaterThan(0);
    });

    it('returns Wrong / 0 for avg diff >35px', () => {
      // avg diff exactly 50px → well above 35px threshold
      const target = [100, 200];
      const player = [150, 250];
      const result = calculateWordKerningScore(player, target);
      expect(result.tier).toBe('Wrong');
      expect(result.score).toBe(0);
    });

    it('returns Wrong for mismatched array lengths', () => {
      const result = calculateWordKerningScore([0, 100], [0, 100, 200]);
      expect(result.tier).toBe('Wrong');
    });

    it('provides per-letter diffs (all letters including index 0)', () => {
      const target = [0, 100, 200];
      const player = [0, 105, 190];
      const result = calculateWordKerningScore(player, target);
      // diffs array covers all passed positions
      expect(result.diffs).toEqual([0, 5, 10]);
    });
  });

  // ─── scramblePositions ───────────────────────────────────────────────────
  describe('scramblePositions', () => {
    it('keeps the first and last positions unchanged', () => {
      const targets = [0, 80, 160, 240, 320];
      const scrambled = scramblePositions(targets);
      expect(scrambled[0]).toBe(targets[0]);
      expect(scrambled[targets.length - 1]).toBe(targets[targets.length - 1]);
    });

    it('shifts middle positions by at least 15px', () => {
      const targets = [0, 80, 160, 240];
      for (let trial = 0; trial < 30; trial++) {
        const scrambled = scramblePositions(targets);
        const mid = targets.slice(1, -1);
        mid.forEach((t, i) => {
          expect(Math.abs(scrambled[i + 1] - t)).toBeGreaterThanOrEqual(5);
        });
      }
    });
  });

  // ─── getRandomWord ───────────────────────────────────────────────────────
  describe('getRandomWord', () => {
    it('returns a word from KERNING_WORDS', () => {
      const word = getRandomWord([]);
      expect(KERNING_WORDS).toContainEqual(word);
    });

    it('avoids recently used words', () => {
      const allButLast = KERNING_WORDS.slice(0, -1).map(w => w.id);
      const word = getRandomWord(allButLast);
      expect(word.id).toBe(KERNING_WORDS[KERNING_WORDS.length - 1].id);
    });

    it('resets pool when all words have been used', () => {
      const allIds = KERNING_WORDS.map(w => w.id);
      const word = getRandomWord(allIds);
      expect(KERNING_WORDS).toContainEqual(word);
    });
  });
});
