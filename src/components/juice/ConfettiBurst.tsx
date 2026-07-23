import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const COLORS = ['#ffd700', '#b8f818', '#38bdf8', '#ff5d73', '#a78bfa'];
const PARTICLES = 90;
const DURATION_MS = 1400;

export interface ConfettiBurstProps {
  /** Increment to fire a burst (0 = never). */
  trigger: number;
}

/**
 * Dependency-free canvas confetti for perfect rounds (Epic 02, US2.3).
 * Skipped entirely under reduced motion.
 */
export function ConfettiBurst({ trigger }: ConfettiBurstProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0 || reduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cx = canvas.width / 2;

    const particles = Array.from({ length: PARTICLES }, () => ({
      x: cx,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 8,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#ffd700',
      spin: Math.random() * Math.PI,
    }));

    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t > DURATION_MS) return;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.spin += 0.15;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - t / DURATION_MS);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [trigger, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}
