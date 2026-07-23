import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { sfx } from '@/audio/sfx';

export interface ScoreCountUpProps {
  score: number;
  onDone?: () => void;
}

/**
 * GSAP score count-up (Epic 02, US2.3). Reduced motion renders the final
 * number immediately (with the same onDone choreography hook).
 */
export function ScoreCountUp({ score, onDone }: ScoreCountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? score : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      setDisplay(score);
      doneRef.current?.();
      return;
    }
    sfx.play('scoreRise');
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: score,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => setDisplay(Math.round(counter.value)),
      onComplete: () => doneRef.current?.(),
    });
    return () => {
      tween.kill();
    };
  }, [score, reduced]);

  return (
    <span className="font-display text-6xl tabular-nums" aria-live="polite">
      {display.toLocaleString()}
    </span>
  );
}
