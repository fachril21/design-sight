import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';

const ACTIVE_GAMES = [
  {
    title: 'Contrast Checker',
    desc: 'Test your eye for WCAG contrast compliance in this fast-paced arcade game. How long can you maintain your streak?',
    icon: '⚡️',
    path: '/game/contrast',
    accent: 'from-accent to-purple-500',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    border: 'border-accent/20',
    tag: 'from-accent/10 to-purple-500/10',
  },
  {
    title: 'Kerning Challenge',
    desc: 'Master letter spacing with pixel-perfect precision. Drag the letters until the word feels optically balanced.',
    icon: '🔤',
    path: '/game/kerning-challenge',
    accent: 'from-violet-500 to-fuchsia-500',
    glow: 'shadow-[0_0_40px_rgba(139,92,246,0.15)]',
    border: 'border-violet-500/20',
    tag: 'from-violet-500/10 to-fuchsia-500/10',
  },
];

const COMING_SOON = [
  { title: 'Shadow Matcher', desc: 'Spot the correct elevation patterns.', icon: '📐' },
  { title: 'Golden Ratio', desc: 'Train your eye for perfect proportions.', icon: '✨' },
  { title: 'Font Pairing', desc: 'Match typefaces for optimal hierarchy.', icon: 'Aa' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <PageTransition className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Game Hub</h1>
        <p className="text-text-secondary">
          Welcome to DesignSight. Select a game to begin training your design eye.
        </p>
      </div>

      <div className="flex flex-col gap-10 mt-2">
        {/* Featured Active Games */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ACTIVE_GAMES.map(game => (
            <Card
              key={game.title}
              hoverEffect
              className={`flex flex-col ${game.border} shadow-sm relative overflow-hidden bg-surface/30 cursor-pointer`}
              onClick={() => navigate(game.path)}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${game.accent}`} />

              <div className="flex flex-col p-6 md:p-7 gap-4 h-full">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.tag} border ${game.border} flex items-center justify-center ${game.glow}`}
                >
                  <span className="text-3xl">{game.icon}</span>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2 flex-1">
                  <CardTitle className="text-2xl text-text-primary">{game.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-text-secondary">
                    {game.desc}
                  </CardDescription>
                </div>

                {/* CTA */}
                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="md"
                    className="flex-1 px-6 h-12"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(game.path);
                    }}
                  >
                    Play Solo
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1 px-6 h-12 gap-2 border-primary/20 hover:border-primary/40 text-primary"
                    onClick={e => {
                      e.stopPropagation();
                      const gameId = game.path.split('/').pop();
                      navigate(`/pvp/matchmaking?gameId=${gameId === 'contrast' ? 'contrast-checker' : gameId}`);
                    }}
                  >
                    1v1 PvP
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Coming Soon</h2>
            <div className="h-px bg-border/50 flex-1 mt-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMING_SOON.map(game => (
              <Card
                key={game.title}
                className="flex flex-col opacity-60 border-dashed bg-background/50 transition-colors"
              >
                <CardHeader className="flex flex-row gap-4 items-start pb-2">
                  <div className="text-3xl bg-surface p-3 rounded-xl border border-border/50">
                    {game.icon}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <CardTitle className="text-xl text-text-primary">{game.title}</CardTitle>
                    <CardDescription>{game.desc}</CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="mt-auto pt-6">
                  <div className="bg-surface/80 text-text-secondary rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase border border-border/50">
                    In Development
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
