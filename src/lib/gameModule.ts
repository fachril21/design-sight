import type { ComponentType } from 'react';

/**
 * The GameModule contract (Epic 02, US2.1): a game is a folder that
 * implements this interface and registers in src/games/registry.ts.
 * The round-flow engine handles timers, submission, scoring, reveal,
 * persistence and juice — modules only render Play and Reveal surfaces.
 *
 * INVARIANT (PRD 8.4): `payload` is the client-safe seed. Truth data only
 * arrives in RevealProps.truth, which the server returns AFTER submission.
 */
export interface PlayProps<P, A> {
  payload: P;
  /** Epoch ms when the round locks; render countdown against this. */
  deadline: number;
  /** Submit the answer (also called by the engine on timer expiry with null). */
  onAnswer: (answer: A) => void;
  /** True once input must lock (timer expired / already submitted). */
  locked: boolean;
}

export interface RevealProps<P, A> {
  payload: P;
  answer: A | null;
  truth: unknown;
  score: number;
}

export interface GameModule<P = unknown, A = unknown> {
  slug: string;
  displayName: string;
  tagline: string;
  Play: ComponentType<PlayProps<P, A>>;
  Reveal: ComponentType<RevealProps<P, A>>;
  /** Client-side shape guard run before submitting (server re-validates). */
  validateAnswer: (answer: unknown) => answer is A;
}
