import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { generateColorCombination } from '../lib/colorGenerator';
import type { GameRoundColors } from '../lib/colorGenerator';
import { Heart, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { submitScore } from '../lib/supabase';

const TEXT_SAMPLES = [
  "Visual Hierarchy",
  "Aesthetic Usability",
  "Contrast Matters",
  "Accessibility",
  "Design Sight",
  "Color Theory",
  "Proximity Principle",
  "User Experience",
  "Readability"
];

export default function ContrastGame() {
  const navigate = useNavigate();
  const [colors, setColors] = useState<GameRoundColors | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [wasTimeout, setWasTimeout] = useState(false);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [currentText, setCurrentText] = useState(TEXT_SAMPLES[0]);
  
  const { score, streak, bestStreak, totalAnswers, correctAnswers, incrementScore, decrementScore, resetGame, highScore } = useGameStore();
  const { username, tag } = useUserStore();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'failed' | 'offline'>('idle');

  // Need to clear timeout if component unmounts
  const timerRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadNextRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startGame = () => {
    setHasStarted(true);
    setLives(3);
    resetGame();
    setSubmitStatus('idle');
    loadNextRound();
  };

  // Auto-submit score to Supabase when game ends
  useEffect(() => {
    if (!isGameOver || submitStatus !== 'idle') return;
    if (!username || !tag) return;

    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    setSubmitStatus('submitting');
    submitScore({
      username,
      user_tag: tag,
      score,
      streak_best: bestStreak,
      accuracy,
      questions_answered: totalAnswers,
    }).then((result) => {
      setSubmitStatus(result ? 'submitted' : 'offline');
    }).catch(() => {
      setSubmitStatus('failed');
    });
  }, [isGameOver]);

  const loadNextRound = () => {
    setColors(generateColorCombination());
    const randomText = TEXT_SAMPLES[Math.floor(Math.random() * TEXT_SAMPLES.length)];
    setCurrentText(randomText);
  };

  const handleGuess = (userPassGuess: boolean | 'timeout') => {
    if (feedback !== 'idle' || isGameOver || !colors || !hasStarted) return;
    
    // Check if it was a timeout
    const isTimeout = userPassGuess === 'timeout';
    setWasTimeout(isTimeout);

    const isCorrect = !isTimeout && userPassGuess === colors.passesNormal;
    
    if (isCorrect) {
      setFeedback('correct');
      const { newStreak } = incrementScore();
      
      // Fire confetti on milestone streaks
      if (newStreak === 20 || (newStreak > 20 && newStreak % 10 === 0)) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 100 });
      } else if (newStreak === 10) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, zIndex: 100 });
      } else if (newStreak === 5) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, zIndex: 100 });
      }
      
    } else {
      setFeedback('wrong');
      setIsShaking(true);
      decrementScore();
      
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setIsGameOver(true);
      }
    }

    timerRef.current = setTimeout(() => {
      setFeedback('idle');
      setIsShaking(false);
      if (lives - (isCorrect ? 0 : 1) > 0) {
        loadNextRound();
      }
    }, 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback !== 'idle' || isGameOver || !colors || !hasStarted) return;
      
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        handleGuess(true);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'f') {
        handleGuess(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, isGameOver, colors, lives, hasStarted]); // inject hasStarted into dependencies

  if (!colors) return null; // loading stat

  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[70vh] pb-8 pt-4 px-4 font-sans">
      
      {/* Start Game Modal */}
      <Modal 
        isOpen={!hasStarted} 
        onClose={() => {}} 
        title="Contrast Checker"
        description="Are you ready to test your design sight?"
        preventOutsideClick
        className="max-w-md"
      >
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-text-secondary leading-relaxed">
            You will be shown random color combinations. You have <strong className="text-text-primary">5 seconds</strong> per round to determine if the contrast passes the <strong className="text-text-primary">WCAG AA Standard (4.5:1)</strong>.
          </p>
          <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-lg mb-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Keyboard Shortcuts</span>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-background border border-border rounded text-xs">P / ← for PASS</span>
                <span className="px-2 py-0.5 bg-background border border-border rounded text-xs">F / → for FAIL</span>
              </div>
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={startGame}>
            Start Game
          </Button>
        </div>
      </Modal>

      <Modal 
        isOpen={isGameOver} 
        onClose={() => {}} 
        title="GAME OVER"
        description={username ? `Good effort, ${username}#${tag}!` : undefined}
        preventOutsideClick
        className="max-w-md sm:max-w-lg"
      >
        <div className="flex flex-col items-center pt-2">
          
          <div className="flex flex-col items-center gap-1 mb-6 text-center">
            <span className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Final Score</span>
            <span className="text-6xl font-mono font-black text-text-primary tracking-tight">{score}</span>
            {score >= highScore && score > 0 && (
              <span className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">New High Score!</span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Best Streak</span>
              <span className="text-xl font-bold text-text-primary flex items-center gap-1"><span className="text-orange-500">🔥</span> {bestStreak}</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-xl font-bold text-text-primary">{accuracy}%</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center col-span-2">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Questions Answered</span>
              <span className="text-xl font-bold text-text-primary">{totalAnswers}</span>
            </div>
          </div>

          {/* Score submission status */}
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-medium">
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
            <Button size="lg" className="w-full h-12 text-md" onClick={() => {
              setIsGameOver(false);
              startGame();
            }}>
              Play Again
            </Button>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button variant="secondary" size="lg" className="h-12 w-full text-md" disabled>
                Share Score
              </Button>
              <Button variant="secondary" size="lg" className="h-12 w-full text-md" onClick={() => navigate('/leaderboard')}>
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {!isGameOver && (
        <div className="w-full flex flex-col gap-6">
          
          {/* Strict Minimalist Header */}
          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div 
                  key={i}
                  initial={false}
                  animate={{ scale: i < lives ? 1 : 0.85, opacity: i < lives ? 1 : 0.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Heart 
                    className={`w-5 h-5 ${i < lives ? 'fill-red-500 text-red-500' : 'stroke-current text-text-secondary'}`} 
                    strokeWidth={2}
                  />
                </motion.div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium tracking-wide">
              {streak >= 3 && (
                <motion.div 
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20"
                >
                  <span className="text-base leading-none">🔥</span>
                  <span className="font-bold">{streak}</span>
                </motion.div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-text-secondary uppercase text-xs tracking-wider">Score</span>
                <motion.div 
                  key={score}
                  initial={{ scale: 1.1, color: 'var(--color-emerald-500)' }}
                  animate={{ scale: 1, color: 'var(--color-text-primary)' }}
                  className="font-mono bg-surface border border-border px-3 py-1 rounded-md min-w-[3rem] text-center"
                >
                  {score}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Progress Timer */}
          {hasStarted && !isGameOver && colors && (
            <div className="w-full h-1.5 bg-surface border border-border rounded-full overflow-hidden mt-3 mb-2 shrink-0 relative">
              {feedback === 'idle' && (
                <motion.div
                  key={"timer" + colors.backgroundStr + score} // reset animation natively
                  initial={{ width: "100%", backgroundColor: "#10b981" }}
                  animate={{ width: "0%", backgroundColor: "#f43f5e" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => handleGuess('timeout')}
                  className="h-full absolute left-0 top-0"
                />
              )}
            </div>
          )}

          {/* The Pure Game Board Container */}
          <motion.div 
            animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center relative"
            style={{ background: colors.backgroundStr }}
          >
            {/* The Actual Text Being Tested - No blending, pure CSS color */}
            <h2 
              className="text-4xl md:text-6xl font-black tracking-tight text-center px-8"
              style={{ color: colors.foregroundColor }}
            >
              {currentText}
            </h2>

            {/* Clean Flat Overlays for Feedback */}
            <AnimatePresence>
              {feedback !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  {/* Subtle flat dimming background */}
                  <div className="absolute inset-0 bg-background/90" />
                  
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                    className="relative z-20 flex flex-col items-center justify-center p-6 bg-surface border border-border shadow-lg rounded-xl min-w-[280px]"
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full mb-4 ${feedback === 'correct' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {feedback === 'correct' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" strokeWidth={2.5} />
                      )}
                    </div>
                    
                    <div className="text-sm text-text-secondary uppercase tracking-wider font-semibold mb-1">
                      Contrast Ratio
                    </div>
                    <div className="text-4xl font-mono font-bold text-text-primary tracking-tight mb-4">
                      {colors.ratio.toFixed(2)}:1
                    </div>
                    
                    <div className={`px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-md ${colors.passesNormal ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {wasTimeout ? 'TIME OUT' : colors.passesNormal ? 'Pass' : 'Fail'}
                    </div>

                    {feedback === 'wrong' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-black shadow-lg"
                      >
                        -5 PTS
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Clean Action Buttons */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 mt-2">
            <button 
              className="flex flex-col items-center justify-center gap-1.5 p-5 md:p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-text-secondary/30 transition-all active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none group"
              onClick={() => handleGuess(true)}
              disabled={feedback !== 'idle'}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-text-primary group-hover:text-emerald-500 transition-colors" strokeWidth={2.5} />
                <span className="text-xl font-bold tracking-tight text-text-primary">PASS</span>
              </div>
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border group-hover:border-border-hover transition-colors">Key: P or ←</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center gap-1.5 p-5 md:p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-text-secondary/30 transition-all active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none group"
              onClick={() => handleGuess(false)}
              disabled={feedback !== 'idle'}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-text-primary group-hover:text-rose-500 transition-colors" strokeWidth={2.5} />
                <span className="text-xl font-bold tracking-tight text-text-primary">FAIL</span>
              </div>
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border group-hover:border-border-hover transition-colors">Key: F or →</span>
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
