import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, ChevronLeft, ChevronRight, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fetchLeaderboard, supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';

type TimeFilter = 'today' | 'week' | 'all';
type GameId = 'contrast-checker' | 'kerning-challenge';

const ITEMS_PER_PAGE = 20;

function getFilterDate(filter: TimeFilter): Date | undefined {
  if (filter === 'all') return undefined;
  const now = new Date();
  if (filter === 'today') {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  // 'week'
  now.setDate(now.getDate() - 7);
  return now;
}

// ── Skeleton Row ───────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border animate-pulse">
      <div className="w-8 h-5 bg-border rounded" />
      <div className="flex-1 h-5 bg-border rounded max-w-[160px]" />
      <div className="w-16 h-5 bg-border rounded" />
      <div className="w-12 h-5 bg-border rounded hidden sm:block" />
      <div className="w-14 h-5 bg-border rounded hidden md:block" />
    </div>
  );
}

// ── Medal Rank Badge ───────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-mono text-text-secondary font-medium">{rank}</span>;
}

// ── Main Component ─────────────────────────────────────
export default function Leaderboard() {
  const { username, tag } = useUserStore();
  const fullUsername = username && tag ? `${username}#${tag}` : null;

  const [filter, setFilter] = useState<TimeFilter>('all');
  const [gameId, setGameId] = useState<GameId>('contrast-checker');
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple cache: keyed by filter+page → { data, timestamp }
  const cache = useRef<Record<string, { data: LeaderboardEntry[]; count: number; ts: number }>>({});
  const CACHE_TTL = 30_000; // 30 seconds

  const load = useCallback(async () => {
    const cacheKey = `${gameId}_${filter}_${page}`;
    const cached = cache.current[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setEntries(cached.data);
      setTotalCount(cached.count);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, count } = await fetchLeaderboard({
        gameId,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
        since: getFilterDate(filter),
      });
      setEntries(data);
      setTotalCount(count ?? 0);
      cache.current[cacheKey] = { data, count: count ?? 0, ts: Date.now() };
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, gameId]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filter or game changes
  useEffect(() => {
    setPage(0);
  }, [filter, gameId]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  // ── No Supabase configured ────────────────────────────
  if (!supabase) {
    return (
      <PageTransition className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy size={28} className="text-accent" /> Global Leaderboard
          </h1>
          <p className="text-text-secondary">See how you stack up against other designers globally.</p>
        </div>
        <div className="p-12 mt-4 rounded-xl border border-border bg-surface flex flex-col items-center justify-center min-h-[400px] gap-3">
          <WifiOff size={40} className="text-text-secondary/50" />
          <h2 className="text-lg font-semibold text-text-secondary">Leaderboard Offline</h2>
          <p className="text-sm text-text-secondary/70 text-center max-w-sm">
            Supabase is not configured. Copy <code className="bg-background px-1.5 py-0.5 rounded text-xs">.env.example</code> to <code className="bg-background px-1.5 py-0.5 rounded text-xs">.env</code> and add your project keys.
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy size={28} className="text-accent" /> Global Leaderboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setGameId('contrast-checker')}
              className={`text-sm font-semibold transition-colors ${gameId === 'contrast-checker' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Contrast Checker
            </button>
            <span className="text-border px-1">•</span>
            <button
              onClick={() => setGameId('kerning-challenge')}
              className={`text-sm font-semibold transition-colors ${gameId === 'kerning-challenge' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Kerning Challenge
            </button>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['today', 'week', 'all'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background'
              }`}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-background border-b border-border text-xs font-bold uppercase tracking-widest text-text-secondary">
          <div className="w-10 text-center">Rank</div>
          <div className="flex-1">Player</div>
          <div className="w-20 text-right">Score</div>
          {gameId === 'contrast-checker' && <div className="w-16 text-right hidden sm:block">Streak</div>}
          <div className="w-24 text-right hidden md:block">{gameId === 'kerning-challenge' ? '100% Rounds' : 'Accuracy'}</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-rose-500 font-medium">{error}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              <RefreshCw size={14} className="mr-2" /> Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Trophy size={36} className="text-text-secondary/30" />
            <p className="text-sm font-medium text-text-secondary">No scores yet</p>
            <p className="text-xs text-text-secondary/70">Be the first to claim the top spot!</p>
          </div>
        )}

        {/* Data Rows */}
        {!loading && !error && entries.length > 0 && (
          <div>
            {entries.map((entry, i) => {
              const rank = page * ITEMS_PER_PAGE + i + 1;
              const isCurrentUser = entry.full_username === fullUsername;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                    isCurrentUser
                      ? 'bg-accent/5 border-l-2 border-l-accent'
                      : rank <= 3
                        ? 'bg-surface'
                        : 'hover:bg-background/50'
                  }`}
                >
                  <div className="w-10 flex items-center justify-center">
                    <RankBadge rank={rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold truncate block ${
                      isCurrentUser ? 'text-accent' : 'text-text-primary'
                    }`}>
                      {entry.full_username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-accent/70">You</span>
                    )}
                  </div>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-mono font-bold ${
                      rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-600' : 'text-text-primary'
                    }`}>
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                  {gameId === 'contrast-checker' && (
                    <div className="w-16 text-right hidden sm:block">
                      <span className="text-sm font-mono text-text-secondary">🔥 {entry.streak_best}</span>
                    </div>
                  )}
                  <div className="w-24 text-right hidden md:block">
                    <span className="text-sm font-mono text-text-secondary">{entry.accuracy}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={16} className="mr-1" /> Previous
          </Button>

          <span className="text-xs font-medium text-text-secondary">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
