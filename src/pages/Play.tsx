import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getGameModule } from '@/games/registry';
import { createReferee } from '@/lib/referee';
import { useRoundStore } from '@/state/roundStore';
import { RoundFlow } from '@/components/round/RoundFlow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { pageVariants, pageVariantsReduced } from '@/lib/motion';

/**
 * Quick Play host (Epic 02, step 7): /play/:slug looks the module up in
 * the registry, starts (or resumes) a run, and hands off to RoundFlow.
 * Unknown slugs get a friendly unavailable screen (edge case E10).
 */
export function Play() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const module = getGameModule(slug);
  const referee = useMemo(() => createReferee(), []);
  const [startError, setStartError] = useState<string | null>(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!module || bootedRef.current) return;
    bootedRef.current = true;
    const store = useRoundStore.getState();

    // A run for this game is already live in the store (e.g. StrictMode
    // remount or back-navigation): reuse it instead of restarting.
    if (store.state !== 'idle' && store.gameSlug === module.slug) return;

    // Mid-run refresh recovery (edge cases E3/E4).
    const resume = store.tryResume(module.slug);
    if (resume === 'resumed') return;
    if (resume === 'expired') {
      // The in-flight round is dead: the RoundFlow scoring effect will
      // forfeit it (null answer -> server scores 0) once flow re-enters.
      return;
    }

    if (store.state !== 'idle') store.reset();
    void referee
      .startRun(module.slug)
      .then((res) => {
        // Another boot (StrictMode double-mount) may have won the race;
        // only the first resolution may seed the store (illegal-transition
        // guard, plan E16).
        if (useRoundStore.getState().state !== 'idle') return;
        useRoundStore.getState().startRun({
          gameSlug: module.slug,
          runId: res.runId,
          ticket: res.ticket,
          rounds: res.rounds,
        });
      })
      .catch((err: unknown) => {
        setStartError(err instanceof Error ? err.message : 'Could not start the run.');
      });
  }, [module, referee]);

  if (!module) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4">
        <SurfaceCard className="text-center space-y-4 max-w-md">
          <h1 className="font-display text-xl">Game unavailable</h1>
          <p className="text-arcade-muted text-sm">
            No game is registered under “{slug}”. It may not be built yet.
          </p>
          <ArcadeButton onClick={() => navigate('/')}>Back home</ArcadeButton>
        </SurfaceCard>
      </main>
    );
  }

  return (
    <motion.main
      variants={reduced ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="max-w-xl mx-auto px-4 py-10"
    >
      {startError ? (
        <SurfaceCard className="text-center space-y-4">
          <h1 className="font-display text-xl text-arcade-accent">Could not start</h1>
          <p className="text-arcade-muted text-sm">{startError}</p>
          <ArcadeButton
            onClick={() => {
              bootedRef.current = false;
              setStartError(null);
            }}
          >
            Retry
          </ArcadeButton>
        </SurfaceCard>
      ) : (
        <RoundFlow module={module} referee={referee} onExit={() => navigate('/')} />
      )}
    </motion.main>
  );
}
