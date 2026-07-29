import { useCallback, useMemo, useRef, useState } from 'react';
import type { PlayProps } from '@/lib/gameModule';
import type { KernDuelAnswerShape, KernDuelPayload } from '@/games/kern-duel/types';
import { LetterRail, type LetterState } from '@/games/kern-duel/LetterRail';
import { useKernDuelFont } from '@/games/kern-duel/useKernDuelFont';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { sfx } from '@/audio/sfx';

const NUDGE_PX = 1;
const NUDGE_SHIFT_PX = 10;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Kern Duel play surface (Epic 03, plan §2.3). Drag via Pointer Events
 * (mouse + touch unified), keyboard via native Tab/Shift-Tab traversal
 * across real buttons + arrow-key nudges. Enter submits regardless of
 * which letter has focus; an explicit button covers touch-only devices
 * with no keyboard (plan K16).
 */
export function KernDuelPlay({
  payload,
  onAnswer,
  locked,
}: PlayProps<KernDuelPayload, KernDuelAnswerShape>) {
  const [offsets, setOffsets] = useState<number[]>(() => payload.letters.map(() => 0));
  const fontFamily = useKernDuelFont(payload.fontKey);
  const dragState = useRef<{ index: number; startX: number; startOffset: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const isLockedIndex = useCallback(
    (i: number) => payload.lockedIndices.includes(i),
    [payload.lockedIndices],
  );

  const submit = useCallback(() => {
    if (submitted || locked) return;
    setSubmitted(true);
    sfx.play('lock');
    onAnswer({ offsets });
  }, [submitted, locked, onAnswer, offsets]);

  const nudge = useCallback(
    (index: number, delta: number) => {
      setOffsets((prev) => {
        const next = [...prev];
        next[index] = clamp((next[index] ?? 0) + delta, payload.minOffsetPx, payload.maxOffsetPx);
        return next;
      });
    },
    [payload.minOffsetPx, payload.maxOffsetPx],
  );

  const handlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (locked || submitted) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { index, startX: e.clientX, startOffset: offsets[index] ?? 0 };
      setDraggingIndex(index);
    },
    [locked, submitted, offsets],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragState.current;
      if (!drag) return;
      const delta = e.clientX - drag.startX;
      setOffsets((prev) => {
        const next = [...prev];
        next[drag.index] = clamp(drag.startOffset + delta, payload.minOffsetPx, payload.maxOffsetPx);
        return next;
      });
    },
    [payload.minOffsetPx, payload.maxOffsetPx],
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setDraggingIndex(null);
  }, []);

  const handleKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (locked || submitted) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const magnitude = e.shiftKey ? NUDGE_SHIFT_PX : NUDGE_PX;
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        nudge(index, magnitude * direction);
      }
    },
    [locked, submitted, submit, nudge],
  );

  const letters: LetterState[] = useMemo(
    () =>
      payload.letters.map((char, i) => ({
        char,
        x: (payload.naturalPositions[i] ?? 0) + (offsets[i] ?? 0),
        locked: isLockedIndex(i),
      })),
    [payload.letters, payload.naturalPositions, offsets, isLockedIndex],
  );

  return (
    <div className="space-y-8">
      <p className="text-arcade-muted text-sm">
        Drag or select the middle letters and nudge them into place. First and last letters are
        locked.
      </p>

      <div className="overflow-x-auto py-4">
        <LetterRail
          letters={letters}
          fontFamily={fontFamily}
          renderMovable={(i, letter) => {
            const isDragging = draggingIndex === i;
            return (
              <button
                type="button"
                disabled={locked || submitted}
                aria-label={`Letter ${letter.char}, position ${Math.round(offsets[i] ?? 0)} pixels`}
                className={[
                  'flex items-center justify-center select-none touch-none',
                  'min-w-[44px] min-h-[44px] bg-transparent border-0 p-0 outline-none appearance-none',
                  'text-arcade-text transition-[transform,color,filter] duration-150 ease-out',
                  'cursor-grab active:cursor-grabbing',
                  'hover:text-arcade-lime hover:[filter:drop-shadow(0_0_10px_rgba(184,248,24,0.45))]',
                  'focus-visible:text-arcade-lime focus-visible:underline focus-visible:decoration-2',
                  'focus-visible:underline-offset-[14px] focus-visible:decoration-arcade-lime',
                  'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:text-arcade-text',
                  'disabled:hover:[filter:none]',
                ].join(' ')}
                style={{
                  fontSize: 64,
                  fontKerning: 'none',
                  fontVariantLigatures: 'none',
                  lineHeight: 1,
                  transform: isDragging ? 'scale(1.12)' : undefined,
                  color: isDragging ? 'var(--ds-lime)' : undefined,
                  filter: isDragging ? 'drop-shadow(0 0 14px rgba(184, 248, 24, 0.65))' : undefined,
                }}
                onPointerDown={handlePointerDown(i)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown(i)}
              >
                {letter.char}
              </button>
            );
          }}
        />
      </div>

      <ArcadeButton size="lg" className="w-full" disabled={locked || submitted} onClick={submit}>
        Lock it in
      </ArcadeButton>
    </div>
  );
}
