# Design Sight

A gamified, web-based skill-training platform for UI/UX designers — kerning duels, contrast calls, color matching, and typeface identification, with GeoGuessr-style scoring, daily challenges, and live 1v1 duels.

## For coding agents

Read `agents.md` first. It defines the required documentation reading order (`docs/prd.md` → `docs/epics/`), the token-efficiency rules (RTK), stack conventions, and the non-negotiable invariants (server-authoritative scoring, RLS, no truth data on the client pre-submission).

## Repository layout

```
agents.md               Agent guidelines — read first
docs/
  prd.md                Product requirements (source of truth for WHAT to build)
  epics/                One file per epic; defines staging (WHEN to build it)
src/                    Frontend (React + Vite + TS) — empty until Epic 01
supabase/               Migrations + Edge Functions — empty until Epic 01/02
public/                 Self-hosted fonts and SFX assets
```

## Status

Epics 01–03 implemented (see `docs/plan/` for the implementation plans and per-epic manual testing steps):

- **Epic 01** — Vite + React 18 + TS scaffold, arcade design system (`/gallery`), Supabase auth (magic link + Google) with guest mode and guest→account upgrade. The app boots without Supabase env vars (guest-only, dev offline referee).
- **Epic 02** — `GameModule` framework, round-flow state machine with refresh recovery, juice layer (count-up, tier stamps, shake, confetti, SFX manifest), server-authoritative Edge Functions (`start-run`, `submit-answer`, `complete-run`), and the "Pixel Guess" dummy game proving the pipeline.
- **Epic 03** — Kern Duel: drag + full keyboard letter kerning, ghost-overlay reveal, a content pipeline that measures real font kerning tables (see `src/games/kern-duel/README.md`), and a 16-word starter catalog across 4 self-hosted open-license fonts. The scoring falloff constant is a first-pass estimate pending the human playtest validation described in the epic's own AC — see `docs/plan/epic-03-implementation-plan.md` §6, manual test 13.

Setup: `npm install && npm run dev`. To wire the backend: run `supabase/migrations/00000000000001_initial_schema.sql` **and** `supabase/migrations/00000000000002_kern_duel_seed.sql` in the Supabase SQL Editor (in that order), deploy the three Edge Functions (`start-run`, `submit-answer`, `complete-run`), and copy `.env.example` to `.env.local`.
