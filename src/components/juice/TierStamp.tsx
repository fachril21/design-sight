import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TIER_COLOR_VAR, type Tier } from '@/lib/scoring';
import { sfx } from '@/audio/sfx';

export interface TierStampProps {
  tier: Tier;
}

/** PERFECT / GREAT / GOOD / ROUGH stamp; slams in with a spring, fades in
 *  under reduced motion. */
export function TierStamp({ tier }: TierStampProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    sfx.play(tier === 'PERFECT' ? 'perfect' : 'stamp');
  }, [tier]);

  return (
    <motion.span
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 2.4, rotate: -14 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -6 }}
      transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 500, damping: 22 }}
      className="inline-block font-display text-3xl px-4 py-1 border-4 rounded-arcade uppercase"
      style={{ color: TIER_COLOR_VAR[tier], borderColor: TIER_COLOR_VAR[tier] }}
    >
      {tier}
    </motion.span>
  );
}
