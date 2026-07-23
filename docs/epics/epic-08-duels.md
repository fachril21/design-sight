# Epic 08 — Duels (live 1v1)

**Stage:** 3 (Retention & competition) · **Status:** In scope · **Depends on:** Epics 02–06 · **Reference:** PRD §6.3, §8.3

## Goal
GeoGuessr-style live duels with the HP damage system, built on Supabase Realtime with server-authoritative state.

## User stories

- **US8.1** As a player, I can create a duel via invite link or join an open queue; the lobby shows both players' presence, avatars, and levels.
- **US8.2** As a player, duels are best-of-5 with the HP system (both start at 5,000 HP; per-round score difference dealt as damage to the lower scorer): synchronized 3-2-1 countdowns, opponent status ("thinking… / locked in") without answer leakage, simultaneous reveal with damage animation and hit SFX.
- **US8.3** As a player, disconnects get a 30-second grace; a missed submission scores 0 for the round; abandoning two consecutive rounds forfeits; a reconnecting client rehydrates full match state from Postgres.
- **US8.4** As a player, the post-match screen shows a round-by-round breakdown, a rematch button, and a shareable result.

## Acceptance criteria
- Two clients on throttled connections complete a full duel without desync.
- All HP/score state survives a mid-match browser refresh on either side.
- Server (Edge Functions + Postgres) is authoritative for every point of damage; the Realtime channel carries transport only.
- A full duel consumes ≤ 20 Realtime messages (free-tier budget check).
