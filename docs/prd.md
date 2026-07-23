# PRD — Design Sight
**A gamified skill-training platform for UI/UX designers**

Version 1.1 · July 2026 · Status: Approved for build

> Epics live as separate files in `docs/epics/` (one file per epic). Section 9 of this document is the staging index. Coding agents: read this file fully, then the epic file(s) in scope, before planning any implementation.

---

## 1. Vision

Design Sight is a web-based games platform where UI/UX designers sharpen real craft skills — kerning, contrast, color perception, typeface literacy — through short, juicy, competitive rounds. The benchmark experience is GeoGuessr: a simple universal scoring system, a daily challenge everyone shares, and head-to-head duels that make an educational activity feel like a sport.

The unifying design principle: **every game measures distance from an ideal answer.** Kerning is scored against a typographer's reference solution (the Kern Type model), contrast against the real WCAG ratio, color against ΔE distance, typeface ID against the correct answer. One scoring system (0–5,000 points per round) powers every game, every leaderboard, and every duel.

## 2. Goals & success metrics

**Product goals**
- Make deliberate practice of design fundamentals genuinely fun and social.
- Ship a platform, not a single game: adding a new game should reuse 90% of existing infrastructure (rounds, scoring, duels, leaderboards).
- Run entirely on free-tier infrastructure at launch.

**Success metrics (first 90 days post-launch)**
- 1,000 registered users; 30% D7 retention among daily-challenge players.
- Median session ≥ 3 rounds played.
- ≥ 15% of active users complete at least one 1v1 duel per week.
- Daily challenge share rate ≥ 10% (score-card copies/shares per completion).

## 3. Target users

- **Primary:** working UI/UX designers and design students who want low-effort daily practice and bragging rights.
- **Secondary:** design educators (classroom warm-ups), frontend developers building design literacy, design Twitter/X and community audiences arriving via shared score cards.

## 4. Product principles

1. **Juice is a feature, not polish.** Score count-ups, elastic bars, screen shake on perfect rounds, sound design — game feel is a first-class requirement with its own epic, not a final coat of paint.
2. **30-second rounds.** Every round must be playable in under 30 seconds. Sessions are stackable, not demanding.
3. **One score to rule them all.** 0–5,000 per round, everywhere. Comparable across games, players, and modes.
4. **Server is the referee.** Clients never report scores for competitive modes; they report *answers*, and the server computes scores.
5. **Losing teaches.** Every round result shows the ideal answer and a one-line "why" (e.g., the actual contrast ratio, the reference kerning overlay). The reveal is the lesson.

## 5. Game catalog — v1 (launch)

All four games ship at launch. Each is defined by: input mechanic, truth source, and scoring curve.

### 5.1 Kern Duel
*Modeled on Kern Type (type.method.ac).*
- **Mechanic:** A word is displayed. First and last letters are locked; middle letters are draggable horizontally. Keyboard support mirrors Kern Type: Tab/Shift-Tab to select a letter, arrow keys nudge 1px, Shift+arrow nudges 10px, Enter submits.
- **Truth source:** A curated reference solution per word (hand-set positions stored in the round seed). Launch content: 60 words across 12 typefaces (Google Fonts, open license).
- **Scoring:** Sum of per-letter deviation in px, mapped through an exponential falloff to 0–5,000. Perfect within ±1px per letter = 5,000.
- **Reveal:** Ghost overlay of the reference solution slides over the player's attempt; per-letter deviation shown as colored ticks.

### 5.2 Contrast Call
- **Mechanic A (guess):** A text/background color pair is shown in a realistic UI snippet (button, card, body text). Player drags a slider to guess the WCAG contrast ratio (1.0–21.0) within 15 seconds.
- **Mechanic B (fix):** A failing pair is shown with the required target (AA or AAA for its text size). Player adjusts the foreground color with an HSL lightness slider to *just barely* pass — overshooting costs points (rewards minimal, brand-preserving fixes).
- **Truth source:** Computed WCAG 2.1 relative-luminance ratio (deterministic; roadmap-ready for an APCA variant).
- **Scoring:** Exponential falloff on |guess − actual| (mode A) or on overshoot beyond the passing threshold (mode B).
- **Reveal:** Actual ratio, pass/fail badges for AA/AAA at both text sizes.

### 5.3 Color Match
- **Mechanic:** A target color swatch appears for 3 seconds, then hides. Player reproduces it from memory on an HSL picker within 20 seconds. (Variant for later: side-by-side visible matching with a coarse-step picker.)
- **Truth source:** The target color itself.
- **Scoring:** ΔE2000 distance mapped to 0–5,000. ΔE < 2 (imperceptible difference) = 5,000.
- **Reveal:** Side-by-side swatches with a seam — confetti when the seam disappears (ΔE < 2).

