import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Badge } from '@/components/ui/Badge';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSession } from '@/state/session';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { pageVariants, pageVariantsReduced } from '@/lib/motion';

const GAMES = [
  { slug: 'dummy', name: 'Pixel Guess', tagline: 'Engine test game — eyeball the width', ready: true },
  { slug: 'kern-duel', name: 'Kern Duel', tagline: 'Space the letters like a typographer', ready: false },
  { slug: 'contrast-call', name: 'Contrast Call', tagline: 'Guess the WCAG ratio on sight', ready: false },
  { slug: 'color-match', name: 'Color Match', tagline: 'Rebuild a color from memory', ready: false },
  { slug: 'type-snob', name: 'Type Snob', tagline: 'Name that typeface', ready: false },
];

export function Home() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const { status, profile, signOut } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <motion.main
      variants={reduced ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="max-w-3xl mx-auto px-4 py-10 space-y-8"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-arcade-primary-hot">
            Design Sight
          </h1>
          <p className="text-arcade-muted mt-1">
            Sharpen your design eye. 30-second rounds, 5,000 points of truth.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {status === 'authed' && profile ? (
            <>
              <div className="flex items-center gap-2">
                <Badge tone="lime">Lv {profile.level}</Badge>
                <span className="font-bold">{profile.handle}</span>
              </div>
              <button
                onClick={() => void signOut()}
                className="text-xs text-arcade-muted underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <ArcadeButton size="md" onClick={() => setAuthOpen(true)}>
              Sign in
            </ArcadeButton>
          )}
        </div>
      </header>

      <section aria-labelledby="games-heading" className="space-y-4">
        <h2 id="games-heading" className="font-display text-xl">
          Quick Play
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {GAMES.map((game) => (
            <SurfaceCard key={game.slug} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">{game.name}</h3>
                {!game.ready && <Badge tone="muted">Soon</Badge>}
              </div>
              <p className="text-sm text-arcade-muted flex-1">{game.tagline}</p>
              {game.ready ? (
                <ArcadeButton
                  className="w-full"
                  onClick={() => navigate(`/play/${game.slug}`)}
                >
                  Play 5 rounds
                </ArcadeButton>
              ) : (
                <ArcadeButton className="w-full" disabled>
                  Locked
                </ArcadeButton>
              )}
            </SurfaceCard>
          ))}
        </div>
      </section>

      <footer className="text-xs text-arcade-muted">
        <Link to="/gallery" className="underline">
          Component gallery
        </Link>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </motion.main>
  );
}
