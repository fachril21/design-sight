# Epic 05 — Color Match (game module)

**Stage:** 2 (Games, parallelizable) · **Status:** In scope · **Depends on:** Epic 02

## Goal
Train color memory and picker precision, scored by perceptual distance.

## User stories

- **US5.1** As a player, a target color shows for 3 seconds, hides, and I reproduce it from memory on an HSL picker within 20 seconds.
- **US5.2** As a player, scoring is ΔE2000 distance computed server-side; the reveal is a side-by-side seam comparison with confetti at ΔE < 2.

## Acceptance criteria
- ΔE2000 implementation validated against published test pairs (unit tests).
- Picker fully touch-friendly and keyboard-operable.
- Seeds generated procedurally server-side (infinite content, no authored dataset needed).