### 5.4 Type Snob
- **Mechanic:** A word or single glyph is shown in a mystery typeface. Player picks from 4 options (easy), 8 options (medium), or free-text with autocomplete (hard). 15-second timer; answering faster preserves more points.
- **Truth source:** The actual typeface. Launch content: 40 typefaces from Google Fonts, tiered by fame, with curated lookalike distractor sets.
- **Scoring:** Correct = base points scaled by remaining time and difficulty tier; distractor similarity grants partial credit on near-misses (e.g., picking Helvetica-equivalent when it's Arial-equivalent scores 40%).
- **Reveal:** The distinguishing glyphs highlighted (the R leg, the G spur, the t terminal) with a one-liner.

## 6. Game modes — v1

### 6.1 Quick Play (solo)
Pick a game, play a 5-round run, get a total out of 25,000. No account required for the first run (guest play with a conversion prompt at the results screen).

### 6.2 Daily Challenge
One seeded run per day — same 5 rounds for every player globally, one attempt, mixed across all four games (GeoGuessr daily model). Global and friends leaderboards. Shareable score card (image + emoji-grid text like Wordle) — the primary growth loop.

### 6.3 Duel (1v1, live)
- **Matchmaking:** Invite link (play a friend) or open queue (match with a stranger). No skill-based matchmaking in v1 — that arrives with the Ranked epic.
- **Format:** Best-of-5 rounds with a health-bar system. Both players start at 5,000 HP. Each round, both play the same seed simultaneously; the score *difference* is dealt as damage to the lower scorer. First to 0 HP loses; if 5 rounds complete, higher remaining HP wins.
- **Round flow:** Synchronized 3-2-1 countdown → both play locally (timers enforced client-side, validated server-side) → answers submitted → server scores → dramatic simultaneous reveal with damage animation → next round.
- **Presence:** Opponent's status is visible ("thinking…", "locked in ✓") but never their in-progress answer.
- **Disconnects:** 30-second grace timer; a player who fails to submit scores 0 for that round; abandoning two consecutive rounds forfeits.

### 6.4 Async Challenge Links
Any completed solo run generates a "Beat my score" URL that replays the exact same seeds for the recipient, then shows a head-to-head result. Near-free to build on top of seeded rounds; strong viral loop.

**Explicitly deferred from v1:** party lobbies (3–10 players), ranked leagues/ELO, tournaments, user-generated rounds. See Epics 09–12.

## 7. Progression (v1: casual)

- **XP & levels:** Every round grants XP proportional to score. Levels are cosmetic prestige (title + badge on profile and in duels): Pixel Pusher → Grid Guardian → Kerning Knight → Contrast Connoisseur → Design Deity.
- **Streaks:** Daily-challenge streak counter with freeze tokens (1 earned per 7-day streak).
- **Leaderboards:** Daily (resets daily), weekly, all-time; global and friends. Casual only — no divisions/ELO until the Ranked epic.
- **Profile:** Avatar, level, per-game best scores, duel W/L, streak, badge case.

## 8. Architecture & tech stack

### 8.1 Stack (all free tier)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast dev, huge ecosystem |
| Styling | Tailwind CSS | Velocity + consistent design tokens |
| Animation | Framer Motion (UI/transitions) + GSAP core (score choreography, count-ups) | The "juice" layer |
| Audio | Howler.js | SFX: ticks, locks, damage hits, fanfares |
| Game rendering | SVG + DOM (draggable letters, sliders, pickers) | No game engine needed for v1 |
| State | Zustand | Light, ideal for round/timer/duel state machines |
| Backend | Supabase | Auth + Postgres + Realtime + Edge Functions in one free tier |
| Auth | Supabase Auth (email magic link + Google OAuth) | Guest → account upgrade flow |
| Realtime | Supabase Realtime (broadcast + presence channels) | Lobby presence, round sync, reveal sync |
| Server logic | Supabase Edge Functions (Deno/TS) | Authoritative scoring, seed generation, matchmaking |
| Hosting | Vercel or Cloudflare Pages | Free static hosting + edge CDN |
| Fonts | Google Fonts (self-hosted subset) | Open licenses for game content |

### 8.2 Data model (Postgres, initial)

- `profiles` — id (auth uid), handle, avatar, xp, level, streak, streak_freezes
- `games` — id, slug, name, config (JSON: timers, scoring params)
- `rounds` — id, game_id, seed payload (JSON: word + reference positions / color pair / target color / typeface + distractors), difficulty, active flag
- `runs` — id, user_id, mode (quick | daily | challenge_link), round_ids[], total_score, completed_at
- `round_results` — run_id, round_id, answer payload (JSON), score, time_ms
- `daily_challenges` — date, round_ids[], leaderboard via view on runs
- `duels` — id, status, player_a, player_b, round_ids[], hp_a, hp_b, winner, channel_id
- `duel_rounds` — duel_id, round_no, answers, scores, damage
- `friendships` — user_id, friend_id, status

Row Level Security on everything; players can read their own results and public leaderboard views only. Reference solutions (e.g., kerning positions) are **never sent to the client before submission** — the client gets only the playable payload; scoring happens in an Edge Function.

### 8.3 Realtime duel design

Round-synced, not twitch-synced — deliberately shaped to Supabase Realtime's strengths:
1. Duel channel per match (`duel:{id}`), presence tracks connection.
2. Server (Edge Function) emits `round_start` with the seed; clients play locally.
3. Clients submit answers to an Edge Function (not the channel) → server scores → server broadcasts `round_result` to both → clients run the reveal choreography.
4. All authoritative state (HP, scores) lives in Postgres; the channel is transport only. A reconnecting client rehydrates from the DB.

### 8.4 Anti-cheat (v1-appropriate)

- Server-side scoring only; clients submit raw answers.
- Server timestamps round start/submit; submissions outside the window score 0.
- Reference answers withheld from client payloads until after submission.
- Daily challenge: one attempt enforced by unique constraint (user, date).
- Accepted risk: solo/casual modes are lightly protected; heavy anti-cheat waits for Ranked.

## 9. Epics — staging index

Full specifications live in `docs/epics/`, one file per epic. Stages are sequential; epics within a stage can run in parallel. Do not begin a stage until the previous stage's acceptance criteria pass.

| Stage | Epic | File | Status |
|---|---|---|---|
| 1 — Foundation | 01 Platform foundation & design system | `epics/epic-01-platform-foundation.md` | In scope |
| 1 — Foundation | 02 Game engine core | `epics/epic-02-game-engine-core.md` | In scope |
| 2 — Games (parallelizable) | 03 Kern Duel | `epics/epic-03-kern-duel.md` | In scope |
| 2 — Games (parallelizable) | 04 Contrast Call | `epics/epic-04-contrast-call.md` | In scope |
| 2 — Games (parallelizable) | 05 Color Match | `epics/epic-05-color-match.md` | In scope |
| 2 — Games (parallelizable) | 06 Type Snob | `epics/epic-06-type-snob.md` | In scope |
| 3 — Retention & competition | 07 Daily Challenge, leaderboards & sharing | `epics/epic-07-daily-challenge.md` | In scope |
| 3 — Retention & competition | 08 Duels (live 1v1) | `epics/epic-08-duels.md` | In scope |
| 4 — Post-launch | 09 Party lobbies | `epics/epic-09-party-lobbies.md` | Deferred |
| 4 — Post-launch | 10 Ranked & leagues | `epics/epic-10-ranked-leagues.md` | Deferred |
| 4 — Post-launch | 11 Content expansion & new games | `epics/epic-11-content-expansion.md` | Deferred |
| 4 — Post-launch | 12 Community & UGC | `epics/epic-12-community-ugc.md` | Deferred |

## 10. Non-functional requirements

- **Performance:** First playable round < 3s on 4G; animations at 60fps on mid-tier mobile; font/game assets lazy-loaded per game.
- **Responsiveness:** Fully playable on mobile touch; desktop gets keyboard shortcuts as a power-user layer.
- **Accessibility (non-negotiable for a design-skills product):** Full keyboard playability, visible focus states, `prefers-reduced-motion` honored (juice degrades gracefully to fades), screen-reader announcements for scores and round transitions, and the app's own UI passes WCAG AA.
- **Free-tier budgets:** Supabase free tier limits (500MB DB, 2M Realtime messages/mo, 500K Edge Function invocations/mo) tracked in a usage dashboard; round-synced duel design keeps Realtime messages to ~15 per duel.
- **Privacy:** Minimal PII (email + handle); no third-party trackers at launch.

## 11. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Kerning reference solutions are subjective | Scoring feels unfair | Curate references with tolerance bands (±1px free); show the reference at reveal so scoring is legible; collect disputes via a flag button |
| Supabase Realtime latency spikes | Duels feel laggy | Round-synced design means latency only affects transitions, never gameplay; generous sync windows |
| Free-tier ceilings hit with growth | Outage or cost surprise | Usage dashboard + alerts at 70%; Supabase Pro ($25/mo) is the pre-approved first paid step |
| Content treadmill (players exhaust 60 words fast) | Retention decay | Daily challenge reuses rounds efficiently; admin authoring tool in Epic 11; procedural seeds for Color Match/Contrast Call are infinite by nature |
| Cheating in casual modes | Leaderboard trust erosion | Server-authoritative scoring from day one; accept residual risk until Ranked's hardened anti-cheat |

## 12. Out of scope (v1)

Native apps, tournaments, monetization, user-generated content, non-English localization, APCA contrast standard (roadmap note only), spectator mode.
