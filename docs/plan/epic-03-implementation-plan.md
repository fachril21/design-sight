# Epic 03 — Kern Duel (game module): Implementation plan

**Source docs:** `docs/prd.md` §5.1, §8.2, §8.4, §10 · `docs/epics/epic-03-kern-duel.md`
**Depends on:** Epic 02 (game engine core, done) · **Blocks:** nothing (Stage 2 epics are parallelizable)

---

## 1. Scope

The flagship kerning game, built as a `GameModule` on top of the Epic 02
round-flow engine: drag-and-keyboard letter positioning, server-authoritative
scoring against a real reference kerning solution, a ghost-overlay reveal,
and a repeatable content-authoring pipeline.

**Out of scope:** Contrast Call / Color Match / Type Snob (Epics 04–06,
parallel games — not touched); Daily Challenge and Duels (Stage 3, depend
on this epic's content existing but not its code); font subsetting/build
optimization beyond "lazy-load the one font a round needs" (flagged as a
follow-up, not a blocker); an admin GUI for content authoring (the epic
text explicitly allows "script or admin sheet" — this plan builds the
script path); hand-authoring the full 60-word/12-typeface catalog (see
§2.4 — this plan ships the pipeline plus a smaller real starter set).

## 2. Architecture decisions

### 2.1 Truth source: measure real font kerning, don't hand-guess it

Kern Type's own mechanic (the model this game is faithful to) is: you're
reconstructing what the type designer already built into the font's
kerning table, not chasing someone's subjective eyeball opinion. Browsers
expose this directly via the CSS `font-kerning` property — `none` renders
each glyph at its raw advance width (letters butted together with no
pair-adjustment), `normal` applies the font's real GPOS kerning pairs.

So: for each round, `naturalPositions[i]` (unkerned cumulative x per
letter) ships in the client-safe `payload` as the puzzle's starting
layout — it's not a secret, it's just "the word before you touch it."
`truth.offsets[i] = kernedPositions[i] - naturalPositions[i]`, computed
once at content-authoring time from the real font, stored server-only.
This is ground truth from the font itself, not a guess, and it's fully
repeatable (same word + font always measures the same).

**Doc ambiguity flagged:** the epic text says "hand-set reference
solutions." This plan treats "measured from the font's real kerning
table" as satisfying that intent (it's *more* faithful to Kern Type's
actual design than manual eyeballing would be), while still letting a
content author override any word's offsets by hand via an optional
`overrideOffsets` field in the content source — so "hand-set" stays
possible without being mandatory. Flagging this interpretation rather
than silently assuming it, per `agents.md` §2.

### 2.2 Scoring: mean per-letter deviation, not raw sum

PRD 5.1 says "sum of per-letter deviation... mapped through exponential
falloff... perfect within ±1px per letter = 5,000." Read literally, sum +
a flat 1px tolerance breaks for any word with 2+ movable letters (two
letters each 0.9px off already sums past a 1px tolerance, contradicting
"±1px per letter = perfect"). The self-consistent reading — the one that
actually delivers "perfect within ±1px per letter" regardless of word
length — is **mean absolute deviation across movable letters**, with a
flat 1px tolerance:

```
deviation = mean(|answerOffset[i] - truthOffset[i]|) over movable i
score = exponentialFalloff(deviation, tolerancePx=1, falloffPx=8)
```

`tolerancePx=1` matches the value already seeded into `games.config` for
kern-duel in the Epic 01 migration (`perfectTolerancePx: 1`) — kept
consistent rather than re-fetched at score time, to avoid a DB round trip
on the hot scoring path (documented inline where hardcoded).

`falloffPx=8` is a **first-pass estimate**, not a validated constant: it's
solved so a "thoughtful" attempt (~3px effective deviation after
tolerance) lands near 3,500. The epic's own AC requires validating this
against ≥10 human-played rounds — that's a human-judgment task no amount
of code can substitute for, so it's the centerpiece of §6's manual test
script, with a one-line tuning note (raise `falloffPx` → higher scores
for the same miss distance; lower it → harsher).

This module reuses the shared `exponentialFalloff`/`tierForScore` helpers
from Epic 02 (`_shared/scoring.ts` / `src/lib/scoring.ts`) — no new curve
math, just a new deviation calculation feeding the same curve.

### 2.3 Interaction model

- Each letter is a real `<button>` in a relatively-positioned row, moved
  via CSS `transform: translateX(natural + offset)`. Locked first/last
  letters render as non-interactive (no drag handlers, `tabIndex={-1}`,
  visually dimmed border) — matches "first and last letters are locked."
