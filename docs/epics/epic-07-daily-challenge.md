# Epic 07 — Daily Challenge, leaderboards & sharing

**Stage:** 3 (Retention & competition) · **Status:** In scope · **Depends on:** Epics 02–06

## Goal
The retention ritual and the growth loop: one shared daily run, leaderboards, and shareable results.

## User stories

- **US7.1** As a player, I get one global daily run (5 rounds mixed across all four games), a single attempt, and streak tracking with freeze tokens (1 earned per 7-day streak).
- **US7.2** As a player, I can browse daily/weekly/all-time leaderboards, global and friends (friend system: add by handle or invite link).
- **US7.3** As a player, I can share a score card (generated image + emoji-grid text) and send async "Beat my score" challenge links that replay my exact seeds and show a head-to-head result.

## Acceptance criteria
- Daily rotates at 00:00 UTC with pre-seeded rounds; one attempt enforced server-side via unique constraint (user, date).
- Share card renders correctly in link previews on major social platforms (OG image endpoint tested).
- Challenge-link recipient plays identical seeds; head-to-head result stored and viewable by both parties.
- Leaderboard queries use views with RLS-safe public projections (handle, avatar, score only).
