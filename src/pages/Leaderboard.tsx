export default function Leaderboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-text-secondary">See how you stack up against other designers globally.</p>
      </div>

      <div className="p-12 mt-4 rounded-xl border border-border bg-surface flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-medium mb-2 text-text-secondary">Leaderboard System Coming Soon</h2>
        <p className="text-sm text-center text-text-secondary/80 max-w-sm">
          A global ranking system is being built for Epic 10. Check back later to see the top scores.
        </p>
      </div>
    </div>
  );
}
