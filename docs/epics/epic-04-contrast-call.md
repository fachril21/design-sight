# Epic 04 — Contrast Call (game module)

**Stage:** 2 (Games, parallelizable) · **Status:** In scope · **Depends on:** Epic 02

## Goal
Train contrast-ratio intuition with guess and fix modes scored against WCAG 2.1 math.

## User stories

- **US4.1** As a player, in **guess mode** I estimate the WCAG contrast ratio (1.0–21.0) of a color pair shown in a realistic UI snippet within 15 seconds; in **fix mode** I adjust a failing foreground with an HSL lightness slider to just barely pass the stated target (AA/AAA for its text size), with overshoot costing points. Live ratio readout stays hidden until submission.
- **US4.2** As a player, the reveal shows the true ratio, AA/AAA pass/fail badges at both text sizes, and a one-line takeaway.

## Acceptance criteria
- Ratio computation matches WCAG 2.1 relative-luminance reference values exactly (unit tests against published pairs).
- 50+ seeded color pairs across both modes with difficulty tiers.
- Both modes fully keyboard-playable.
