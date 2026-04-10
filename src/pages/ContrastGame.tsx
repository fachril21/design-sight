import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateColorCombination } from '../lib/colorGenerator';
import type { GameRoundColors } from '../lib/colorGenerator';
import { Heart, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [colors, setColors] = useState<GameRoundColors | null>(null);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [currentText, setCurrentText] = useState(TEXT_SAMPLES[0]);
  
  // Need to clear timeout if component unmounts
  const timerRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadNextRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadNextRound = () => {
    setColors(generateColorCombination());
    const randomText = TEXT_SAMPLES[Math.floor(Math.random() * TEXT_SAMPLES.length)];
    setCurrentText(randomText);
  };

  const handleGuess = (userPassGuess: boolean) => {
    if (feedback !== 'idle' || isGameOver || !colors) return;

    const isCorrect = userPassGuess === colors.passesNormal;
    
    if (isCorrect) {
      setFeedback('correct');
    } else {
      setFeedback('wrong');
      setIsShaking(true);
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
      if (feedback !== 'idle' || isGameOver || !colors) return;
      
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        handleGuess(true);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'f') {
        handleGuess(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, isGameOver, colors, lives]); // include lives so handleGuess uses fresh state

  if (!colors) return null; // loading stat

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[70vh] pb-8 pt-4 px-4 font-sans">
      
      {isGameOver ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center border border-border bg-surface rounded-2xl w-full max-w-md p-10 shadow-sm"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
             <Heart className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-text-primary">Game Over</h2>
          <p className="text-sm text-text-secondary mb-8 text-center leading-relaxed">
            You've run out of lives. Detailed scoring and leaderboards are coming in Epic 7.
          </p>
          <Button className="w-full" size="lg" onClick={() => {
            setLives(3);
            setIsGameOver(false);
            loadNextRound();
          }}>
            Play Again
          </Button>
        </motion.div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          
          {/* Strict Minimalist Header */}
          <div className="flex items-center justify-between w-full">
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
            
            <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
              <span className="text-text-secondary uppercase text-xs tracking-wider">Score</span>
              <span className="text-text-primary font-mono bg-surface border border-border px-3 py-1 rounded-md">
                0
              </span>
            </div>
          </div>

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
                      {colors.passesNormal ? 'Pass' : 'Fail'}
                    </div>
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
