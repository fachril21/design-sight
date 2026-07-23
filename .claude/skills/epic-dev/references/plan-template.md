# Implementation plan template

Create as `docs/plan/epic-NN-implementation-plan.md`. Sections in order;
keep the whole plan skimmable — tables over prose where possible.

---

# Epic NN — <Name>: Implementation plan

**Source docs:** `docs/prd.md` §<sections> · `docs/epics/epic-NN-<slug>.md`
**Depends on:** <epics> · **Blocks:** <epics>

## 1. Scope

What this epic delivers, in one paragraph. Then an explicit **Out of
scope** list — name the adjacent work you are deliberately NOT doing and
which epic owns it. This is what prevents scope creep mid-execution.

## 2. Deliverables & file map

| Area | Files |
|---|---|
| <layer> | <paths, comma-separated> |

Every file the epic will create or touch. If you can't name the files yet,
the design isn't done.

## 3. Implementation steps

Numbered steps in dependency order (libs → state → UI → wiring → server →
tests). Each step names its files and any design decision it locks in.
Record non-obvious architecture decisions here (with the "why") so code
comments can reference the plan instead of re-arguing.

## 4. Edge cases & negative cases

| # | Case | Expected behavior |
|---|---|---|
| E1 | <failure mode> | <what the user experiences; never a crash> |

Number every case — tests and code comments cite them by ID. Prompts for
coverage: missing config/env, corrupted persisted state, network failure
mid-operation and on retry, duplicate submission, late/tampered input,
browser refresh at EVERY stage of a flow, background tab, localStorage
unavailable, zero/perfect boundary values, unknown route params,
reduced-motion, keyboard-only, multi-tab auth changes.

## 5. Manual testing steps (run after the epic is complete)

Prereqs first (env, migrations, deployed functions). Then numbered steps a
human follows by clicking, each ending in "✅ <observable expected
result>". Include the negative paths (expired links, replayed requests,
DevTools network inspection for truth leakage), not just the happy path.
This section is the user's acceptance script — write it so someone who
didn't build the feature can run it.

## 6. Acceptance-criteria mapping

| Epic AC | Covered by |
|---|---|
| <AC text> | Step N + manual test M |

Every `AC:` line from the epic file gets a row. No row = plan incomplete.
