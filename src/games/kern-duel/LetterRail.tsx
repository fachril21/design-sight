import { KERN_DUEL_FALLBACK_FAMILY } from '@/games/kern-duel/fonts';

export interface LetterState {
  char: string;
  x: number; // natural position + current offset, in px
  locked: boolean;
}

export interface LetterRailProps {
  letters: LetterState[];
  fontFamily: string;
  fontSizePx?: number;
  className?: string;
  /** Rendered per movable letter for interactivity; locked letters always plain. */
  renderMovable?: (index: number, letter: LetterState) => React.ReactNode;
  opacity?: number;
}

/**
 * Shared glyph-row renderer for Play and Reveal (Epic 03, plan §2.3).
 * Pure positioning: every letter is translateX'd from its natural
 * position, so both interactive (Play) and ghost (Reveal) rows share
 * identical layout math and can be visually overlaid.
 *
 * `font-variant-ligatures: none` + `font-kerning: none` are forced here to
 * match the measurement step exactly (plan K9) — if this rendering ever
 * drifted from how content was measured, positions would be subtly wrong.
 */
export function LetterRail({
  letters,
  fontFamily,
  fontSizePx = 64,
  className = '',
  renderMovable,
  opacity = 1,
}: LetterRailProps) {
  return (
    <div
      className={`relative h-24 ${className}`}
      style={{ fontFamily: fontFamily || KERN_DUEL_FALLBACK_FAMILY, opacity }}
    >
      {letters.map((letter, i) =>
        !letter.locked && renderMovable ? (
          <div key={i} className="absolute top-0" style={{ transform: `translateX(${letter.x}px)` }}>
            {renderMovable(i, letter)}
          </div>
        ) : (
          <span
            key={i}
            aria-hidden={false}
            className="absolute top-0 select-none"
            style={{
              transform: `translateX(${letter.x}px)`,
              fontSize: fontSizePx,
              fontKerning: 'none',
              fontVariantLigatures: 'none',
              lineHeight: 1,
              color: letter.locked ? 'var(--ds-muted)' : 'var(--ds-text)',
            }}
          >
            {letter.char}
          </span>
        ),
      )}
    </div>
  );
}
