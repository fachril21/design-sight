import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScreenShakeProps {
  /** Increment to trigger a shake (0 = never shaken yet). */
  trigger: number;
  children: ReactNode;
}

/** Screen shake wrapper for perfect rounds; inert under reduced motion. */
export function ScreenShake({ trigger, children }: ScreenShakeProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 0 || reduced || !ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { x: -8 },
      { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.2)' },
    );
    return () => {
      tween.kill();
    };
  }, [trigger, reduced]);

  return <div ref={ref}>{children}</div>;
}
