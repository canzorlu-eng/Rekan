# Rekan — a job coach in every worker's pocket

**Rekan** (Indonesian for "colleague"). *Pelatih kerja di saku setiap pekerja.*

Rekan turns a company's messy job procedure into an accessible, step-by-step
task card, coaches the worker through it on their phone one step at a time, and
tells the supervisor which steps are badly designed — so the **instruction**
gets fixed, never the worker.

## 60-second judge pitch
Indonesian law requires companies to hire persons with disabilities, but
companies can hire — they can't *train*. Their procedures are dense PDFs written
for nobody in particular. Human job coaches solve this but don't scale: one
coach per worker, paid monthly. **Rekan is the scalable job coach.** It converts
an employer's existing SOP into a simple, bilingual, pictogram-led task card,
coaches the worker step by step with audio and an "I'm stuck" button, and turns
the resulting stuck-data into concrete fixes for the supervisor. Start with
disability inclusion; expand to any low-literacy frontline workforce.

## 90-second demo script
1. Open `/` in Indonesian → tap **Manajer**.
2. Pick **Kopi Rekan** → **Buat kartu tugas** → paste (or photograph) an
   Indonesian SOP → **Buat draf dengan AI** → a structured card appears in
   seconds → **Terbitkan**.
3. Switch to **Pekerja** on a phone-width window → run the *Es Kopi Susu* card →
   play audio in Indonesian → tap **Saya bingung → Jelaskan lebih sederhana** and
   watch the sentence get simpler → switch language to **EN** mid-run.
4. Open **Penyelia** → the heatmap shows step 4 is the problem; the AI suggests
   fixing the *instruction*, not the worker; the impact strip shows training
   time falling.
5. Close on: *this is a job coach that costs nothing to duplicate.*

Or just open **`/demo`** — a full worker run replays offline with **zero AI
calls** (stage insurance).

## Impact metrics
| Metric | Before Rekan | With Rekan |
|---|---|---|
| Time to train one worker on one task | (pilot value) | (pilot value) |
| Written material accessible without reading | No | Yes |
| Steps identified as badly designed | Unknown | (count) |
| Cost per trained worker per task | (coach hours × rate) | (near zero) |

Business model: per-location subscription, priced under one hour of a human job
coach per month; expansion path to any frontline workforce.

## Ethics (non-negotiable)
- Rekan does **not** diagnose, screen, or label anyone.
- Rekan does **not** score, rank, or rate workers. It rates *instructions*.
- Stuck data is aggregated per step for the supervisor; never an individual
  performance record.
- Rekan augments human job coaches and Deaf/disabled trainers — it does not
  replace them.

## Stack & setup
- Frontend: React (CRA/craco) + Tailwind, served on `:3000`.
- Backend: FastAPI + `motor` (async MongoDB) on `:8001`, all routes under `/api`.
- AI: Gemini via the Emergent universal key, called **server-side only**. Every
  AI response is Pydantic-validated with a deterministic fallback, so a Gemini
  outage never blanks the screen.
- **Auth: none** — this is a demo. Role is chosen on `/` and stored in
  localStorage.

```bash
# env: copy names from .env.example into backend/.env and frontend/.env
make seed     # wipe + reseed the 3 demo businesses and demo run/stuck data
make test     # pytest: task-card validation + stuck-rate aggregation
make check    # ruff + frontend production build
```

Services are managed by supervisor in this environment
(`sudo supervisorctl status`).

See `SPEC.md` (what to build), `CLAUDE.md` (how to build), and `DECISIONS.md`
(choices made during the build).
