import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import PageTransition from '../components/layout/PageTransition';
import {
  calculateWordKerningScore,
  scramblePositions,
  type KerningWord,
  type ScoreResult,
} from '../lib/kerning';
import { useKerningStore } from '../store/kerningStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const GAME_FONT = '"Inter", system-ui, sans-serif';
const TIER_COLOURS: Record<string, string> = {
  Perfect: 'text-emerald-400',
  Excellent: 'text-green-400',
  Good: 'text-lime-400',
  Fair: 'text-yellow-400',
  Poor: 'text-orange-400',
  Wrong: 'text-rose-400',
};

// ─── Letter Measurement & Dragging ───────────────────────────────────────────

/**
 * Invisible reference renderer.
 * We render letters in a hidden element with `letter-spacing: normal`
 * and read back each letter's `offsetLeft` to get browser-accurate targets.
 */
function useLetterPositions(word: KerningWord | null) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const [targetPositions, setTargetPositions] = useState<number[]>([]);

  useLayoutEffect(() => {
    if (!word || !ghostRef.current) return;
    const spans = ghostRef.current.querySelectorAll<HTMLSpanElement>('span');
    const positions = Array.from(spans).map(s => s.offsetLeft);
    setTargetPositions(positions);
  }, [word]);

  return { ghostRef, targetPositions };
}

// ─── Draggable Letter ─────────────────────────────────────────────────────────

interface DraggableLetterProps {
  letter: string;
  x: number;
  isLocked: boolean;
  isSelected: boolean;
  fontSize: number;
  onDragEnd: (newX: number) => void;
  onClick: () => void;
  /** In comparing mode, show target flash */
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

  // Sync when the word changes (x resets from parent)
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
      style={{ left: x, fontSize, fontFamily: GAME_FONT, fontWeight: 600, lineHeight: 1 }}
      drag={isLocked ? false : 'x'}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        onDragEnd(x + info.offset.x);
      }}
      onClick={onClick}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
      animate={
        isComparing && targetX !== undefined
          ? { x: targetX - x, color: offColour }
          : { x: 0, color: '#e5e7eb' }
      }
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
    >
      <span
        className={[
          'relative cursor-grab active:cursor-grabbing',
          isLocked ? 'cursor-default opacity-90' : '',
          isSelected && !isLocked
            ? 'after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400 after:rounded-full'
            : '',
        ].join(' ')}
      >
        {letter}
      </span>
    </motion.div>
  );
}

// ─── Round Result Card ────────────────────────────────────────────────────────