- **Drag:** Pointer Events (`onPointerDown/Move/Up` + `setPointerCapture`)
  unify mouse and touch in one handler — no separate touch listeners.
- **Keyboard:** native Tab/Shift-Tab traversal across real `<button>`
  elements (movable letters have `tabIndex=0`) — this is Kern Type parity
  for free, no custom roving-tabindex code needed. A focused letter
  handles `ArrowLeft`/`ArrowRight` (±1px, `preventDefault`) and
  `Shift+Arrow` (±10px); `Enter` submits the whole round regardless of
  which letter has focus (global keydown scoped to the play component).
- **Touch targets:** each letter button gets a `min-width/min-height:
  44px` hit area via padding, independent of the glyph's own visual
  width — narrow letters (i, l) still meet the 44px AC without distorting
  the pixel-precise position math (hit-box is a CSS affordance layered on
  top of the transform, not part of it).
- Offsets are clamped to `[minOffsetPx, maxOffsetPx]` from the payload so
  a letter can't be dragged off-canvas or past a neighbor into an
  unreadable pile.
- Reveal renders a translucent ghost of the word at the truth positions
  sliding to overlay the player's attempt, plus a small colored deviation
  tick under each letter (tier-colored via the existing
  `--ds-tier-*` tokens). Reduced motion drops the slide, showing both
  states directly overlaid with no transition.

### 2.4 Content pipeline (US3.2)

Three-step, fully repeatable, zero app-code changes to add a word:

1. **Author** edits `src/games/kern-duel/content/words.json` — plain data:
   `{ word, fontKey, difficulty, overrideOffsets? }`.
2. **Measure** — a dev-only route (`/dev/kern-duel-measure`, registered
   only under `import.meta.env.DEV`, never in the production build) loads
   each configured font, renders each word off-screen with
   `font-kerning: none` vs `normal` (and `font-variant-ligatures: none`,
   so ligatures like "fi" can't collapse two letters into one glyph and
   break index-based positioning), measures cumulative glyph positions via
   `getBoundingClientRect`, and outputs one JSON blob covering every word.
   This step is run once per content batch (by whoever is authoring
   content) against the real running dev server — it uses actual browser
   font-shaping, not a guess.
3. **Generate** — `node scripts/kern-duel/generate-seed.mjs` merges
   `words.json` + the measurement output into a deterministic SQL file
   (`supabase/migrations/00000000000002_kern_duel_seed.sql`), using
   `uuid_generate_v5(namespace, word || ':' || fontKey)` for the round id
   so re-running the pipeline after an edit **updates** that word's row
   (`ON CONFLICT (id) DO UPDATE`) instead of duplicating it.

This repo's convention is that the user runs migration SQL manually in
the Supabase SQL Editor (no CLI pipeline configured) — the generated file
follows that same paste-ready pattern as the Epic 01 migration, and is a
new file (schema-additive: enables `uuid-ossp`, does not touch existing
tables).

**Starter content set for this execution pass:** ~16 words across 4 open-
license Google Fonts (Poppins, Playfair Display, Inter, Merriweather),
chosen for classic kerning-pair difficulty (AV/AW/To/Ty/Fi pairs). This
proves every seam of the pipeline with real, non-fabricated data. Scaling
to the full 60-word/12-typeface catalog described in the epic is pure
content authoring afterward — step 1 only, no code — and is explicitly
**not** completed by this plan; see §6.

### 2.5 Fonts

Self-hosted per `agents.md` §4 (`public/fonts/`), `.woff2`, one
`@font-face` per family, lazy-loaded via the CSS Font Loading API only
when a kern-duel round actually needs that family (matches the NFR:
"assets lazy-loaded per game"). Each font ships its OFL license text
alongside it (`public/fonts/kern-duel/LICENSE-<family>.txt`) for license
compliance — a genuine content-review requirement, not just a code one.

## 3. Deliverables & file map

