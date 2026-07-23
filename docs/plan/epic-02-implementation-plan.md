# Epic 02 — Game engine core: Implementation plan

**Source docs:** `docs/prd.md` §1, §4, §6.1, §8.2–8.4 · `docs/epics/epic-02-game-engine-core.md`
**Depends on:** Epic 01 · **Blocks:** Epics 03–08

---

## 1. Scope

The reusable round framework: `GameModule` interface, the round-flow state machine (intro → countdown → play → lock-in → suspense → reveal → total), the juice layer (GSAP count-up, elastic bar, tier stamps, shake/confetti, SFX), server-authoritative seed generation + scoring via Edge Functions, run persistence, XP grants, and a dummy game proving the framework end-to-end in Quick Play.

**Out of scope:** real game modules (Epics 03–06), daily challenge, duels, leaderboard UI.

## 2. Architecture decisions

1. **Truth never reaches the client pre-submission.** Round content is split at the schema level (`rounds.payload` vs `rounds.truth`). Edge Functions read both; API responses to clients carry `payload` only. A Vitest test asserts the client-side round types cannot even represent truth fields (type-level guard) plus a runtime test asserts API responses have no `truth` key.
2. **One scoring vocabulary.** `supabase/functions/_shared/scoring.ts` exports `exponentialFalloff(deviation, tolerance, falloff)` → 0–5,000 and tier mapping (PERFECT ≥ 4750, GREAT ≥ 3500, GOOD ≥ 2000, ROUGH < 2000). Client imports a mirrored copy in `src/lib/scoring.ts` for *display* math only (tier colors, bar percentages) — never for authoritative scores. Both are covered by the same test vectors to prevent drift.
3. **Edge Functions (Deno):**
   - `start-run` — auth’d or guest; picks N active rounds for a game (or dummy), creates the `runs` row (server-side; guests get a run held client-side only), returns `{ runId, rounds: [{ roundId, gameSlug, payload }] }`, records `started_at` per round in a server-side table/JWT-signed token for timing validation.
   - `submit-answer` — `{ runId, roundNo, roundId, answer, clientTimeMs }` → loads `truth`, scores, validates the submission window (round start + timer + grace ≤ now), writes `round_results`, returns `{ score, tier, truth reveal payload }`. Late/duplicate submissions score 0 / are rejected.
   - `complete-run` — finalizes `total_score`, grants XP (score/100), levels up at thresholds, returns summary.
   - Guest mode: same functions accept a guest UUID header when unauthenticated; guest runs are **not** persisted server-side (PRD: guest converts later) — scoring still happens server-side so guests can’t self-report scores either. If Supabase is unconfigured entirely, the client falls back to a local “offline referee” (clearly non-competitive) so the dummy game stays playable — the fallback is dev-only and logged.
4. **Round state machine** (`src/state/roundStore.ts`, Zustand): explicit states `idle → intro → countdown → playing → locking → scoring → reveal → interstitial → complete`, with events (`START_RUN`, `COUNTDOWN_DONE`, `TIMER_EXPIRED`, `SUBMIT`, `SCORED`, `NEXT_ROUND`, `RUN_DONE`, `ERROR`). Transitions are table-driven so illegal transitions throw in dev and no-op in prod. Timer is a store-owned `requestAnimationFrame` ticker (not per-component `setInterval`) so unmount/remount can’t double-tick.
5. **Mid-round refresh recovery:** in-progress run snapshot (runId, round index, deadline timestamps) persisted to `sessionStorage` on every transition; on boot, a snapshot younger than its deadline resumes at the same round with the remaining time (server re-validates anyway); an expired snapshot forfeits that round (score 0) and resumes at the next.
6. **GameModule interface** (`src/lib/gameModule.ts`):
   ```ts
   interface GameModule<P = unknown, A = unknown> {
     slug: string;
     displayName: string;
     Play: React.ComponentType<{ payload: P; deadline: number; onAnswer(a: A): void }>;
     Reveal: React.ComponentType<{ payload: P; answer: A; truth: unknown; score: number }>;
     validateAnswer(a: unknown): a is A;   // client-side shape guard before submit
   }
   ```
   Modules register in `src/games/registry.ts`; the round-flow engine looks them up by slug. Adding a game = adding a folder + registry entry, zero engine edits (the Epic 02 AC).
7. **Dummy game** (`src/games/dummy/`): “Pixel Guess” — payload shows a bar of length X; the player guesses its px width with a slider. Truth = actual width; scored by exponential falloff. Exercises every seam: payload/truth split, timer, validate, reveal, juice.
8. **Juice layer** (`src/components/juice/`): `ScoreCountUp` (GSAP), `ElasticScoreBar`, `TierStamp` (spring scale-in), `ScreenShake` (wrapper, gated), `ConfettiBurst` (canvas-confetti or a tiny in-house particle burst), SFX manifest (`tick`, `lock`, `scoreRise`, `stamp`, `perfect`) with silent fallbacks when files are missing. Every effect checks `useReducedMotion` (→ static presentation) and the mute setting.

## 3. Implementation steps

1. Shared scoring lib + test vectors (server copy in `supabase/functions/_shared/`, client mirror in `src/lib/scoring.ts`).
2. `GameModule` types + registry.
3. Round state machine store + timer ticker + sessionStorage snapshots; Vitest coverage first (transitions, timer expiry, refresh resume, illegal transitions).
4. Round-flow UI shell: `RoundIntro`, `Countdown` (3-2-1 with SFX ticks), `PlayFrame` (timer ring integration), `SuspenseBeat`, `RevealFrame`, `RunSummary`.
5. Juice components + reduced-motion/mute paths.
6. Edge Functions (`start-run`, `submit-answer`, `complete-run`) + shared CORS/auth helpers; local “offline referee” fallback for env-less dev.
7. Dummy game module; wire Quick Play from Home (pick game → 5 rounds → summary).
8. XP/level: server grants XP in `complete-run`; client session store refreshes profile; level-up toast.
9. Tests: state machine suite, scoring vectors (both copies), payload-purity test (no `truth` key in `start-run` response shape), guest-flow test.

