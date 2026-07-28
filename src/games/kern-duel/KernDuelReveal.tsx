import { useEffect, useState } from 'react';
import type { RevealProps } from '@/lib/gameModule';
import type { KernDuelAnswerShape, KernDuelPayload } from '@/games/kern-duel/types';
import { KERN_FALLOFF_PX, KERN_TOLERANCE_PX } from '@/games/kern-duel/scoring';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useKernDuelFont } from '@/games/kern-duel/useKernDuelFont';

interface KernDuelTruthShape {
  offsets: number[];
  lockedIndices: number[];
}

function isKernDuelTruth(t: unknown): t is KernDuelTruthShape {
  return (
    typeof t === 'object' &&
    t !== null &&
    Array.isArray((t as KernDuelTruthShape).offsets) &&
    Array.isArray((t as KernDuelTruthShape).lockedIndices)
  );
}

function tickColor(deviation: number): string {
  if (deviation <= KERN_TOLERANCE_PX) return 'var(--ds-tier-perfect)';
  if (deviation <= KERN_FALLOFF_PX) return 'var(--ds-tier-good)';
  return 'var(--ds-tier-rough)';
}

/**
 * Ghost-overlay reveal (Epic 03, US3.3 / plan §2.3): the reference
 * solution slides onto the player's attempt, with per-letter deviation
 * ticks. Reduced motion drops the slide and shows both rows overlaid
 * directly (no transition), per plan manual test 9.
 */
export function KernDuelReveal({
  payload,
  answer,
  truth,
}: RevealProps<KernDuelPayload, KernDuelAnswerShape>) {
  const reduced = useReducedMotion();
  const fontFamily = useKernDuelFont(payload.fontKey);
  const [ghostSettled, setGhostSettled] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setGhostSettled(true), 50);
    return () => window.clearTimeout(t);
  }, [reduced]);

  if (!isKernDuelTruth(truth)) {
    return <p className="text-arcade-muted text-sm">Reference solution unavailable.</p>;
  }

  const attemptOffsets = answer?.offsets ?? payload.letters.map(() => 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-arcade-muted uppercase">Your attempt vs. the reference kerning</p>
      <div className="relative overflow-x-auto py-6" style={{ fontFamily, fontSize: 64, lineHeight: 1 }}>
        {payload.letters.map((char, i) => {
          const isLocked = payload.lockedIndices.includes(i);
          const natural = payload.naturalPositions[i] ?? 0;
          const attemptX = natural + (attemptOffsets[i] ?? 0);
          const truthX = natural + (truth.offsets[i] ?? 0);
          const deviation = Math.abs((attemptOffsets[i] ?? 0) - (truth.offsets[i] ?? 0));

          return (
            <div key={i} className="absolute top-0" style={{ transform: `translateX(${attemptX}px)` }}>
              <span
                className="absolute select-none"
                style={{ fontKerning: 'none', fontVariantLigatures: 'none', color: 'var(--ds-text)' }}
              >
                {char}
              </span>
              {!isLocked && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute select-none"
                    style={{
                      fontKerning: 'none',
                      fontVariantLigatures: 'none',
                      color: 'var(--ds-lime)',
                      opacity: 0.5,
                      transform: `translateX(${(ghostSettled ? truthX : attemptX) - attemptX}px)`,
                      transition: reduced ? undefined : 'transform 700ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {char}
                  </span>
                  <div
                    className="absolute -bottom-3 h-1.5 w-6 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: tickColor(deviation), left: '50%' }}
                    title={`${Math.round(deviation)}px off`}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-arcade-muted">
        Green tick = within tolerance, gold = close, red = off. The faint lime ghost is the
        reference kerning.
      </p>
    </div>
  );
}
