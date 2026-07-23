import { useState } from 'react';
import type { GameModule, PlayProps, RevealProps } from '@/lib/gameModule';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { sfx } from '@/audio/sfx';

/**
 * Dummy game "Pixel Guess" (Epic 02, decision 7): eyeball a bar and guess
 * its width in px. Exists purely to prove the GameModule framework —
 * payload/truth split, timer, validation, reveal, juice — with zero
 * changes to round-flow code.
 */
export interface DummyPayload {
  barWidth: number;
}

export interface DummyAnswer {
  width: number;
}

function DummyPlay({ payload, onAnswer, locked }: PlayProps<DummyPayload, DummyAnswer>) {
  const [guess, setGuess] = useState(150);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-arcade-muted text-sm mb-3">How wide is this bar, in pixels?</p>
        <div
          className="h-8 rounded bg-arcade-primary border-2 border-arcade-border"
          style={{ width: payload.barWidth }}
          aria-label="mystery bar"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dummy-guess" className="block text-sm text-arcade-muted">
          Your guess: <span className="font-display text-arcade-text">{guess}px</span>
        </label>
        <input
          id="dummy-guess"
          type="range"
          min={20}
          max={340}
          value={guess}
          disabled={locked}
          onChange={(e) => setGuess(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <ArcadeButton
        size="lg"
        className="w-full"
        disabled={locked}
        onClick={() => {
          sfx.play('lock');
          onAnswer({ width: guess });
        }}
      >
        Lock it in
      </ArcadeButton>
    </div>
  );
}

function DummyReveal({ payload, answer, truth }: RevealProps<DummyPayload, DummyAnswer>) {
  const actual =
    typeof (truth as { width?: unknown } | null)?.width === 'number'
      ? (truth as { width: number }).width
      : payload.barWidth;
  const guessed = answer?.width ?? null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs text-arcade-muted uppercase">Actual — {actual}px</p>
        <div className="h-5 rounded bg-arcade-lime" style={{ width: actual }} />
        <p className="text-xs text-arcade-muted uppercase">
          Your guess — {guessed === null ? 'no answer' : `${guessed}px`}
        </p>
        <div
          className="h-5 rounded bg-arcade-accent"
          style={{ width: guessed ?? 0 }}
        />
      </div>
      <p className="text-sm text-arcade-muted">
        {guessed === null
          ? 'The timer beat you to it.'
          : `You were off by ${Math.abs(guessed - actual)}px.`}
      </p>
    </div>
  );
}

export const dummyGame: GameModule<DummyPayload, DummyAnswer> = {
  slug: 'dummy',
  displayName: 'Pixel Guess',
  tagline: 'Eyeball the width. Trust nothing.',
  Play: DummyPlay,
  Reveal: DummyReveal,
  validateAnswer: (a): a is DummyAnswer =>
    typeof a === 'object' &&
    a !== null &&
    typeof (a as DummyAnswer).width === 'number' &&
    Number.isFinite((a as DummyAnswer).width),
};
