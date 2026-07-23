export interface ScoreDisplayProps {
  score: number;
  max?: number;
  size?: 'md' | 'xl';
}

/** Static score readout (Epic 02 adds the animated count-up on top). */
export function ScoreDisplay({ score, max = 5000, size = 'md' }: ScoreDisplayProps) {
  return (
    <div className="inline-flex items-baseline gap-1" aria-label={'score ' + score + ' of ' + max}>
      <span
        className={[
          'font-display tabular-nums text-arcade-text',
          size === 'xl' ? 'text-6xl' : 'text-3xl',
        ].join(' ')}
      >
        {score.toLocaleString()}
      </span>
      <span className="text-arcade-muted text-sm">/ {max.toLocaleString()}</span>
    </div>
  );
}