## 4. Edge cases & negative cases

| # | Case | Expected behavior |
|---|---|---|
| E1 | Timer expires with no answer | Auto-submit “no answer” → server scores 0; flow proceeds to reveal (shows truth), never hangs |
| E2 | Answer submitted at T-0ms (race with expiry) | Client locks input at expiry; server window includes small grace (+2s network allowance); double submission rejected server-side (PK on run_id+round_no) |
| E3 | Mid-round browser refresh | Resume same round with remaining time if within deadline; else that round scores 0 and flow resumes at next round |
| E4 | Refresh during reveal/interstitial | Resume at next round (snapshot stores last completed round) |
| E5 | `submit-answer` network failure | Retry with backoff (3×); on hard failure, show error state with manual retry; round not silently lost |
| E6 | Duplicate submit (double-click / retry after success) | Server rejects second write (PK conflict) and returns the original score idempotently |
| E7 | Tampered answer shape (client bypassed validate) | Edge Function re-validates shape; malformed → 400, scored 0, run continues |
| E8 | Tampered timing (client reports fake `clientTimeMs`) | Server trusts only its own timestamps for the window check; `clientTimeMs` is display-only metadata, clamped |
| E9 | Round content exhausted (fewer than 5 active rounds) | `start-run` reuses rounds with a warning in dev; never 500s |
| E10 | Unknown game slug at registry lookup | Engine shows a friendly “game unavailable” screen; no crash |
| E11 | Supabase unreachable mid-run | Offline referee fallback only in dev; in prod, error state with retry — run resumable via snapshot |
| E12 | Guest completes a run, then signs in (Epic 01 upgrade path) | v1: guest run history stays client-side and is preserved at conversion (`pendingSync` cleared); server XP for pre-conversion runs is explicitly cosmetic-only local history |
| E13 | Reduced motion + muted audio | Count-up renders final number with fade; no shake/confetti; zero Howler calls when muted |
| E14 | Zero score run (all rounds 0) | Summary renders without NaN/divide-by-zero in bar math |
| E15 | Perfect 5,000 round | Tier PERFECT, shake + confetti (unless reduced motion), correct SFX |
| E16 | Illegal state transition (e.g. SCORED while idle) | Dev: throw with transition log; prod: ignored + telemetry log |

## 5. Manual testing steps (run after Epic 02 is complete)

Prereqs: Epic 01 tests pass; schema migration applied; Edge Functions deployed (`supabase functions deploy start-run submit-answer complete-run`) or dev fallback in use.

1. **Full dummy run** — Home → Quick Play → Dummy game. ✅ Rhythm: intro card → 3-2-1 countdown (with ticks) → play with shrinking timer ring → lock-in → suspense beat → reveal (truth + score count-up + tier stamp) → running total → next round; 5 rounds then summary out of 25,000.
2. **Timer expiry** — start a round, don’t answer. ✅ At 0: input locks, “time’s up” state, reveal shows truth, score 0, flow continues.
3. **Perfect round** — dummy game lets you hit exact truth (slider to the known value). ✅ 5,000 + PERFECT stamp + shake + confetti + fanfare.
4. **Mid-round refresh** — during round 3, hit F5. ✅ App resumes round 3 with remaining time; complete the run; total is consistent.
5. **Refresh after expiry** — refresh, wait past the round deadline before the tab reloads (throttle: set a short timer). ✅ Round 3 scored 0; resume at round 4.
6. **Network inspection (truth absence)** — DevTools → Network, start a run. ✅ The `start-run` response contains only payload fields (bar target for dummy = absent!); truth appears only in the `submit-answer` *response* (post-submission). Search all responses for known truth values before submitting — zero hits.
7. **Server-authoritative check** — attempt to call `submit-answer` twice for the same round (replay from DevTools). ✅ Second call returns the original score / conflict, not a re-score.
8. **Late submission** — pause JS at the play state (DevTools breakpoint) past the timer, resume, submit. ✅ Server scores 0 (outside window).
9. **Guest run** — signed out, play a full run. ✅ Scoring still comes from the server; run history stored locally; no `runs` row in the DB for the guest (Table Editor check).
10. **Authed run persistence** — signed in, complete a run. ✅ `runs` + 5 `round_results` rows appear; `total_score` matches the summary; profile XP increased by score/100 and level-up toast fires at a threshold.
11. **Reduced motion / mute** — enable OS reduced motion + in-app mute. ✅ Reveal shows fades only, no shake/confetti, no sound; scores still legible.
12. **Vitest** — `npx vitest run`. ✅ State machine (incl. timer expiry + refresh resume), scoring vectors, payload purity all green.

## 6. Acceptance-criteria mapping

| Epic AC | Covered by |
|---|---|
| Dummy game full 5-round run with juice + server scoring, zero round-flow changes | Steps 7 + manual tests 1, 3, 10 |
| Core tables migrated with RLS; truth absent from client payloads (network test) | Schema migration (done) + step 6 + manual test 6 |
| State machine Vitest coverage incl. timer expiry + mid-round refresh | Step 3 + manual test 12 |
| Reduced-motion and muted-audio paths for every juice effect | Step 5 + manual test 11 |
