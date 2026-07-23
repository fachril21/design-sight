import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TimerRingProps {
  /** 0..1 fraction of time remaining. */
  remaining: number;
  size?: number;
  label?: string;
}

/**
 * SVG countdown ring. Under reduced motion the animated stroke transition
 * is dropped; the ring still updates but without the sweep tween.
 */
export function TimerRing({ remaining, size = 64, label }: TimerRingProps) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, remaining));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const urgent = clamped < 0.25;

  return (
    <div
      role="timer"
      aria-label={label ?? 'time remaining'}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ds-border)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? 'var(--ds-accent)' : 'var(--ds-lime)'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={reduced ? undefined : { transition: 'stroke-dashoffset 150ms linear' }}
        />
      </svg>
      <span className="absolute font-display text-sm tabular-nums">{label}</span>
    </div>
  );
}
