# Kern Duel — content pipeline

Full design rationale: `docs/plan/epic-03-implementation-plan.md` §2.
This file only covers the practical "how do I add a word" workflow.

## Adding a word (no code change required)

1. **Edit** `src/games/kern-duel/content/words.json`. Add an entry:
   ```json
   { "word": "Toast", "fontKey": "inter", "difficulty": 2 }
   ```
   - `word` — plain text, 3+ letters (shorter words have no movable
     letters once the first/last are locked, and are rejected).
   - `fontKey` — must exist in `src/games/kern-duel/fonts.ts`. To add a
     new typeface, add an entry there first, download its `.woff2` +
     `OFL.txt` into `public/fonts/kern-duel/`, and confirm the license is
     OFL or similarly open before shipping it (a real compliance
     requirement, not just a formality).
   - `difficulty` — `1` (easy) / `2` (medium) / `3` (hard). No strict
     rule; length and letter-pair complexity are reasonable guides.
   - `overrideOffsets` (optional) — an array of hand-set per-letter px
     offsets, same length as the word, to override the measured kerning
     for specific letters if a content author disagrees with the font's
     own table for a given word. Omit it to use the measured values.

2. **Measure.** Start the dev server (`npm run dev`) and open
   `/dev/kern-duel-measure` (dev-only route, never shipped to
   production). Click "Run measurement" — it loads every font in the
   manifest and measures each word's real kerned vs. unkerned glyph
   positions directly from the browser's font shaping (not a guess; see
   the plan §2.1 for why this is more faithful than hand-eyeballing).
   Copy the textarea's JSON output into
   `scripts/kern-duel/measured-output.json`, replacing its contents.

3. **Generate.**
   ```bash
   node scripts/kern-duel/generate-seed.mjs
   ```
   This regenerates `supabase/migrations/00000000000002_kern_duel_seed.sql`
   — a paste-ready script for the Supabase SQL Editor. Round ids are
   deterministic, so re-running this after editing one word updates that
   word's row in place; it never creates duplicates.

4. **Apply.** Run the generated SQL file in the Supabase SQL Editor (this
   repo's convention — there's no CLI migration pipeline configured).

That's the whole loop. No `.tsx`/`.ts` file under `src/games/kern-duel/`
needs to change to add, remove, or edit a word.

## Why measured kerning, not hand-typed numbers

Kern Type's own mechanic (the game this module is faithful to) is
reconstructing what the type designer already built into the font — not
chasing someone's subjective eyeball opinion. `font-kerning: none` vs.
`normal` exposes the font's real GPOS kerning pairs directly through the
browser's own text-shaping engine, so the reference solution for every
word is ground truth from the actual font, not a guess, and it's
perfectly reproducible.

## Current content

16 words across 4 open-license Google Fonts (Poppins, Playfair Display,
Inter, Merriweather) — a real, working starter set, not a placeholder.
Reaching the full 60-word/12-typeface catalog described in the epic is
pure content authoring via the steps above — no further engineering work.

## Scoring tuning

`falloffPx` in `src/games/kern-duel/scoring.ts` **and**
`supabase/functions/_shared/kernScoring.ts` (must be kept identical — the
shared test vectors fail loudly if they drift) controls how forgiving the
score curve is. It starts at a first-pass estimate; the epic's acceptance
criterion requires validating it against ≥10 human-played rounds so a
"thoughtful" attempt averages 3,000–4,000. See the implementation plan's
manual testing step 13 for the exact procedure.