| Area | Files |
|---|---|
| Schema | `supabase/migrations/00000000000002_kern_duel_seed.sql` |
| Server scoring | `supabase/functions/_shared/kernScoring.ts`; edit `supabase/functions/submit-answer/index.ts` (register `kern-duel` in `SCORERS`) |
| Client scoring mirror | `src/games/kern-duel/scoring.ts`, `src/games/kern-duel/scoring.test.ts` |
| Types | `src/games/kern-duel/types.ts` |
| Fonts | `src/games/kern-duel/fonts.ts`; `public/fonts/kern-duel/*.woff2` + `LICENSE-*.txt` |
| Rendering/interaction | `src/games/kern-duel/LetterRail.tsx`, `KernDuelPlay.tsx`, `KernDuelReveal.tsx` |
| Module + registry | `src/games/kern-duel/index.tsx`; edit `src/games/registry.ts`; edit `src/pages/Home.tsx` (`ready: true`) |
| Content pipeline | `src/games/kern-duel/content/words.json`; `src/pages/dev/KernDuelMeasure.tsx` + dev-only route in `App.tsx`; `scripts/kern-duel/generate-seed.mjs` |
| Docs | `src/games/kern-duel/README.md` (content pipeline, per US3.2 AC), this plan |
| Tests | `scoring.test.ts`, `payloadPurity.test.ts` extension for kern-duel fixtures |

## 4. Implementation steps

1. Schema: `uuid-ossp` extension + placeholder migration structure (content inserted after step 6 generates it).
2. Shared scoring (`kernScoring.ts` server + `scoring.ts` client mirror) + test vectors — write and pass before anything depends on it.
3. Types + fonts manifest + `LetterRail` (pure positioning/rendering, no interaction yet) — verify layout renders correctly for a hardcoded sample word before adding interaction.
4. `KernDuelPlay` — drag, keyboard, clamping, submit — on top of `LetterRail`.
5. `KernDuelReveal` — ghost overlay + deviation ticks, reduced-motion path.
6. Content pipeline: `words.json` → dev measurement route → run it live against the dev server via the browser tool → `generate-seed.mjs` → the real migration SQL.
7. Wire `submit-answer`'s `SCORERS['kern-duel']`, register the module, flip `Home.tsx`.
8. Tests colocated per step (scoring vectors, payload purity extension).

## 5. Edge cases & negative cases

Engine-level edge cases from Epic 02 (timer expiry, mid-round refresh,
duplicate submit, tampered timing, reduced motion, offline dev fallback)
already apply generically via `RoundFlow` — not re-litigated here. This
table covers what's specific to Kern Duel's input model and content
pipeline.

| # | Case | Expected behavior |
|---|---|---|
| K1 | Font fails to load (404 / slow 4G) | After a short load timeout, fall back to a system font so the round stays playable (visually different, never blank/invisible) |
| K2 | Word contains a glyph outside the font's coverage | Content generator validates glyph coverage at seed time and errors loudly; Play never crashes on a missing glyph (worst case: tofu box) |
| K3 | Word with < 3 letters | Zero movable letters (both are locked) — the round would be meaningless. `generate-seed.mjs` rejects any word < 3 letters with a clear error, not a silent bad round |
| K4 | Letter dragged toward/past a neighbor or off-canvas | Offset clamped to `[minOffsetPx, maxOffsetPx]` from payload; never renders off-screen or lets one letter fully invert past another |
| K5 | Two letters end up at the same visual x (legal but ugly attempt) | Allowed — it's just a bad answer, not a blocked state |
| K6 | Keyboard nudge at a clamp boundary | Silently clamps, no error, no visual glitch |
| K7 | Submitting with every offset untouched (0) | Scores normally (likely poor) — this is a real, valid answer, not the same as "no answer" (timer expiry) |
| K8 | Word has repeated letters (e.g. "LETTER") | Offsets are keyed by **index**, never by character — repeated glyphs must not share state |
| K9 | Ligature-prone letter pairs (e.g. "fi", "fl") | `font-variant-ligatures: none` forced in both the measurement step and live rendering, so a ligature can never merge two indices into one glyph |
| K10 | `words.json` has a duplicate `(word, fontKey)` entry | `generate-seed.mjs` fails loudly with the duplicate identified, not a silent drop or silent overwrite |
| K11 | `generate-seed.mjs` runs against a stale measurement file missing a configured word | Fails loudly naming the missing entry — never emits `null`/`undefined` offsets into SQL |
| K12 | Re-running the full pipeline after editing one word | That word's row updates in place (`ON CONFLICT ... DO UPDATE` on the deterministic `uuid_generate_v5` id) — no duplicate rows, no orphaned old row |
| K13 | Font shipped without its OFL license text | Treated as a genuine content-review failure (checklist item in the module README), not just a legal footnote |
| K14 | Rapid pointermove events while dragging | Cheap enough at 3–9 letters to update per-event; documented as a non-issue at this content scale, not silently ignored |
| K15 | Network response inspection for the kern-duel round specifically | `start-run` response must contain `naturalPositions` but never `truthOffsets`/`kernedPositions` — a dedicated fixture extends `payloadPurity.test.ts` beyond the dummy game's shape |
| K16 | Mobile viewport, no keyboard available | Full round completable via touch drag alone; explicit "Lock it in" button always present (Enter-to-submit is a keyboard *addition*, never the only path) |

