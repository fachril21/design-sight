import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the OS asks for reduced motion. Every juice effect must check
 * this and degrade to a fade/static presentation (PRD 10, Epic 01 AC).
 * Live-updates if the OS setting changes while the app is open.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Non-hook variant for imperative code (GSAP timelines, SFX choreography). */
export function prefersReducedMotion(): boolean {
  return getSnapshot();
}
