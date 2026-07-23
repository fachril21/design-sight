import type { HTMLAttributes } from 'react';

type Tone = 'primary' | 'lime' | 'amber' | 'accent' | 'muted';

const TONES: Record<Tone, string> = {
  primary: 'bg-arcade-primary text-white',
  lime: 'bg-arcade-lime text-arcade-bg',
  amber: 'bg-arcade-amber text-arcade-bg',
  accent: 'bg-arcade-accent text-white',
  muted: 'bg-arcade-raised text-arcade-muted',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'primary', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-xs font-bold uppercase tracking-wider',
        TONES[tone],
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
