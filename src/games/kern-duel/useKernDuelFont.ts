import { useEffect, useState } from 'react';
import { KERN_DUEL_FALLBACK_FAMILY, loadKernDuelFont } from '@/games/kern-duel/fonts';

/**
 * Lazy-loads a round's webfont, resolving to the fallback family if it
 * fails or times out (plan K1 — a round must never render blank).
 */
export function useKernDuelFont(fontKey: string): string {
  const [family, setFamily] = useState(KERN_DUEL_FALLBACK_FAMILY);

  useEffect(() => {
    let cancelled = false;
    void loadKernDuelFont(fontKey).then((resolved) => {
      if (!cancelled) setFamily(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [fontKey]);

  return family;
}
