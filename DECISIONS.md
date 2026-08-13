# DECISIONS.md — Rekan build log

Format: one line per decision. Product questions → SPEC.md wins; process → CLAUDE.md.

- Stack adapted to Emergent's native runtime: React 18/19 + CRA (craco) in JSX (not Vite+TS), FastAPI on :8001 with `/api` prefix, frontend on :3000 via `REACT_APP_BACKEND_URL`. SPEC's Vite/:5173/:8000 map to this. Supervisor manages both processes.
- Frontend written in JSX + JS i18n table instead of TypeScript, to match the pre-wired CRA toolchain. `make check` runs `yarn build` (CRA) instead of `tsc --noEmit`.
- Gemini via the Emergent universal key (`emergentintegrations` LlmChat, provider `gemini`). SPEC's `gemini-3.6-flash` / `gemini-3.5-flash-lite` are not available on the universal key, so per CLAUDE.md's fallback rule mapped to `gemini-3.5-flash` (generation/reasoning) and `gemini-2.5-flash-lite` (simplify/translate). No sampling params sent; behavior controlled by system_instruction + JSON output. Every response Pydantic-validated with retry-once then deterministic fallback.
- Document ids are UUID strings (not Mongo ObjectId) to keep JSON serialization trivial; `_id` excluded from every response.
- Pictograms implemented as a thick-stroke lucide-react icon set mapped to ~30 keys (readable at 96px) instead of hand-drawn SVGs — boring, deletable, works. Key list mirrored backend (`pictograms.py`) and frontend (`pictograms.jsx`).
- Design: neo-brutalism (thick ink borders, hard offset shadows, sharp corners) over SPEC §9 warm palette + Plus Jakarta Sans, per the user's explicit "adopt BRUTALISM" instruction.
- `/demo` uses seeded café card + pre-baked "explain simpler" lines from `/api/demo`, with a bundled fallback card in the frontend, so a full worker run replays with zero Gemini calls.
