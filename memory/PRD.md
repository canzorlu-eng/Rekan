# PRD — Rekan (AI job coach for inclusive workplaces)

## Original problem statement
Build "Rekan" end to end (SPEC.md + CLAUDE.md), milestones M0–M5 in strict
order, Indonesian default / English toggle, brutalist UI, done means every
Definition of Done box checked and `/demo` replays offline. No questions —
Decision Defaults.

## Architecture (as built in the Emergent environment)
- Frontend: React (CRA/craco) + Tailwind (JSX), `:3000`, uses `REACT_APP_BACKEND_URL`.
- Backend: FastAPI + `motor` async MongoDB, `:8001`, all routes under `/api`,
  one router per domain (businesses, taskcards, runs, insights, ai, demo).
- AI: Gemini via Emergent universal key (`emergentintegrations`), server-side
  only. `gemini-3.5-flash` (generation/suggestions) + `gemini-2.5-flash-lite`
  (simplify/translate) — mapped from SPEC's unavailable IDs per CLAUDE.md
  fallback rule. Every response Pydantic-validated with retry + deterministic
  fallback. No sampling params.
- Data: UUID string ids; collections businesses / task_cards / runs /
  stuck_events / suggestions. Seed script only, no migrations.
- Auth: none (demo; role in localStorage).
- Design: neo-brutalism over SPEC §9 warm palette + Plus Jakarta Sans.
- See DECISIONS.md for the full list of choices.

## User personas
- Employer/Manager: converts SOPs into accessible task cards.
- Worker (incl. workers with disabilities): runs cards one step at a time.
- Supervisor: sees which steps cause sticking and fixes the instruction.

## Core requirements (static)
Bilingual ID/EN everywhere (UI + card content + speech locale); accessibility is
the product; AI output always employer-reviewed before workers see it; Rekan
rates instructions, never workers; `/demo` runs with zero AI calls.

## Implemented (2026-06)
- M0: repo, Makefile, FastAPI+Mongo+React wired, `/api` health, design tokens,
  bilingual i18n table, role chooser landing.
- M1: data model, seed (3 businesses / 3 cards / 40 runs / 25 stuck / 3
  suggestions), task-card CRUD + publish validation, employer list + review/edit.
- M2: worker step runner at 375px (task list, step screen, audio via
  speechSynthesis, prev/next, finish), run + stuck logging, support prefs,
  a11y (large targets, focus rings, no auto-advance, alt/aria).
- M3: Gemini SOP→card (text/image/PDF/audio), simplify, translate, employer
  create flow + live deterministic readability meter.
- M4: supervisor dashboard — stuck heatmap, per-step timings, AI suggestions
  with apply-to-step, impact strip.
- M5: `/demo` offline replay, landing pitch, ID/EN sweep, README, `.env.example`,
  DoD verified. pytest (validation + aggregation) + full E2E testing green
  (backend 100%, frontend 100%).

## Definition of Done — status
All boxes checked: make check/test green; employer paste/upload/photograph →
AI draft → edit → publish; worker flow at 375px with audio + "I'm stuck" +
finish; supervisor per-step stuck rate/time + AI suggestion; full ID/EN toggle;
a11y gate on every screen; seed loads 3 businesses; `/demo` replays with no
Gemini calls; README with pitch + demo script + impact table.

## Backlog (P1/P2, not required by DoD)
- P1: Nano-Banana pre-generated pictograms at publish time (built-in set is default).
- P1: employer-uploaded sign-language video playback surface in worker mode.
- P2: multi-card supervisor comparison; export a card as printable PDF.
- P2: per-worker private resume (respecting ethics: aggregate-only for supervisor).

## Next tasks
None blocking. Optional enhancements from backlog on user request.
