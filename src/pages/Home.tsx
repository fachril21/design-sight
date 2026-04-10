export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Game Hub</h1>
        <p className="text-[var(--secondary-foreground)]">Welcome to DesignSight. Select a game to begin training your design eye.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col justify-between h-48">
          <div>
            <h2 className="text-xl font-semibold mb-2">Contrast Checker</h2>
            <p className="text-sm text-[var(--secondary-foreground)]">Test your eye for WCAG contrast compliance in this fast-paced arcade game.</p>
          </div>
          <button className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg px-4 py-2 w-fit font-medium hover:opacity-90 transition-opacity">
            Play Now
          </button>
        </div>
        
        {/* Placeholder Coming Soon Games */}
        {[
          { title: "Kerning Challenge", desc: "Perfect your letter spacing skills." },
          { title: "Shadow Matcher", desc: "Spot the correct elevation patterns." },
          { title: "Golden Ratio", desc: "Train your eye for perfect proportions." }
        ].map(game => (
          <div key={game.title} className="p-6 rounded-xl bg-[var(--card)]/50 border border-[var(--border)] border-dashed flex flex-col justify-between h-48 opacity-70">
            <div>
              <h2 className="text-xl font-semibold mb-2">{game.title}</h2>
              <p className="text-sm text-[var(--secondary-foreground)]">{game.desc}</p>
            </div>
            <div className="bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg px-4 py-2 w-fit text-sm font-medium">
              Coming Soon
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
