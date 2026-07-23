# agents.md — Design Sight

Guidelines for any coding agent (Claude Code, Codex, Cursor, etc.) working in this repository. Read this file first, then follow the documentation workflow below before writing any code.

---

## 1. What this project is

Design Sight is a web-based, gamified skill-training platform for UI/UX designers: four launch games (Kern Duel, Contrast Call, Color Match, Type Snob), a shared 0–5,000 distance-from-truth scoring system, a daily challenge, and live 1v1 duels. Benchmark experience: GeoGuessr. Everything runs on free-tier infrastructure (Supabase + Vercel/Cloudflare Pages).

## 2. Required reading order (before planning or coding)

1. `docs/prd.md` — vision, scoring model, game specs, modes, architecture, data model, NFRs, risks. This is the source of truth for **what** to build.
2. `docs/epics/` — one file per epic, in numeric order. Epics define **staging**: Stage 1 (epics 01–02) → Stage 2 (03–06, parallelizable) → Stage 3 (07–08) → post-launch (09–12, do not build unless asked).
3. Only after reading the PRD and the epic(s) in scope: write an implementation plan, get it confirmed if a human is in the loop, then execute.

Rules of engagement with the docs:

- Work **one epic at a time**, in stage order, unless explicitly told otherwise. Do not start Stage 2 before Epic 02's acceptance criteria pass, because every game module depends on the `GameModule` framework it delivers.
- Acceptance criteria (the `AC:` lines) are the definition of done. Do not mark an epic complete while any AC is unmet.
- If code and docs conflict, the docs win; if a doc is ambiguous or seems wrong, flag it and propose a doc change — do not silently improvise scope.
- Post-launch epics (09–12) are intentionally unscoped. Never partially implement them "while you're in there."

## 3. Token-efficiency rules (RTK)

This project assumes [RTK](https://github.com/rtk-ai/rtk) (`rtk`) is installed as the CLI proxy that compresses command output before it reaches your context. Verify it once at session start with `rtk --version`; if the shell hook is installed (`rtk init -g`), your Bash commands are rewritten automatically and you don't need to do anything special.

- If the hook is **not** active, prefix shell commands manually: `rtk git status`, `rtk git diff`, `rtk npm test`, `rtk npx vitest run`, `rtk ls`, `rtk cat <file>`.
- Agent-native file tools (Read/Grep/Glob) bypass the Bash hook. For large files or broad searches, prefer `rtk read <file>`, `rtk grep <pattern> .`, and `rtk find "*.tsx" .` over native tools so output is compressed.
- If `rtk` is genuinely unavailable, fall back to manual discipline: `git status --short`, `git diff --stat` before full diffs, `head`/`sed -n` ranges instead of whole-file cats, and test runners in quiet/reporter-minimal mode.

General context discipline (applies with or without RTK):

- Read files **selectively**: targeted line ranges and greps, not whole-directory dumps. Never cat `package-lock.json`, `node_modules`, build output, or font/audio binaries.
- Read each doc **once per session** and rely on your plan afterwards; re-open only the specific section you need.
- Keep diffs surgical: change what the task requires, don't reformat untouched code (formatting churn burns tokens on review and pollutes `git diff`).
- When tests fail, re-run only the failing spec file, not the whole suite.
- Summarize long command output in your reasoning instead of quoting it back.

## 4. Tech stack and conventions

- **Stack:** React 18 + Vite + TypeScript (strict), Tailwind CSS, Zustand, Framer Motion + GSAP core, Howler.js, Supabase (Auth, Postgres + RLS, Realtime, Edge Functions in Deno/TS), hosted on Vercel or Cloudflare Pages. Do not add a game engine (Phaser/Pixi) — v1 games are SVG/DOM by design.
- **Directory layout:**
  - `src/components/` — shared UI primitives (arcade design system)
  - `src/games/<slug>/` — one folder per game module implementing the `GameModule` interface (see Epic 02)
  - `src/state/` — Zustand stores (round flow, duel state machine, session)
  - `src/lib/` — Supabase client, scoring/color/typography utilities, seed types
  - `src/audio/` — Howler SFX manager and sound manifests
  - `src/styles/` — Tailwind config extensions, design tokens
  - `supabase/migrations/` — SQL migrations (schema in PRD §8.2)
  - `supabase/functions/` — Edge Functions (seed generation, scoring, duel orchestration)
  - `public/fonts/`, `public/sfx/` — self-hosted subset fonts and audio assets
- **Non-negotiable invariants (from the PRD):**
  - Scoring is **server-authoritative** in competitive modes: clients submit answers, Edge Functions compute scores. Never trust a client-reported score.
  - Reference/truth data (kerning solutions, target ratios, typeface names) must never reach the client before submission — not in payloads, DOM, CSS, or network-visible font names.
  - Row Level Security on every table; players read their own results and public leaderboard views only.
  - `prefers-reduced-motion` must be honored everywhere juice is added; full keyboard playability is a launch requirement, not a nice-to-have.
- **Style:** functional React components, hooks over classes, named exports, colocated tests (`*.test.ts`) with Vitest. Explain non-obvious math (ΔE2000, WCAG luminance, score falloff curves) with a comment linking the PRD section.

## 5. Environment and secrets

- Supabase URL/anon key live in `.env.local` (never committed); service-role keys exist **only** in Edge Function environment config, never in client code.
- Free-tier budgets are a real constraint (PRD §10): duels must stay round-synced (~15 Realtime messages per duel), assets lazy-loaded per game.

## 6. Definition of a good session

Plan from the docs → implement the smallest vertical slice that satisfies an AC → run targeted tests through rtk → summarize what changed and which ACs now pass → stop. Leave the repo in a state where the next agent can resume from `docs/` and `git log` alone.
