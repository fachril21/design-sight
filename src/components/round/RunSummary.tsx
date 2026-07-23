import { useNavigate } from 'react-router-dom';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Badge } from '@/components/ui/Badge';
import { MAX_SCORE, TIER_COLOR_VAR, tierForScore } from '@/lib/scoring';
import type { RoundResultEntry } from '@/state/roundStore';

export function RunSummary({
  results,
  totalRounds,
  onPlayAgain,
  xpGained,
  leveledUp,
  newLevel,
}: {
  results: RoundResultEntry[];
  totalRounds: number;
  onPlayAgain: () => void;
  xpGained: number | null;
  leveledUp: boolean;
  newLevel: number | null;
}) {
  const navigate = useNavigate();
  const total = results.reduce((sum, r) => sum + r.score, 0);

  return (
    <SurfaceCard className="space-y-6 text-center">
      <h2 className="font-display text-2xl">Run complete</h2>
      <ScoreDisplay score={total} max={totalRounds * MAX_SCORE} size="xl" />

      <ol className="space-y-2 text-left" aria-label="round by round scores">
        {results.map((r) => (
          <li key={r.roundNo} className="flex items-center justify-between gap-4">
            <span className="text-arcade-muted text-sm">Round {r.roundNo}</span>
            <div className="flex-1 h-2 bg-arcade-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.score / MAX_SCORE) * 100}%`,
                  backgroundColor: TIER_COLOR_VAR[tierForScore(r.score)],
                }}
              />
            </div>
            <span className="font-display tabular-nums w-16 text-right">
              {r.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>

      {xpGained !== null && (
        <p className="text-sm text-arcade-lime" role="status">
          +{xpGained} XP
          {leveledUp && newLevel !== null && (
            <Badge tone="amber" className="ml-2">
              Level up! Lv {newLevel}
            </Badge>
          )}
        </p>
      )}

      <div className="flex gap-3 justify-center">
        <ArcadeButton onClick={onPlayAgain}>Play again</ArcadeButton>
        <ArcadeButton variant="ghost" onClick={() => navigate('/')}>
          Home
        </ArcadeButton>
      </div>
    </SurfaceCard>
  );
}
