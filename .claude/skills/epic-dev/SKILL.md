---
name: epic-dev
description: >
  The end-to-end development process for implementing an epic in this repo:
  docs review -> implementation plan (with edge cases and manual testing
  steps) -> execution -> live browser verification -> wrap-up. Use this
  whenever the user asks to implement, plan, execute, build, or continue an
  epic (e.g. "implement Epic 03", "start Kern Duel", "execute the plan for
  the daily challenge"), asks for an implementation plan for any feature in
  docs/epics/, or asks to "follow the usual process" — even if they don't
  say the word "epic". Also use it when picking up a partially completed
  epic from a previous session.
---

# Epic development flow

This skill encodes the process used to ship Epics 01–02. The point of the
process: plans catch design mistakes before they're code, edge cases are
cheapest to handle when enumerated up front, and nothing counts as done
until it's been driven live in a browser — tests alone missed three real
bugs in Epic 01/02 (nested-interactive navigation, StrictMode double-mount
splitting referee state, rAF freezing in background tabs).

## Phase 0 — Read the docs (once, in order)

1. `agents.md` — rules of engagement, invariants, token discipline.
2. `docs/prd.md` — the source of truth for WHAT to build.
3. The epic file(s) in scope from `docs/epics/` — and only those. Stage
   order is mandatory (01–02 → 03–06 → 07–08); never start a stage before
   the previous stage's acceptance criteria pass, and never touch deferred
   epics (09–12).

Read each doc once and work from your plan afterwards; re-open only the
specific section you need. If code and docs conflict, docs win; if a doc is
ambiguous, flag it and propose a doc change instead of improvising scope.

## Phase 1 — Backend groundwork (only if the epic needs schema/server work)

- SQL lives in `supabase/migrations/` as paste-ready scripts (the user runs
  them manually in the Supabase SQL Editor — do not assume a CLI pipeline).
- Every table gets RLS. Round/seed content splits client-safe `payload`
  from server-only `truth`; truth-bearing tables get NO client policies.
- Defense in depth: column-level grants for server-owned fields (xp, hp,
  scores), unique constraints as anti-cheat (one daily attempt), and
  security-definer views that project only public fields for leaderboards.
- End every migration with a manual post-run checklist comment.

## Phase 2 — Write the implementation plan BEFORE any code

Create `docs/plan/epic-NN-implementation-plan.md` following
`references/plan-template.md` (read it now if writing a plan). The two
sections that earn their keep:

- **Edge cases & negative cases** — a numbered table (E1, E2, …) of
  failure modes with expected behavior. Number them so code comments and
  tests can cite them (`// plan edge case E7`). Think: missing env/config,
  corrupted local state, network failure mid-flow, duplicate/late/tampered
  submissions, refresh at every stage, reduced-motion, keyboard-only.
- **Manual testing steps** — numbered steps a human can follow after the
  epic completes, each with a ✅ expected result. These are the user's
  acceptance script; write them as real click-paths, not vague goals.

Close with an AC-mapping table: every `AC:` line from the epic file mapped
to the plan steps and manual tests that cover it. An AC with no row means
the plan is incomplete.

## Phase 3 — Execute

Build in dependency order: shared libs → state stores → UI components →
pages/wiring → server functions → tests. Typecheck (`npx tsc --noEmit`)
after each layer, not just at the end — errors compound.

Non-negotiable invariants (from the PRD; verify in code review before
moving on):

- Scoring is server-authoritative: clients submit answers, Edge Functions
  compute scores. The client scoring mirror is display-only, pinned to the
  server copy by shared test vectors.
- Truth data never reaches the client pre-submission — not in payloads,
  DOM, CSS, or network responses. Make it structural: wire types that
  cannot represent truth, plus a payload-purity test.
- The app must boot without Supabase env vars (null-safe client, guest
  mode, dev-only offline fallback that logs itself).
- Every juice effect has reduced-motion and muted paths; every control is
  keyboard-operable with a visible focus ring; touch targets ≥ 44px.
- Never nest interactive elements (no button inside a Link — it swallows
  navigation and breaks a11y; use useNavigate).
- Timers use absolute deadlines (epoch ms) with rAF for smoothness PLUS a
  coarse setInterval fallback — rAF pauses entirely in background tabs.
- Assume React StrictMode double-mounts: boot effects must be idempotent
  and stateful singletons must live at module level, not in useMemo.

Colocate Vitest tests (`*.test.ts`) as you build each layer, covering the
numbered edge cases from the plan by ID.

## Phase 4 — Verify (tests are necessary, not sufficient)

1. `npx vitest run` — all green, including the plan's edge-case tests.
2. `npm run build` — typecheck + production build clean.
3. **Drive the real app in the browser** (preview_start + the browser
   tools): walk the primary flow end-to-end exactly as a player would,
   then exercise the top edge cases live — refresh mid-flow, let timers
   expire, inspect network responses for truth leakage. Read the a11y
   tree, not just screenshots.
4. Fix what you find, re-run 1–3. Do not skip re-verification after a fix.

## Phase 5 — Wrap up

- Update the README status section (what's implemented, how to set up).
- Report per-AC status honestly; an epic is not complete while any AC is
  unmet — say which ones need the user's manual steps (e.g. running SQL,
  deploying Edge Functions, enabling auth providers) and list those steps.
- Point the user at the plan's Manual testing steps section as their
  acceptance script.
- Leave the repo resumable from `docs/` + git log alone.

## Session mechanics in this environment

- The GateGuard hook blocks the FIRST Write/Edit of each file and the first
  Bash call: state the facts it asks for (importers via Grep, affected API,
  the user's verbatim instruction), then retry the identical call — the
  retry passes.
- Bash commands get truncated above roughly 7KB (rtk hook). Write files via
  heredocs under ~6KB per call; split bigger files into `cat >` then
  `cat >>` parts. Avoid giant multi-file compound commands.
- Prefer `rtk`-proxied commands for git/test output per agents.md.
