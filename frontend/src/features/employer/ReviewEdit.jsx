import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUp, ArrowDown, Trash2, Scissors, Combine, Plus,
  Sparkles, Languages, ShieldAlert, Send, Eye, BarChart3,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { TopBar, Loading, ErrorState } from "@/components/TopBar";
import { Pictogram, PICTOGRAM_KEYS } from "@/lib/pictograms";
import { readability, READABILITY_META } from "@/lib/readability";

function ReadBadge({ text }) {
  const { t } = useApp();
  const level = readability(text);
  const meta = READABILITY_META[level];
  return (
    <span
      data-testid="readability-badge"
      className="chip"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}
    >
      {t("review.readability")}: {t(`read.${level}`)}
    </span>
  );
}

function StepEditor({ step, idx, count, lang, onChange, onMove, onSplit, onMerge, onDelete, onSimplify, onTranslate, busyAI }) {
  const { t } = useApp();
  const set = (field, val) => onChange({ ...step, [field]: val });
  const setLoc = (field, val) => onChange({ ...step, [field]: { ...step[field], [lang]: val } });

  return (
    <div
      data-testid={`step-editor-${step.order}`}
      className={`brut bg-white p-4 ${step.safety ? "border-clay" : ""}`}
      style={step.safety ? { boxShadow: "6px 6px 0 #C4432B" } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="brut-flat flex h-9 w-9 items-center justify-center bg-ink font-extrabold text-white">
            {step.order}
          </span>
          <Pictogram name={step.pictogram} size={28} />
          {step.safety && (
            <span className="chip bg-clay text-white">
              <ShieldAlert size={14} strokeWidth={2.5} /> {t("review.careful")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <button aria-label={t("review.up")} data-testid={`step-up-${step.order}`} disabled={idx === 0} onClick={() => onMove(idx, -1)} className="brut-btn bg-white px-2 py-1 text-xs">
            <ArrowUp size={14} strokeWidth={2.5} />
          </button>
          <button aria-label={t("review.down")} data-testid={`step-down-${step.order}`} disabled={idx === count - 1} onClick={() => onMove(idx, 1)} className="brut-btn bg-white px-2 py-1 text-xs">
            <ArrowDown size={14} strokeWidth={2.5} />
          </button>
          <button data-testid={`step-split-${step.order}`} onClick={() => onSplit(idx)} className="brut-btn bg-white px-2 py-1 text-xs">
            <Scissors size={14} strokeWidth={2.5} /> {t("review.split")}
          </button>
          <button data-testid={`step-merge-${step.order}`} disabled={idx === count - 1} onClick={() => onMerge(idx)} className="brut-btn bg-white px-2 py-1 text-xs">
            <Combine size={14} strokeWidth={2.5} /> {t("review.merge")}
          </button>
          <button aria-label={t("review.delete")} data-testid={`step-delete-${step.order}`} disabled={count <= 3} onClick={() => onDelete(idx)} className="brut-btn bg-clay px-2 py-1 text-xs text-white">
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className="text-xs font-bold uppercase">{t("review.instruction")}</span>
          <input data-testid={`step-instruction-${step.order}`} className="brut-input mt-1" value={step.instruction[lang] || ""} onChange={(e) => setLoc("instruction", e.target.value)} />
          <div className="mt-1"><ReadBadge text={step.instruction[lang]} /></div>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase">{t("review.check")}</span>
          <input data-testid={`step-check-${step.order}`} className="brut-input mt-1" value={step.check[lang] || ""} onChange={(e) => setLoc("check", e.target.value)} />
        </label>

        <div>
          <span className="text-xs font-bold uppercase">{t("review.pictogram")}</span>
          <div className="mt-1 flex max-h-28 flex-wrap gap-1 overflow-y-auto border-2 border-ink p-2">
            {PICTOGRAM_KEYS.map((k) => (
              <button
                key={k}
                data-testid={`picto-${step.order}-${k}`}
                onClick={() => set("pictogram", k)}
                title={k}
                className={`border-2 border-ink p-1.5 ${step.pictogram === k ? "bg-teal text-white" : "bg-white"}`}
              >
                <Pictogram name={k} size={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <input data-testid={`step-image-${step.order}`} className="brut-input" placeholder={t("review.image_url")} value={step.image_url || ""} onChange={(e) => set("image_url", e.target.value || null)} />
          <input data-testid={`step-sign-${step.order}`} className="brut-input" placeholder={t("review.sign_url")} value={step.sign_video_url || ""} onChange={(e) => set("sign_video_url", e.target.value || null)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="chip cursor-pointer bg-paper-2">
            <input type="checkbox" data-testid={`step-safety-${step.order}`} checked={step.safety} onChange={(e) => set("safety", e.target.checked)} className="mr-1" />
            {t("review.safety")}
          </label>
          <button data-testid={`step-simplify-${step.order}`} disabled={busyAI} onClick={() => onSimplify(idx)} className="brut-btn bg-amber px-2 py-1 text-xs">
            <Sparkles size={14} strokeWidth={2.5} /> {t("review.simplify")}
          </button>
          <button data-testid={`step-translate-${step.order}`} disabled={busyAI} onClick={() => onTranslate(idx)} className="brut-btn bg-white px-2 py-1 text-xs">
            <Languages size={14} strokeWidth={2.5} /> {t("review.translate")}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_LOC = { id: "", en: "" };

export default function ReviewEdit() {
  const { cardId } = useParams();
  const { t, lang, loc } = useApp();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [status, setStatus] = useState("loading");
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState([]);
  const [busyAI, setBusyAI] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.getCard(cardId).then((c) => { setCard(c); setStatus("ok"); }).catch(() => setStatus("error"));
  }, [cardId]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const save = async (next) => {
    const c = next || card;
    await api.updateCard(cardId, { title: c.title, steps: c.steps });
  };

  const reorder = (steps) => steps.map((s, i) => ({ ...s, order: i + 1 }));

  const commit = async (steps, extra = {}) => {
    const next = { ...card, ...extra, steps: reorder(steps) };
    setCard(next);
    await save(next);
    flash(t("review.saved"));
  };

  const updateStep = (idx, newStep) => {
    const steps = card.steps.map((s, i) => (i === idx ? newStep : s));
    setCard({ ...card, steps });
  };
  const moveStep = (idx, dir) => {
    const steps = [...card.steps];
    const j = idx + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[idx], steps[j]] = [steps[j], steps[idx]];
    commit(steps);
  };
  const splitStep = (idx) => {
    const s = card.steps[idx];
    const words = (s.instruction[lang] || "").split(" ");
    const mid = Math.max(1, Math.floor(words.length / 2));
    const a = { ...s, instruction: { ...s.instruction, [lang]: words.slice(0, mid).join(" ") } };
    const b = { ...s, instruction: { ...s.instruction, [lang]: words.slice(mid).join(" ") || s.instruction[lang] }, image_url: null, sign_video_url: null };
    const steps = [...card.steps.slice(0, idx), a, b, ...card.steps.slice(idx + 1)];
    commit(steps);
  };
  const mergeStep = (idx) => {
    const a = card.steps[idx];
    const b = card.steps[idx + 1];
    if (!b) return;
    const merged = {
      ...a,
      instruction: { id: `${a.instruction.id} ${b.instruction.id}`.trim(), en: `${a.instruction.en} ${b.instruction.en}`.trim() },
      safety: a.safety || b.safety,
    };
    const steps = [...card.steps.slice(0, idx), merged, ...card.steps.slice(idx + 2)];
    commit(steps);
  };
  const deleteStep = (idx) => commit(card.steps.filter((_, i) => i !== idx));
  const addStep = () => {
    const s = { order: 0, title: { ...EMPTY_LOC }, instruction: { ...EMPTY_LOC }, check: { ...EMPTY_LOC }, pictogram: "check", image_url: null, sign_video_url: null, safety: false, simplified: null };
    commit([...card.steps, s]);
  };

  const simplifyStep = async (idx) => {
    setBusyAI(true);
    try {
      const s = card.steps[idx];
      const { text } = await api.simplify(s.instruction[lang] || "", lang);
      const steps = card.steps.map((x, i) => (i === idx ? { ...x, instruction: { ...x.instruction, [lang]: text } } : x));
      await commit(steps);
    } finally { setBusyAI(false); }
  };
  const translateStep = async (idx) => {
    setBusyAI(true);
    try {
      const s = card.steps[idx];
      const [instr, title, chk] = await Promise.all([
        api.translate(s.instruction.id || "", "en"),
        api.translate(s.title.id || "", "en"),
        api.translate(s.check.id || "", "en"),
      ]);
      const steps = card.steps.map((x, i) => i === idx ? {
        ...x,
        instruction: { ...x.instruction, en: instr.text },
        title: { ...x.title, en: title.text },
        check: { ...x.check, en: chk.text },
      } : x);
      await commit(steps);
    } finally { setBusyAI(false); }
  };

  const publish = async () => {
    setErrors([]);
    setPublishing(true);
    try {
      await save();
      const updated = await api.publishCard(cardId);
      setCard(updated);
      flash(t("review.publish_ok"));
    } catch (e) {
      const errs = e.detail?.detail?.errors || e.detail?.errors || [];
      setErrors(errs.length ? errs : [t("common.error")]);
    } finally { setPublishing(false); }
  };

  if (status === "loading") return (<div><TopBar /><Loading /></div>);
  if (status === "error") return (<div><TopBar /><ErrorState onRetry={() => navigate(0)} /></div>);

  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/employer" className="brut-btn bg-white px-3 py-2 text-sm">
            <ArrowLeft size={16} strokeWidth={2.5} /> {t("common.back")}
          </Link>
          <span className="chip bg-amber">
            <Sparkles size={14} strokeWidth={2.5} /> {t("review.ai_draft")}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-extrabold">{t("review.title")}</h1>

        {card.ai_fallback && (
          <div data-testid="fallback-banner" className="brut mt-3 bg-paper-2 p-3 text-sm font-semibold text-clay">
            {t("review.fallback")}
          </div>
        )}

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase">{t("review.card_title")}</span>
          <input
            data-testid="card-title-input"
            className="brut-input mt-1 text-lg font-bold"
            value={card.title[lang] || ""}
            onChange={(e) => setCard({ ...card, title: { ...card.title, [lang]: e.target.value } })}
            onBlur={() => save()}
          />
        </label>

        <div className="mt-5 grid gap-4">
          {card.steps.map((s, i) => (
            <StepEditor
              key={i}
              step={s}
              idx={i}
              count={card.steps.length}
              lang={lang}
              busyAI={busyAI}
              onChange={(ns) => updateStep(i, ns)}
              onMove={moveStep}
              onSplit={splitStep}
              onMerge={mergeStep}
              onDelete={deleteStep}
              onSimplify={simplifyStep}
              onTranslate={translateStep}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button data-testid="add-step-btn" onClick={addStep} className="brut-btn bg-white px-4 py-2">
            <Plus size={16} strokeWidth={3} /> {t("review.add_step")}
          </button>
          <button data-testid="save-btn" onClick={() => save().then(() => flash(t("review.saved")))} className="brut-btn bg-white px-4 py-2">
            {t("common.save")}
          </button>
        </div>

        {errors.length > 0 && (
          <div data-testid="publish-errors" className="brut mt-4 bg-paper-2 p-3">
            <p className="font-bold text-clay">{t("review.publish_err")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm font-medium">
              {errors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          </div>
        )}

        <div className="sticky bottom-3 mt-6 flex flex-wrap gap-2">
          <button data-testid="publish-btn" onClick={publish} disabled={publishing} className="brut-btn flex-1 bg-teal px-5 py-4 text-lg text-white">
            <Send size={20} strokeWidth={2.5} /> {publishing ? t("review.publishing") : t("review.publish")}
          </button>
          <Link to={`/work/${cardId}`} className="brut-btn bg-amber px-4 py-4">
            <Eye size={18} strokeWidth={2.5} /> {t("review.open_worker")}
          </Link>
          <Link to={`/insights/${cardId}`} className="brut-btn bg-white px-4 py-4">
            <BarChart3 size={18} strokeWidth={2.5} />
          </Link>
        </div>

        {toast && (
          <div data-testid="toast" className="brut fixed bottom-6 left-1/2 z-30 -translate-x-1/2 bg-ink px-4 py-2 font-bold text-white animate-fade-up">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
