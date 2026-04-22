import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { GameRoundColors } from '../../lib/colorGenerator';

interface ContrastBoardProps {
  colors: GameRoundColors;
  currentText: string;
  feedback: 'idle' | 'correct' | 'wrong';
  isShaking: boolean;
  wasTimeout: boolean;
  onGuess: (guess: boolean) => void;
  disabled?: boolean;
}

export const ContrastBoard = ({
  colors,
  currentText,
  feedback,
  isShaking,
  wasTimeout,
  onGuess,
  disabled = false
}: ContrastBoardProps) => {
  return (
    <div className="w-full flex flex-col gap-6">
      <motion.div 
        animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
        className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center relative"
        style={{ background: colors.backgroundStr }}
      >
        <h2 
          className="text-4xl md:text-6xl font-black tracking-tight text-center px-8"
          style={{ color: colors.foregroundColor }}
        >
          {currentText}
        </h2>

        <AnimatePresence>
          {feedback !== 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
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
                
                <div className={`px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-md ${colors.passesNormal ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`} aria-live="assertive">
                  {wasTimeout ? 'TIME OUT' : colors.passesNormal ? 'Pass' : 'Fail'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 mt-2">
        <button 
          className="flex flex-col items-center justify-center gap-1.5 p-5 md:p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-text-secondary/30 transition-all active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none group"
          onClick={() => onGuess(true)}
          disabled={disabled || feedback !== 'idle'}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-text-primary group-hover:text-emerald-500 transition-colors" strokeWidth={2.5} />
            <span className="text-xl font-bold tracking-tight text-text-primary">PASS</span>
          </div>
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border group-hover:border-border-hover transition-colors">Key: P or ←</span>
        </button>
        
        <button 
          className="flex flex-col items-center justify-center gap-1.5 p-5 md:p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-text-secondary/30 transition-all active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none group"
          onClick={() => onGuess(false)}
          disabled={disabled || feedback !== 'idle'}
        >
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-text-primary group-hover:text-rose-500 transition-colors" strokeWidth={2.5} />
            <span className="text-xl font-bold tracking-tight text-text-primary">FAIL</span>
          </div>
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border group-hover:border-border-hover transition-colors">Key: F or →</span>
        </button>
      </div>
    </div>
  );
};
