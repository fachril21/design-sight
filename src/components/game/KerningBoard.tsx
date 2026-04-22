import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KerningWord, ScoreResult } from '../../lib/kerning';

const GAME_FONT = '"Inter", system-ui, sans-serif';

const TIER_COLOURS: Record<string, string> = {
  Perfect: 'text-emerald-400',
  Excellent: 'text-green-400',
  Good: 'text-lime-400',
  Fair: 'text-yellow-400',
  Poor: 'text-orange-400',
  Wrong: 'text-rose-400',
};

const CURSOR_GRAB_BLACK = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJibGFjayIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xOCAxMVY2YTIgMiAwIDAgMC00IDB2NU0xNCAxMFY0YTIgMiAwIDAgMC00IDB2Nk0xMCAxMFY2YTIgMiAwIDAgMC00IDB2NU0xOCA4YTIgMiAwIDAgMSA0IDB2NmE4IDggMCAwIDEtOCA4aC0yYy0yLjggMC00LjUtLjg2LTUuOTktMi4zNGwtMy42LTMuNmEyIDIgMCAwIDEgMi44Mi0yLjgyTDcgMTUiLz48L3N2Zz4=';
const CURSOR_GRABBING_BLACK = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJibGFjayIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAxMXYtNU0xMCAxMXYtNk04IDExVjhNMTQgMTF2LTlhMiAyIDAgMCAwLTQgMHY2TTggMTF2LTRhMiAyIDAgMCAwLTQgMHY1TDE4IDhhMiAyIDAgMCAxIDQgMHY2YTggOCAwIDAgMS04IDhoLTJjLTIuOCAwLTQuNS0uODYtNS45OS0yLjM0bC0zLjYtMy42YTIgMiAwIDAgMSAyLjgyLTIuODJMNyAxNSIvPjwvc3ZnPg==';
const CURSOR_GRAB_WHITE = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xOCAxMVY2YTIgMiAwIDAgMC00IDB2NU0xNCAxMFY0YTIgMiAwIDAgMC00IDB2Nk0xMCAxMFY2YTIgMiAwIDAgMC00IDB2NU0xOCA4YTIgMiAwIDAgMSA0IDB2NmE4IDggMCAwIDEtOCA4aC0yYy0yLjggMC00LjUtLjg2LTUuOTktMi4zNGwtMy42LTMuNmEyIDIgMCAwIDEgMi44Mi0yLjgyTDcgMTUiLz48L3N2Zz4=';
const CURSOR_GRABBING_WHITE = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAxMXYtNU0xMCAxMXYtNk04IDExVjhNMTQgMTF2LTlhMiAyIDAgMCAwLTQgMHY2TTggMTF2LTRhMiAyIDAgMCAwLTQgMHY1TDE4IDhhMiAyIDAgMCAxIDQgMHY2YTggOCAwIDAgMS04IDhoLTJjLTIuOCAwLTQuNS0uODYtNS45OS0yLjM0bC0zLjYtMy42YTIgMiAwIDAgMSAyLjgyLTIuODJMNyAxNSIvPjwvc3ZnPg==';

interface KerningBoardProps {
  word: KerningWord;
  letterPositions: number[];
  targetPositions: number[];
  isComparing: boolean;
  selectedIdx: number | null;
  roundResult: ScoreResult | null;
  onPositionChange: (idx: number, newX: number) => void;
  onSelect: (idx: number) => void;
}

