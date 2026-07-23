import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { sfx } from '@/audio/sfx';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ArcadeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-arcade-primary text-white hover:bg-arcade-primary-hot',
  accent: 'bg-arcade-accent text-white hover:brightness-110',
  ghost: 'bg-arcade-surface text-arcade-text border-arcade-border hover:bg-arcade-raised',
  danger: 'bg-arcade-accent text-white hover:brightness-110',
};

const SIZE_CLASSES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-xl min-h-[56px]',
};

/**
 * Chunky arcade button: hard offset shadow that collapses on press so the
 * button physically depresses (Epic 01, US1.2). The pressed state is a CSS
 * transform (a state change, not decorative animation), so it is fine
 * under reduced motion.
 */
export const ArcadeButton = forwardRef<HTMLButtonElement, ArcadeButtonProps>(
  function ArcadeButton(
    { variant = 'primary', size = 'md', className = '', onClick, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        onClick={(e) => {
          sfx.play('press');
          onClick?.(e);
        }}
        className={[
          'inline-flex items-center justify-center gap-2 select-none',
          'font-display uppercase tracking-wide rounded-arcade border-3 border-arcade-shadow',
          'shadow-chunk transition-[transform,box-shadow,filter] duration-100',
          'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
          'disabled:opacity-40 disabled:pointer-events-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        ].join(' ')}
        {...rest}
      />
    );
  },
);
