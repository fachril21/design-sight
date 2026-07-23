import type { Transition, Variants } from 'framer-motion';

/** Shared motion vocabulary. Components pick variants via useReducedMotion:
 *  full spring motion normally, opacity-only fades under reduced motion. */
export const springy: Transition = { type: 'spring', stiffness: 420, damping: 28 };

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  enter: { opacity: 1, y: 0, scale: 1, transition: springy },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export const pageVariantsReduced: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.6 },
  enter: { opacity: 1, scale: 1, transition: springy },
};

export const popInReduced: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.2 } },
};
