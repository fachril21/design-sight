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
import { useUserStore } from '../store/userStore';
import { submitScore } from '../lib/supabase';
import { ShareModal } from '../components/ui/ShareModal';
import { Loader2, CheckCircle, XCircle, Timer } from 'lucide-react';
import { KerningBoard } from '../components/game/KerningBoard';

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

// SVG Hand Icons for Custom Cursors (Base64 encoded)
// Contrast ensured by using black hands with white strokes (light theme) and white hands with black strokes (dark theme).
const CURSOR_GRAB_BLACK = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJibGFjayIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xOCAxMVY2YTIgMiAwIDAgMC00IDB2NU0xNCAxMFY0YTIgMiAwIDAgMC00IDB2Nk0xMCAxMFY2YTIgMiAwIDAgMC00IDB2NU0xOCA4YTIgMiAwIDAgMSA0IDB2NmE4IDggMCAwIDEtOCA4aC0yYy0yLjggMC00LjUtLjg2LTUuOTktMi4zNGwtMy42LTMuNmEyIDIgMCAwIDEgMi44Mi0yLjgyTDcgMTUiLz48L3N2Zz4=';
const CURSOR_GRABBING_BLACK = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJibGFjayIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAxMXYtNU0xMCAxMXYtNk04IDExVjhNMTQgMTF2LTlhMiAyIDAgMCAwLTQgMHY2TTggMTF2LTRhMiAyIDAgMCAwLTQgMHY1TDE4IDhhMiAyIDAgMCAxIDQgMHY2YTggOCAwIDAgMS04IDhoLTJjLTIuOCAwLTQuNS0uODYtNS45OS0yLjM0bC0zLjYtMy42YTIgMiAwIDAgMSAyLjgyLTIuODJMNyAxNSIvPjwvc3ZnPg==';
const CURSOR_GRAB_WHITE = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xOCAxMVY2YTIgMiAwIDAgMC00IDB2NU0xNCAxMFY0YTIgMiAwIDAgMC00IDB2Nk0xMCAxMFY2YTIgMiAwIDAgMC00IDB2NU0xOCA4YTIgMiAwIDAgMSA0IDB2NmE4IDggMCAwIDEtOCA4aC0yYy0yLjggMC00LjUtLjg2LTUuOTktMi4zNGwtMy42LTMuNmEyIDIgMCAwIDEgMi44Mi0yLjgyTDcgMTUiLz48L3N2Zz4=';
const CURSOR_GRABBING_WHITE = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAxMXYtNU0xMCAxMXYtNk04IDExVjhNMTQgMTF2LTlhMiAyIDAgMCAwLTQgMHY2TTggMTF2LTRhMiAyIDAgMCAwLTQgMHY1TDE4IDhhMiAyIDAgMCAxIDQgMHY2YTggOCAwIDAgMS04IDhoLTJjLTIuOCAwLTQuNS0uODYtNS45OS0yLjM0bC0zLjYtMy42YTIgMiAwIDAgMSAyLjgyLTIuODJMNyAxNSIvPjwvc3ZnPg==';

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

  const [hasStarted, setHasStarted] = useState(false);
  const [letterPositions, setLetterPositions] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<ScoreResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  const { ghostRef, targetPositions } = useLetterPositions(currentWord);

  const { username, tag } = useUserStore();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'failed' | 'offline'>('idle');
  const [showShare, setShowShare] = useState(false);

  const totalScore = roundResults.reduce((s, r) => s + r.score, 0);

  useEffect(() => {
    if (!isGameOver || submitStatus !== 'idle') return;
    if (!username || !tag) return;

    setSubmitStatus('submitting');
    const perfectCount = roundResults.filter(r => r.tier === 'Perfect').length;
    const mockAccuracy = totalRounds > 0 ? Math.round((perfectCount / totalRounds) * 100) : 0;

    submitScore({
      username,
      user_tag: tag,
      score: totalScore,
      streak_best: 0,
      accuracy: mockAccuracy,
      questions_answered: totalRounds,
      game_id: 'kerning-challenge',
    }).then((result) => {
      setSubmitStatus(result ? 'submitted' : 'offline');
    }).catch(() => {
      setSubmitStatus('failed');
    });
  }, [isGameOver, submitStatus, username, tag, roundResults, totalRounds, totalScore]);

  useEffect(() => {
    if (!hasStarted) return;
    if (!currentWord) {
      if (isGameOver) return;
      startGame();
      return;
    }
  }, [hasStarted, currentWord, startGame, isGameOver]);

  useEffect(() => {
    if (targetPositions.length === 0) return;
    setLetterPositions(scramblePositions(targetPositions));
    setSelectedIdx(null);
    setRoundResult(null);
  }, [targetPositions]);

  const positionsRef = useRef({ letter: letterPositions, target: targetPositions });
  useEffect(() => {
    positionsRef.current = { letter: letterPositions, target: targetPositions };
  }, [letterPositions, targetPositions]);

  useEffect(() => {
    if (!hasStarted || isComparing || isGameOver || !currentWord) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [hasStarted, isComparing, isGameOver, currentWord]);

  useEffect(() => {
    if (timeLeft === 0 && !isComparing && !isGameOver && currentWord && positionsRef.current.target.length > 0) {
      const p = positionsRef.current;
      const movablePlayer = p.letter.slice(1, -1);
      const movableTarget = p.target.slice(1, -1);
      const result = calculateWordKerningScore(movablePlayer, movableTarget);
      setRoundResult(result);
      submitRound(result.score, result.tier);
    }
  }, [timeLeft, isComparing, isGameOver, currentWord, submitRound]);

  useEffect(() => {
    if (!hasStarted || isComparing || isGameOver) return;

    const handleKey = (e: KeyboardEvent) => {
      if (!currentWord) return;
      const wordLen = currentWord.word.length;
      const movableCount = wordLen - 2;

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
      const physicalIdx = selectedIdx + 1;

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
  }, [hasStarted, isComparing, isGameOver, selectedIdx, currentWord]);

  const handleSubmit = () => {
    if (!currentWord || isComparing) return;
    const movablePlayer = letterPositions.slice(1, -1);
    const movableTarget = targetPositions.slice(1, -1);
    const result = calculateWordKerningScore(movablePlayer, movableTarget);
    setRoundResult(result);
    submitRound(result.score, result.tier);
  };

  const handleNext = () => {
    setTimeLeft(20);
    loadNextWord();
  };

  const letters = currentWord ? currentWord.word.split('') : [];
  const fontSize = currentWord?.fontSize ?? 120;
  const containerHeight = fontSize * 1.4;

  return (
    <PageTransition className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[70vh] pb-8 pt-4 px-4 font-sans">
      <Modal
        isOpen={!hasStarted}
        onClose={() => navigate('/')}
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
              setTimeLeft(20);
              startGame();
            }}
          >
            Start Game
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isGameOver}
        onClose={() => {
          resetGame();
          setSubmitStatus('idle');
          setHasStarted(false);
          navigate('/');
        }}
        title="Game Over"
        description="Here's how well you kern."
        preventOutsideClick
        className="max-w-md"
      >
        <div className="flex flex-col items-center gap-6 pt-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
              Total Score
            </span>
            <span className="text-8xl font-black font-mono text-text-primary">{totalScore}</span>
            <span className="text-text-secondary text-sm">out of 1000</span>
          </div>

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

          <div className="flex items-center justify-center gap-2 mb-2 w-full text-xs font-medium">
            {submitStatus === 'submitting' && (
              <><Loader2 size={14} className="animate-spin text-text-secondary" /><span className="text-text-secondary">Submitting score...</span></>
            )}
            {submitStatus === 'submitted' && (
              <><CheckCircle size={14} className="text-emerald-500" /><span className="text-emerald-500">Score submitted to leaderboard!</span></>
            )}
            {submitStatus === 'failed' && (
              <><XCircle size={14} className="text-rose-500" /><span className="text-rose-500">Failed to submit score</span></>
            )}
            {submitStatus === 'offline' && (
              <span className="text-text-secondary">Offline mode — score saved locally</span>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                resetGame();
                setTimeLeft(20);
                setSubmitStatus('idle');
                setHasStarted(false);
              }}
            >
              Play Again
            </Button>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setShowShare(true)}
              >
                Share Score
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
        </div>
      </Modal>

      {username && tag && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          gameName="Kerning Challenge"
          score={totalScore}
          stats={[
            { label: 'Words', value: totalRounds.toString(), colorClass: 'text-amber-500' },
            { label: 'Perfect', value: roundResults.filter(r => r.tier === 'Perfect').length.toString(), colorClass: 'text-emerald-500' },
            { label: 'Wrong', value: roundResults.filter(r => r.tier === 'Wrong').length.toString(), colorClass: 'text-rose-500' },
          ]}
          username={username}
          tag={tag}
        />
      )}

      {hasStarted && !isGameOver && (
        <div className="flex flex-col w-full mb-6 gap-4">
          <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-blue-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 20) * 100}%` }}
              transition={{ ease: "linear", duration: 1 }}
            />
          </div>
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <span className="font-semibold text-text-primary">{currentRound}</span>
              <span>/</span>
              <span>{totalRounds}</span>
              <span className="ml-1">words</span>
              <span className="mx-2">•</span>
              <Timer size={16} className={timeLeft <= 3 ? "text-rose-500 animate-pulse" : "text-text-secondary"} />
              <span className={`font-mono font-bold ${timeLeft <= 3 ? "text-rose-500 animate-pulse" : ""}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
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
        </div>
      )}


      {hasStarted && currentWord && !isGameOver && (
        <div className="flex flex-col w-full">
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

          <KerningBoard 
            word={currentWord}
            letterPositions={letterPositions}
            targetPositions={targetPositions}
            isComparing={isComparing}
            selectedIdx={selectedIdx}
            roundResult={roundResult}
            onPositionChange={(i, newX) => {
              setLetterPositions(pts => {
                const next = [...pts];
                next[i] = newX;
                return next;
              });
            }}
            onSelect={setSelectedIdx}
          />

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
        </div>
      )}
    </PageTransition>
  );
}
