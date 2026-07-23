# Epic 06 — Type Snob (game module)

**Stage:** 2 (Games, parallelizable) · **Status:** In scope · **Depends on:** Epic 02

## Goal
Typeface identification with difficulty tiers, partial credit for near-misses, and a teaching reveal.

## User stories

- **US6.1** As a player, I identify the mystery typeface via 4 options (easy), 8 options (medium), or free-text autocomplete (hard) in 15 seconds; faster answers preserve more points, and similar distractors grant partial credit.
- **US6.2** As a content author, 40 Google Fonts are tiered by difficulty with curated lookalike distractor sets; fonts are subset and self-hosted so specimen rendering can't leak the answer via network requests or CSS names.
- **US6.3** As a player, the reveal highlights the distinguishing glyphs (the R leg, the G spur, the t terminal) with a one-liner.

## Acceptance criteria
- No font name discoverable client-side pre-submission — verified across DOM, network tab, and computed CSS.
- Distractor similarity map produces sensible partial credit (reviewed table in module README).
- Autocomplete tier handles typos with fuzzy matching.
