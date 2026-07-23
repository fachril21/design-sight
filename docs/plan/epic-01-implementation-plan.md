# Epic 01 — Platform foundation & design system: Implementation plan

**Source docs:** `docs/prd.md` §8, §10 · `docs/epics/epic-01-platform-foundation.md`
**Depends on:** nothing · **Blocks:** all other epics

---

## 1. Scope

Deliver the app shell: Vite + React 18 + TypeScript (strict) + Tailwind scaffold, arcade design system with a `/gallery` showcase, Supabase wiring, auth (magic link + Google OAuth), guest mode with guest→account upgrade, and reduced-motion support. No games yet.

**Out of scope:** round flow, scoring, Edge Functions (Epic 02); any game module (Epics 03–06); CI/deploy pipeline config beyond a build that passes locally (Vercel/CF Pages hookup is a dashboard task).

## 2. Deliverables & file map

| Area | Files |
|---|---|
| Scaffold | `package.json`, `vite.config.ts`, `tsconfig.json` (strict), `index.html`, `tailwind.config.ts`, `postcss.config.js`, `.env.example` |
| Design tokens | `src/styles/tokens.css` (CSS custom properties), Tailwind theme extension |
| UI primitives | `src/components/ui/` — `ArcadeButton`, `SurfaceCard`, `Badge`, `TimerRing` (visual only), `ScoreDisplay` (static), `Modal`, `Input` |
| Motion | `src/lib/motion.ts` (shared variants), `src/hooks/useReducedMotion.ts` |
| Audio stub | `src/audio/sfx.ts` — SFX manager API (`play(name)`, `setMuted`) that no-ops without loaded sounds |
| Supabase | `src/lib/supabase.ts` — null-safe client (app runs without env vars in guest-only mode) |
| Auth | `src/state/session.ts` (Zustand), `src/components/auth/` — `AuthModal` (magic link + Google), guest identity, upgrade flow |
| Guest storage | `src/lib/guestStorage.ts` — versioned localStorage for guest runs |
| Routing/pages | `src/App.tsx`, `src/pages/Home.tsx`, `src/pages/Gallery.tsx`, `src/pages/AuthCallback.tsx` |

## 3. Implementation steps

### Step 1 — Scaffold
1. Hand-write the Vite config into the existing repo (the directory is non-empty, so no `npm create vite`): React 18.3, TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`), path alias `@/ → src/`.
2. Dependencies: `react`, `react-dom`, `react-router-dom`, `zustand`, `framer-motion`, `gsap`, `howler`, `@supabase/supabase-js`; dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` (v3.4 — stable config-file API for tokens), `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `jsdom`.
3. `.env.example` documents `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; `.gitignore` already covers `.env.local`.

### Step 2 — Design tokens & Tailwind theme
- Arcade direction (per PRD "feels like a game"): saturated palette on a dark stage — electric violet primary, hot coral accent, lime success, amber warning; chunky 3-4px borders; hard offset shadows (`4px 4px 0`); display font `Archivo Black` (system fallback), body `Inter`/system-ui. Fonts self-hosted later (Epic 06 does font subsetting); v1 uses system-safe stacks to keep the shell fast.
- Tokens as CSS custom properties in `src/styles/tokens.css`, mapped into `tailwind.config.ts` (`colors.arcade.*`, `boxShadow.chunk`, `fontFamily.display`).
- Score-tier colors defined now (used by Epic 02 tier stamps): `perfect`, `great`, `good`, `rough`.

### Step 3 — UI primitives + motion + SFX hooks
- Every interactive primitive: hover / focus-visible / active (pressed = translate down + shadow collapse) states, ≥44px touch targets, and calls `sfx.play('press')` (no-op stub until Epic 02 loads real sounds).
- `useReducedMotion` hook gates all Framer Motion variants: full spring/scale motion → simple opacity fades when `prefers-reduced-motion: reduce`.
- Page transitions via a `<PageTransition>` wrapper with `AnimatePresence`.

### Step 4 — Supabase client (null-safe)
- `getSupabase()` returns a configured client or `null` when env vars are absent. All auth UI degrades: "Sign in unavailable — running in guest mode" rather than crashing. This is a hard requirement so the repo runs before the user provisions Supabase.

### Step 5 — Session store + guest identity
- `src/state/session.ts` (Zustand): `{ status: 'loading' | 'guest' | 'authed', user, profile, guestId }`.
- Guest identity: a `crypto.randomUUID()` stored in localStorage (`ds_guest_id`), created lazily on first play intent.
- Subscribes to `supabase.auth.onAuthStateChange`; fetches the `profiles` row after sign-in (created automatically by the DB trigger from the schema migration).

### Step 6 — Auth flows
- `AuthModal`: email input → `signInWithOtp` (magic link) with resend cooldown (60s) + success state; "Continue with Google" → `signInWithOAuth` redirect; "Play as guest" escape hatch.
- `/auth/callback` route parses the redirect, shows a spinner, handles error query params (expired/invalid link), then routes home.
- **Guest→account upgrade:** on first sign-in, if `ds_guest_runs` exist in localStorage, upsert them via the (future, Epic 02) sync path; for Epic 01 the upgrade preserves the local history under the account namespace and marks it `pendingSync: true`. The AC is "preserving local run history" — actual server persistence of runs arrives with Epic 02's run APIs.