## 6. Manual testing steps (run after the epic is complete)

**Prereqs:**
1. Run `supabase/migrations/00000000000002_kern_duel_seed.sql` in the
   Supabase SQL Editor (adds `uuid-ossp`, seeds the starter word set).
2. Redeploy the `submit-answer` Edge Function (it now scores kern-duel,
   not just the dummy game): `supabase functions deploy submit-answer`.
3. `npm run dev`.

**Functional walkthrough:**
1. Home page — Kern Duel card now shows "Play 5 rounds" instead of
   "Locked." ✅
2. Start a run, reach round 1. ✅ The word renders in its real self-hosted
   typeface (not a system-font fallback) with letters at their natural
   (unkerned) positions.
3. Drag a movable letter with the mouse. ✅ It moves smoothly, clamps
   before overlapping a neighbor or leaving the visible row; first/last
   letters do not respond to drag.
4. Tab through the word. ✅ Focus visits only movable letters, in order,
   with a visible focus ring; locked letters are skipped.
5. With a letter focused: press → / ←. ✅ Nudges ±1px. Press Shift+→ /
   Shift+←. ✅ Nudges ±10px. Push a letter to its clamp boundary and nudge
   again. ✅ No error, position holds.
6. Press Enter. ✅ Submits immediately regardless of which letter has
   focus.
7. Reveal — ✅ ghost overlay of the reference solution slides onto your
   attempt (or appears directly, reduced motion below), per-letter
   deviation ticks colored by tier, score and tier stamp shown.
8. **Network inspection** — DevTools → Network, start a fresh run. ✅ The
   `start-run` response for kern-duel rounds contains `naturalPositions`
   only; search the response for any offset/position values that later
   turn out to be the truth — zero hits before you submit.
9. **Reduced motion** — enable OS reduced motion, replay a round. ✅ Reveal
   shows both attempt and reference directly overlaid, no slide, ticks
   still legible.
10. **Mobile viewport** — resize to a mobile width. ✅ Drag works via touch
    emulation, every letter's tap target feels ≥44px even for narrow
    letters, the explicit "Lock it in" button is present and works
    without ever touching the keyboard.
11. **Timer expiry** — start a round, don't touch anything, let it expire.
    ✅ Auto-submits the untouched (all-zero-offset) state, scores
    accordingly, reveal still shows correctly.
12. **Font load failure** — throttle/block the font request in DevTools
    for one round. ✅ Word still renders (fallback font), round still
    completable, never a blank word.
13. **Scoring tuning (the actual AC)** — play at least 10 full rounds
    across different words/fonts, recording each round's score. ✅ Average
    lands roughly in the 3,000–4,000 band for attempts you'd call
    "thoughtful but imperfect." If it's consistently off, adjust
    `falloffPx` in `src/games/kern-duel/scoring.ts` **and**
    `supabase/functions/_shared/kernScoring.ts` together (they must stay
    identical — the shared test vectors will fail loudly if they drift),
    redeploy `submit-answer`, and repeat.
14. `npx vitest run` — ✅ kern-duel scoring vectors and the extended
    payload-purity fixture pass.

## 7. Acceptance-criteria mapping

| Epic AC | Covered by |
|---|---|
| Playable on desktop and mobile (touch targets ≥ 44px) | §2.3, §4 steps 3–4 · manual tests 3–6, 10 |
| Scoring falloff tuned so a thoughtful attempt averages 3,000–4,000 (≥10 human-played rounds) | §2.2 (first-pass constant) · manual test 13 — **requires the user's own playtesting; not verifiable by automated tests** |
| Reference positions absent from all client-visible data before submission | §2.1, §4 step 2 · manual test 8, K15, `payloadPurity.test.ts` extension |
| Content pipeline documented in the module README; adding a word requires no code change | §2.4, `src/games/kern-duel/README.md` · K10–K12 |

**Note on scope honesty:** this plan and its execution ship a real,
working pipeline and a genuine (if smaller) starter content set — not the
full 60-word/12-typeface catalog the epic describes. Reaching that count
is pure content authoring (step 1 of §2.4, repeatable, no code), left as
follow-up work rather than fabricated to hit a number. The scoring-tuning
AC is explicitly a human-judgment task; this plan cannot mark it done on
your behalf, only make it fast and repeatable to validate.
