import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MAX_SCORE, TIER_COLOR_VAR, tierForScore } from '@/lib/scoring';

export interface ElasticScoreBarProps {
  score: number;
}

/** Elastic score bar: springs to the score fraction; plain width set under
 *  reduced motion. Guards divide-by-zero for 0-score rounds (E14). */
export function ElasticScoreBar({ score }: ElasticScoreBarProps) {
  const reduced = useReducedMotion();
  const fraction = MAX_SCORE > 0 ? Math.max(0, Math.min(1, score / MAX_SCORE)) : 0;
  const color = TIER_COLOR_VAR[tierForScore(score)];

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={MAX_SCORE}
      aria-valuenow={score}
      className="w-full h-4 bg-arcade-raised rounded-full border-2 border-arcade-border overflow-hidden"
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${fraction * 100}%` }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 120, damping: 14, mass: 0.9 }
        }
      />
    </div>
  );
}