### Step 7 — Gallery page (`/gallery`)
- Sections: tokens (palette, type scale, shadows), buttons (all variants + press SFX), cards, badges, timer ring animation, score display, modal, auth modal trigger, motion showcase (a replayable transition), reduced-motion status indicator.

### Step 8 — Verification
- `npm run build` clean; `npx tsc --noEmit` clean; Vitest smoke tests (session store, guest storage round-trip, reduced-motion hook).

## 4. Edge cases & negative cases

| # | Case | Expected behavior |
|---|---|---|
| E1 | No `.env.local` (Supabase unconfigured) | App boots, guest play available, auth UI shows a friendly "not configured" state; zero console crashes |
| E2 | Invalid/expired magic link (`error` in callback URL) | Callback page shows the error + "request a new link" path; no infinite spinner |
| E3 | Magic-link email typo / non-existent inbox | UI communicates "link sent" honestly (Supabase doesn't reveal existence); resend allowed after cooldown |
| E4 | Rapid repeated magic-link requests | Client-side 60s cooldown; Supabase rate-limit error surfaced as a readable message, not a raw error object |
| E5 | Google OAuth popup blocked / user cancels | Auth modal returns to idle state with a retry option |
| E6 | localStorage unavailable (private mode/quota) | Guest ID falls back to in-memory; app warns that progress won't persist; no throw |
| E7 | Corrupted guest-storage JSON | Versioned parser discards invalid payloads and reinitializes (never crashes the boot path) |
| E8 | Guest upgrades on a device, then signs in on a second device | Second device simply has no local history to merge; no duplicate/phantom runs |
| E9 | Sign out | Session store resets to guest; profile-only UI disappears; no stale user data flashes |
| E10 | `prefers-reduced-motion: reduce` | Every gallery animation collapses to fade; timer ring becomes a static progress indicator; page transitions are opacity-only |
| E11 | Auth state change in another tab | `onAuthStateChange` syncs this tab (Supabase broadcasts via storage) |
| E12 | Slow network on first load | Shell renders < 3s on 4G (PRD NFR): no blocking font downloads, code-split routes |
| E13 | Handle collision at signup | DB trigger auto-suffixes; profile loads with the generated handle (client must not assume email-derived handle) |
| E14 | Keyboard-only user | Every primitive reachable and operable via keyboard; visible focus ring (not `outline: none`) |

## 5. Manual testing steps (run after Epic 01 is complete)

Prereqs: `npm install`, then `npm run dev`. For auth tests: schema migration run in Supabase, magic link + Google enabled, `.env.local` filled in.

1. **Cold boot without Supabase env** — delete/rename `.env.local`, `npm run dev`, open the app. ✅ Home renders, no red console errors, auth modal explains guest-only mode.
2. **Gallery** — visit `/gallery`. ✅ All primitives render; buttons visibly depress on click; tab through the page and confirm a visible focus ring on every control.
3. **Reduced motion** — enable "reduce motion" in OS settings (Windows: Settings → Accessibility → Visual effects → Animation effects off), reload `/gallery`. ✅ Transitions become fades; the gallery's reduced-motion indicator reads "on".
4. **Guest identity** — with env restored, open DevTools → Application → Local Storage. Click "Play as guest". ✅ `ds_guest_id` appears and survives reload.
5. **Magic link happy path** — open auth modal, submit your email. ✅ "Check your inbox" state; click the emailed link. ✅ Lands on `/auth/callback`, then home, signed in; a `profiles` row exists in Supabase Table Editor with a sane handle.
6. **Magic link negative** — request a link, wait for it to expire (or reuse an already-used link). ✅ Callback shows a human-readable error and a path back to sign-in.
7. **Resend cooldown** — request a link twice quickly. ✅ Second attempt blocked by a visible countdown.
8. **Google OAuth** — click "Continue with Google", complete consent. ✅ Signed in; cancel the consent screen on a second attempt. ✅ Modal recovers to idle.
9. **Guest→account upgrade** — as a guest, generate local history (Epic 01: the stored guest ID + any stub run data), then sign in. ✅ Local history is preserved under the account (inspect localStorage: data migrated to the account namespace, `pendingSync` flagged), and the guest ID is retired.
10. **Sign out / multi-tab** — open two tabs, sign out in one. ✅ Both tabs return to guest state.
11. **Lighthouse** — `npm run build && npm run preview`, run Lighthouse (mobile) on the shell. ✅ Performance ≥ 85.

## 6. Acceptance-criteria mapping

| Epic AC | Covered by |
|---|---|
| Lighthouse ≥ 85 mobile | Step 8 + manual test 11 |
| Auth + guest end-to-end incl. upgrade | Steps 5–6 + manual tests 4–10 |
| `/gallery` shows all primitives with motion & sound | Step 7 + manual test 2 |
| Reduced motion collapses to fades | Step 3 + manual test 3 |
