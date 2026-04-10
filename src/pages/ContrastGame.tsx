import { Button } from '../components/ui/Button';

export default function ContrastGame() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Contrast Checker</h1>
        <p className="text-text-secondary">Test your eye for WCAG contrast ratios.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-border rounded-xl min-h-[500px] p-6 shadow-sm">
        <h2 className="text-xl font-medium mb-4">Game Core Being Built</h2>
        <p className="text-sm text-center text-text-secondary max-w-sm mb-8">
          The Contrast Checker engine and core loop are actively in development for Epic 5. 
        </p>
        <Button variant="primary" size="lg" disabled>
          Waiting for Engine...
        </Button>
      </div>
    </div>
  );
}
