import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { popIn, popInReduced } from '@/lib/motion';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Accessible modal: focus moves into the dialog on open, Escape closes,
 * backdrop click closes.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={reduced ? popInReduced : popIn}
            initial="initial"
            animate="enter"
            exit="initial"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-arcade-surface border-3 border-arcade-border rounded-arcade shadow-chunk-lg p-6"
          >
            <h2 className="font-display text-xl mb-4">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
