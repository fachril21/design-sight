export default function ContrastGame() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Contrast Checker</h1>
        <p className="text-[var(--secondary-foreground)]">Test your eye for WCAG contrast ratios.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-xl min-h-[500px] p-6 shadow-sm">
        <h2 className="text-xl font-medium mb-4">Game Core Being Built</h2>
        <p className="text-sm text-center text-[var(--secondary-foreground)] max-w-sm mb-8">
          The Contrast Checker engine and core loop are actively in development for Epic 5. 
        </p>
        <button className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg px-8 py-3 font-semibold opacity-50 cursor-not-allowed">
          Waiting for Engine...
        </button>
      </div>
    </div>
  );
}
