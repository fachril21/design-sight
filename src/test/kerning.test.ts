import { describe, it, expect } from 'vitest';
import { calculateKerningScore, generateInitialOffset, getRandomPair, KERNING_PAIRS } from '../lib/kerning';

describe('Kerning Engine Engine (Epic 1)', () => {
  describe('calculateKerningScore', () => {
    it('returns Perfect score for 0-2px difference', () => {
      expect(calculateKerningScore(-12, -12)).toEqual({ points: 100, tier: 'Perfect', difference: 0 });
      expect(calculateKerningScore(-10, -12)).toEqual({ points: 100, tier: 'Perfect', difference: 2 });
    });

    it('returns Excellent score for 3-5px difference', () => {
      expect(calculateKerningScore(-9, -12)).toEqual({ points: 90, tier: 'Excellent', difference: 3 });
      expect(calculateKerningScore(-7, -12)).toEqual({ points: 90, tier: 'Excellent', difference: 5 });
    });

    it('returns Good score for 6-10px difference', () => {
      expect(calculateKerningScore(-6, -12)).toEqual({ points: 75, tier: 'Good', difference: 6 });
      expect(calculateKerningScore(-2, -12)).toEqual({ points: 75, tier: 'Good', difference: 10 });
    });

    it('returns Fair score for 11-20px difference', () => {
      expect(calculateKerningScore(-1, -12)).toEqual({ points: 50, tier: 'Fair', difference: 11 });
      expect(calculateKerningScore(8, -12)).toEqual({ points: 50, tier: 'Fair', difference: 20 });
    });

    it('returns Poor score for 21-30px difference', () => {
      expect(calculateKerningScore(9, -12)).toEqual({ points: 25, tier: 'Poor', difference: 21 });
      expect(calculateKerningScore(18, -12)).toEqual({ points: 25, tier: 'Poor', difference: 30 });
    });

    it('returns Wrong score for >30px difference', () => {
      expect(calculateKerningScore(19, -12)).toEqual({ points: 10, tier: 'Wrong', difference: 31 });
      expect(calculateKerningScore(50, -12)).toEqual({ points: 10, tier: 'Wrong', difference: 62 });
    });
  });

  describe('generateInitialOffset', () => {
    it('generates an offset 30 to 80 pixels away from optimal', () => {
      const optimal = -10;
      for (let i = 0; i < 50; i++) {
        const initial = generateInitialOffset(optimal);
        const difference = Math.abs(initial - optimal);
        expect(difference).toBeGreaterThanOrEqual(30);
        expect(difference).toBeLessThanOrEqual(80);
      }
    });
  });

  describe('getRandomPair', () => {
    it('returns a valid pair from KERNING_PAIRS', () => {
      const pair = getRandomPair([]);
      expect(KERNING_PAIRS).toContain(pair);
    });

    it('avoids used pairs when picking', () => {
      const usedIds = KERNING_PAIRS.slice(0, KERNING_PAIRS.length - 1).map(p => p.id);
      const pair = getRandomPair(usedIds);
      // It should pick the only remaining one
      expect(pair.id).toEqual(KERNING_PAIRS[KERNING_PAIRS.length - 1].id);
    });

    it('resets used pairs if all have been used', () => {
      const allIds = KERNING_PAIRS.map(p => p.id);
      const pair = getRandomPair(allIds);
      // Shouldn't crash, should pick a random one
      expect(KERNING_PAIRS).toContain(pair);
    });
  });
});
