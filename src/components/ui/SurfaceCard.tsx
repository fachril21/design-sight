import type { HTMLAttributes } from 'react';

/** Raised arcade surface with chunky border + offset shadow. */
export function SurfaceCard({
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'bg-arcade-surface border-3 border-arcade-border rounded-arcade',
        'shadow-chunk p-6',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
