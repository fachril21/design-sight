# Epic 02 — Game engine core

**Stage:** 1 (Foundation) · **Status:** In scope · **Depends on:** Epic 01 · **Blocks:** Epics 03–08

## Goal
The reusable round framework every game plugs into. This epic is why adding a game later is cheap.

## User stories

- **US2.1** As a developer, I can define a new game by implementing a `GameModule` interface — client side `render(seed, onAnswer)` + `validate`, server side `score(seed, answer)` in an Edge Function — and the platform handles timers, round flow, results, XP, and persistence automatically.
- **US2.2** As a player, every round follows one rhythm: intro card → countdown → play (timer ring) → lock-in → scoring suspense → reveal → running total.
- **US2.3** As a player, scoring feels physical: GSAP count-up, elastic score bar, tier stamps (PERFECT / GREAT / GOOD / ROUGH), screen shake + confetti on 5,000s, full SFX pass.
- **US2.4** As a developer, seeds are generated and scored in Edge Functions; the client never sees truth data pre-submission.

## Acceptance criteria
- A dummy game built on the framework runs a full 5-round Quick Play run with juice and server scoring; adding it required zero changes to round-flow code.
- Core tables (`games`, `rounds`, `runs`, `round_results`) migrated with RLS policies; truth fields verifiably absent from client payloads (checked via network inspection test).
- Round flow state machine covered by Vitest tests including timer expiry and mid-round refresh.
- Reduced-motion and muted-audio paths exist for every juice effect.

## Implementation notes
- Round state machine in `src/state/`; `GameModule` types in `src/lib/`.
- Score falloff helpers (exponential curves) live in shared server code so all games use one tuning vocabulary.
