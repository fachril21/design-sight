import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { popIn, popInReduced } from '@/lib/motion';
import { sfx } from '@/audio/sfx';

export function RoundIntro({
  gameName,
  roundNo,
  totalRounds,
  onBegin,
}: {
  gameName: string;
  roundNo: number;
  totalRounds: number;
  onBegin: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? popInReduced : popIn}
      initial="initial"
      animate="enter"
      className="text-center space-y-4"
    >
      <p className="text-arcade-muted uppercase text-sm tracking-widest">
        Round {roundNo} / {totalRounds}
      </p>
      <h2 className="font-display text-4xl">{gameName}</h2>
      <ArcadeButton size="lg" onClick={onBegin} autoFocus>
        Ready
      </ArcadeButton>
    </motion.div>
  );
}

export function Countdown({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(3);

  useEffect(() => {
    sfx.play('tick');
    if (count === 0) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div className="flex items-center justify-center min-h-[200px]" aria-live="assertive">
      <motion.span
        key={count}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 2.2 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 400, damping: 20 }}
        className="font-display text-8xl text-arcade-primary-hot"
      >
        {count === 0 ? 'GO' : count}
      </motion.span>
    </div>
  );
}

export function SuspenseBeat() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-display text-2xl text-arcade-muted animate-pulse" role="status">
        Scoring…
      </p>
    </div>
  );
}

export function ErrorFrame({
  message,
  onRetry,
  onQuit,
}: {
  message: string;
  onRetry: () => void;
  onQuit: () => void;
}) {
  return (
    <SurfaceCard className="text-center space-y-4">
      <h2 className="font-display text-xl text-arcade-accent">Something broke</h2>
      <p className="text-arcade-muted text-sm">{message}</p>
      <div className="flex gap-3 justify-center">
        <ArcadeButton onClick={onRetry}>Try again</ArcadeButton>
        <ArcadeButton variant="ghost" onClick={onQuit}>
          Quit run
        </ArcadeButton>
      </div>
    </SurfaceCard>
  );
}