function RoundResult({ result, word }: { result: ScoreResult; word: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 py-4"
    >
      <span className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
        Your score for "{word}"
      </span>
      <span className={`text-7xl font-black font-mono ${TIER_COLOURS[result.tier] ?? 'text-text-primary'}`}>
        {result.score}
      </span>
      <span className={`text-xl font-bold ${TIER_COLOURS[result.tier] ?? ''}`}>{result.tier}</span>
      <span className="text-sm text-text-secondary">
        avg. <strong>{result.avgDifference.toFixed(1)}px</strong> off
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KerningGame() {
  const navigate = useNavigate();
  const {
    currentWord,
    currentRound,
    totalRounds,
    roundResults,
    isGameOver,
    isComparing,
    startGame,
    loadNextWord,
    submitRound,
    resetGame,
  } = useKerningStore();

  // Whether the intro modal has been shown/dismissed
  const [hasStarted, setHasStarted] = useState(false);

  // Track player's letter x-positions (only movable letters)
  const [letterPositions, setLetterPositions] = useState<number[]>([]);

  // Keyboard-selected letter index
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Result for the current round (shown during comparing phase)
  const [roundResult, setRoundResult] = useState<ScoreResult | null>(null);

  // Measure positions from the DOM
  const { ghostRef, targetPositions } = useLetterPositions(currentWord);

  // ── Start / word change ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;
    if (!currentWord) {
      startGame();
      return;
    }
  }, [hasStarted, currentWord, startGame]);

  // When target positions resolve (after DOM measurement), scramble them
  useEffect(() => {
    if (targetPositions.length === 0) return;
    setLetterPositions(scramblePositions(targetPositions));
    setSelectedIdx(null);
    setRoundResult(null);
  }, [targetPositions]);

  // ── Keyboard controls ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || isComparing || isGameOver) return;

    const handleKey = (e: KeyboardEvent) => {
      if (!currentWord) return;
      const wordLen = currentWord.word.length;
      const movableCount = wordLen - 2; // exclude first & last

      if (e.key === 'Tab') {
        e.preventDefault();
        setSelectedIdx(prev => {
          if (prev === null) return 0;
          return (prev + 1) % movableCount;
        });
        return;
      }

      if (selectedIdx === null) return;

      const step = e.shiftKey ? 5 : 1;
      const physicalIdx = selectedIdx + 1; // offset by 1 (skip locked first letter)

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLetterPositions(pts => {
          const next = [...pts];
          next[physicalIdx] = next[physicalIdx] - step;
          return next;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLetterPositions(pts => {
          const next = [...pts];
          next[physicalIdx] = next[physicalIdx] + step;
          return next;
        });
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isComparing, isGameOver, selectedIdx, currentWord]);

  // ── Submit / Compare ───────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!currentWord || isComparing) return;

    // movable letter positions = indices 1 … n-2
    const movablePlayer = letterPositions.slice(1, -1);
    const movableTarget = targetPositions.slice(1, -1);

    const result = calculateWordKerningScore(movablePlayer, movableTarget);
    setRoundResult(result);
    submitRound(result.score, result.tier);
  };

  const handleNext = () => {
    loadNextWord();
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const letters = currentWord ? currentWord.word.split('') : [];
  const fontSize = currentWord?.fontSize ?? 120;

  // Rough container height = fontSize × 1.2 for descenders, plus padding
  const containerHeight = fontSize * 1.4;

  // Finalise score
  const totalScore = roundResults.reduce((s, r) => s + r.score, 0);
  const avgScore = roundResults.length
    ? Math.round(totalScore / roundResults.length)
    : 0;

  return (
    <PageTransition className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[70vh] pb-8 pt-4 px-4 font-sans">

      {/* ── Intro Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!hasStarted}
        onClose={() => {}}
        title="Kerning Challenge"
        description="Space the letters so they feel visually balanced."
        preventOutsideClick
        className="max-w-md"
      >
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-text-secondary leading-relaxed">
            The first and last letters are already placed correctly.
            Drag—or use <kbd className="px-1.5 py-0.5 text-xs bg-surface border border-border rounded">Tab</kbd>/<kbd className="px-1.5 py-0.5 text-xs bg-surface border border-border rounded">←/→</kbd>—to kern the letters in between.
            When you're happy, click <strong className="text-text-primary">Compare</strong> to see how close you were.
          </p>
          <div className="flex flex-col gap-2 bg-surface border border-border rounded-lg p-3 text-xs font-mono text-text-secondary">
            <span>Tab / Shift+Tab — select letter</span>
            <span>← / → (×1px) or Shift+← / → (×5px) — nudge</span>
            <span>Enter — compare</span>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setHasStarted(true);
              startGame();
            }}
          >
            Start Game
          </Button>
        </div>
      </Modal>

      {/* ── Game Over Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isGameOver}
        onClose={() => {}}
        title="Game Over"
        description="Here's how well you kern."
        preventOutsideClick
        className="max-w-md"
      >
        <div className="flex flex-col items-center gap-6 pt-2">
          {/* Big score */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
              Average Score
            </span>
            <span className="text-8xl font-black font-mono text-text-primary">{avgScore}</span>
            <span className="text-text-secondary text-sm">out of 100</span>
          </div>

          {/* Per-round results */}
          <div className="grid grid-cols-5 gap-2 w-full">
            {roundResults.map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-lg font-black font-mono ${TIER_COLOURS[r.tier] ?? ''}`}>
                  {r.score}
                </span>
                <span className="text-[10px] text-text-secondary font-medium">{r.word}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                resetGame();
                setHasStarted(false);
              }}
            >
              Play Again
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/leaderboard')}
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Game Header ──────────────────────────────────────────────────── */}
      {hasStarted && !isGameOver && (
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <span className="font-semibold text-text-primary">{currentRound}</span>
            <span>/</span>
            <span>{totalRounds}</span>
            <span className="ml-1">words</span>
          </div>
          <div className="flex gap-1.5">
            {roundResults.map((r, i) => (
              <div
                key={i}
                title={`${r.word}: ${r.score}`}
                className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                  r.score >= 90
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : r.score >= 70
                    ? 'bg-lime-500/20 text-lime-400'
                    : r.score >= 50
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {r.score}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Letter Stage ─────────────────────────────────────────────────── */}
      {hasStarted && currentWord && !isGameOver && (
        <>
          {/* Ghost (invisible measurer) */}
          <div
            ref={ghostRef}
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none whitespace-nowrap"
            style={{ fontSize, fontFamily: GAME_FONT, fontWeight: 600 }}
          >
            {letters.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>

          {/* Visible stage */}
          <div
            className="relative w-full flex items-center justify-center overflow-visible bg-surface border border-border rounded-2xl"
            style={{ height: containerHeight }}
          >
            {letterPositions.length === letters.length &&
              letters.map((letter, i) => {
                const isLocked = i === 0 || i === letters.length - 1;
                const movableIdx = i - 1; // index into movable set (for selectedIdx)

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
                    onDragEnd={newX => {
                      setLetterPositions(pts => {
                        const next = [...pts];
                        next[i] = newX;
                        return next;
                      });
                    }}
                    onClick={() => {
                      if (!isLocked) setSelectedIdx(movableIdx);
                    }}
                  />
                );
              })}
          </div>

          {/* Helper labels */}
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

          {/* ── Compare overlay feedback ───────────────────────────────── */}
          <AnimatePresence>
            {isComparing && roundResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="w-full mt-4 bg-surface border border-border rounded-2xl px-6 py-4 flex flex-col items-center"
              >
                <RoundResult result={roundResult} word={currentWord.word} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Action Buttons ─────────────────────────────────────────── */}
          <div className="flex gap-4 mt-6 w-full max-w-sm mx-auto">
            {!isComparing ? (
              <Button size="lg" className="flex-1 h-14 text-base" onClick={handleSubmit}>
                Compare ↵
              </Button>
            ) : (
              <Button size="lg" className="flex-1 h-14 text-base" onClick={handleNext}>
                {currentRound >= totalRounds ? 'See Results →' : 'Next Word →'}
              </Button>
            )}
          </div>
        </>
      )}
    </PageTransition>
  );
}
