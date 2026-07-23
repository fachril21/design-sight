# Epic 03 — Kern Duel (game module)

**Stage:** 2 (Games, parallelizable) · **Status:** In scope · **Depends on:** Epic 02

## Goal
The flagship kerning game, mechanically faithful to Kern Type (type.method.ac).

## User stories

- **US3.1** As a player, I drag middle letters with mouse/touch; first and last letters are locked. Full Kern Type keyboard parity: Tab/Shift-Tab select letters, arrows nudge ±1px, Shift+arrows ±10px, Enter submits.
- **US3.2** As a content author, 60 curated words across 12 open-license typefaces exist as round seeds with hand-set reference solutions and difficulty tiers, added via a repeatable content pipeline (script or admin sheet).
- **US3.3** As a player, the reveal shows a ghost overlay of the reference solution sliding over my attempt, with per-letter deviation ticks.

## Acceptance criteria
- Playable on desktop and mobile (touch targets ≥ 44px).
- Scoring falloff tuned so a thoughtful attempt averages 3,000–4,000 (validated against at least 10 human-played test rounds).
- Reference positions absent from all client-visible data before submission.
- Content pipeline documented in the module README; adding a word requires no code change.
