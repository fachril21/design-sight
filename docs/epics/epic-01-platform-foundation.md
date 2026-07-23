# Epic 01 — Platform foundation & design system

**Stage:** 1 (Foundation) · **Status:** In scope · **Depends on:** nothing · **Blocks:** all other epics

## Goal
Scaffold, deploy pipeline, auth, and the visual identity that makes everything feel like a game — before any game exists.

## User stories

- **US1.1** As a developer, I can clone, run, and deploy the app: Vite + React 18 + TypeScript (strict) + Tailwind, Supabase project wired, CI to Vercel/Cloudflare Pages with preview deploys per branch.
- **US1.2** As a player, the app instantly feels like a game, not a SaaS tool: arcade-style design tokens (bold display type, saturated palette, chunky shadows/borders), animated buttons with press states and SFX hooks, page transitions via Framer Motion.
- **US1.3** As a player, I can sign up / sign in (magic link + Google OAuth) or play as a guest, and later upgrade my guest progress to an account without losing runs.

## Acceptance criteria
- Lighthouse performance ≥ 85 on mobile for the shell.
- Auth + guest flow works end-to-end, including guest→account upgrade preserving local run history.
- A component gallery page (`/gallery`) shows all core UI primitives with motion and sound.
- `prefers-reduced-motion` collapses all transitions to fades in the gallery.

## Implementation notes
- Design tokens live in `src/styles/`; SFX manager stub in `src/audio/` (real sounds arrive with Epic 02 juice work).
- Supabase schema starts with `profiles` only; the rest arrives with Epic 02.