export const KerningBoard = ({
  word,
  letterPositions,
  targetPositions,
  isComparing,
  selectedIdx,
  roundResult,
  onPositionChange,
  onSelect,
}: KerningBoardProps) => {
  const letters = word.word.split('');
  const fontSize = word.fontSize ?? 120;
  const containerHeight = fontSize * 1.4;

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full flex items-center justify-center overflow-visible bg-surface border border-border rounded-2xl"
        style={{ height: containerHeight }}
      >
        {letterPositions.length === letters.length &&
          letters.map((letter, i) => {
            const isLocked = i === 0 || i === letters.length - 1;
            const movableIdx = i - 1;

            return (
              <DraggableLetter
                key={i}
                letter={letter}
                x={letterPositions[i]}
                isLocked={isLocked}
                isSelected={!isLocked && selectedIdx === movableIdx}
                fontSize={fontSize}
                isComparing={isComparing}
                targetX={isComparing ? targetPositions[i] : undefined}
                onDragEnd={newX => onPositionChange(i, newX)}
                onClick={() => {
                  if (!isLocked) onSelect(movableIdx);
                }}
              />
            );
          })}
      </div>

      <div className="flex justify-between w-full mt-2 px-1 text-xs text-text-secondary font-medium">
        <span>🔒 Locked</span>
        {!isComparing && (
          <span className="text-center">
            {selectedIdx !== null
              ? `Letter ${selectedIdx + 2} selected — use ← / →`
              : 'Tab to select a letter or drag'}
          </span>
        )}
        <span>🔒 Locked</span>
      </div>

      <AnimatePresence>
        {isComparing && roundResult && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="w-full mt-4 bg-surface border border-border rounded-2xl px-6 py-4 flex flex-col items-center"
          >
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
                Your score for "{word.word}"
              </span>
              <span className={`text-7xl font-black font-mono ${TIER_COLOURS[roundResult.tier] ?? 'text-text-primary'}`}>
                {roundResult.score}
              </span>
              <span className={`text-xl font-bold ${TIER_COLOURS[roundResult.tier] ?? ''}`}>{roundResult.tier}</span>
              <span className="text-sm text-text-secondary">
                avg. <strong>{roundResult.avgDifference.toFixed(1)}px</strong> off
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DraggableLetterProps {
  letter: string;
  x: number;
  isLocked: boolean;
  isSelected: boolean;
  fontSize: number;
  onDragEnd: (newX: number) => void;
  onClick: () => void;
  targetX?: number;
  isComparing: boolean;
}

function DraggableLetter({
  letter,
  x,
  isLocked,
  isSelected,
  fontSize,
  onDragEnd,
  onClick,
  targetX,
  isComparing,
}: DraggableLetterProps) {
  const localX = useRef(x);

  useEffect(() => {
    localX.current = x;
  }, [x]);

  const diffX = isComparing && targetX !== undefined ? targetX - x : 0;
  const absOff = Math.abs(diffX);
  const offColour =
    absOff <= 2 ? '#34d399' : absOff <= 8 ? '#facc15' : '#f43f5e';

  return (
    <motion.div
      className="absolute top-0 select-none"
      style={{ left: 0, fontSize, fontFamily: GAME_FONT, fontWeight: 600, lineHeight: 1 }}
      initial={{ x }}
      drag={isLocked || isComparing ? false : 'x'}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        if (!isComparing) onDragEnd(x + info.offset.x);
      }}
      onClick={onClick}
      whileDrag={!isComparing ? { scale: 1.05, zIndex: 10 } : undefined}
      animate={{ 
        x, 
        color: isComparing && targetX !== undefined ? offColour : '#e5e7eb' 
      }}
      transition={{ 
        x: { duration: 0 },
        color: { duration: 0.2 }
      }}
    >
      <AnimatePresence>
        {isComparing && targetX !== undefined && !isLocked && (
          <motion.span
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: targetX - x, opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            className="absolute top-0 left-0 text-text-primary pointer-events-none"
          >
            {letter}
          </motion.span>
        )}
      </AnimatePresence>

      <span
        className={[
          'relative',
          isLocked || isComparing 
            ? 'cursor-default opacity-90' 
            : `cursor-[url("data:image/svg+xml;base64,${CURSOR_GRAB_BLACK}"),_grab] active:cursor-[url("data:image/svg+xml;base64,${CURSOR_GRABBING_BLACK}"),_grabbing] dark:cursor-[url("data:image/svg+xml;base64,${CURSOR_GRAB_WHITE}"),_grab] dark:active:cursor-[url("data:image/svg+xml;base64,${CURSOR_GRABBING_WHITE}"),_grabbing]`,
          isSelected && !isLocked && !isComparing
            ? 'after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400 after:rounded-full'
            : '',
        ].join(' ')}
      >
        {letter}
      </span>
    </motion.div>
  );
}
