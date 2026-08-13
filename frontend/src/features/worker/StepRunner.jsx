import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Volume2, ArrowLeft, HelpCircle, Check, X, Sparkles, Image as ImageIcon,
  UserRound, ShieldAlert, Home, RotateCcw, Hand,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp, speak } from "@/context/AppContext";
import { LangToggle, Loading, ErrorState } from "@/components/TopBar";
import { Pictogram } from "@/lib/pictograms";

const cacheKey = (id) => `rekan_card_${id}`;

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");
}

function embedUrl(url) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return url;
}

export default function StepRunner() {
  const { cardId } = useParams();
  const { t, lang, prefs, workerId } = useApp();
  const navigate = useNavigate();

  const [card, setCard] = useState(() => {
    try { return JSON.parse(localStorage.getItem(cacheKey(cardId)) || "null"); } catch { return null; }
  });
  const [status, setStatus] = useState(card ? "ok" : "loading");
  const [index, setIndex] = useState(0);
  const [durations, setDurations] = useState([]);
  const [finished, setFinished] = useState(false);
  const [runId, setRunId] = useState(null);
  const [stuck, setStuck] = useState(null); // null | 'menu' | 'simpler' | 'picture' | 'ask'
  const [signOpen, setSignOpen] = useState(false);
  const [simplerText, setSimplerText] = useState("");
  const [simplifying, setSimplifying] = useState(false);
  const stepStart = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    api.getCard(cardId).then((c) => {
      if (!alive) return;
      setCard(c);
      localStorage.setItem(cacheKey(cardId), JSON.stringify(c));
      setStatus("ok");
    }).catch(() => { if (!card) setStatus("error"); });
    api.startRun(workerId, cardId).then((r) => alive && setRunId(r.id)).catch(() => {});
    return () => { alive = false; window.speechSynthesis && window.speechSynthesis.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  useEffect(() => { stepStart.current = Date.now(); setStuck(null); setSimplerText(""); setSignOpen(false); }, [index]);

  if (status === "loading") return <div className="worker-scope"><Loading /></div>;
  if (status === "error" || !card) return <div className="worker-scope"><ErrorState onRetry={() => navigate(0)} /></div>;

  const steps = card.steps;
  const step = steps[index];
  const total = steps.length;
  const instruction = (prefs.fewer && step.simplified?.[lang]) || step.instruction[lang] || step.instruction.id;

  const logStuck = (kind) => {
    if (!runId) return;
    api.logStuck({ run_id: runId, task_card_id: cardId, step_order: step.order, kind }).catch(() => {});
  };

  const onDone = async () => {
    const dur = (Date.now() - stepStart.current) / 1000;
    const next = [...durations];
    next[index] = Math.round(dur * 10) / 10;
    setDurations(next);
    if (index + 1 >= total) {
      if (runId) api.finishRun(runId, next).catch(() => {});
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const openSimpler = async () => {
    logStuck("simpler");
    setStuck("simpler");
    setSimplifying(true);
    try {
      const { text } = await api.simplifyStep(cardId, step.order, lang);
      setSimplerText(text);
    } catch {
      setSimplerText(step.instruction[lang]);
    } finally { setSimplifying(false); }
  };
  const openPicture = () => { logStuck("picture"); setStuck("picture"); };
  const openAsk = () => { logStuck("ask"); setStuck("ask"); };

  const scope = `worker-scope ${prefs.large ? "pref-large" : ""} ${prefs.contrast ? "pref-contrast" : ""}`;

  if (finished) {
    return (
      <div className={`${scope} flex min-h-screen flex-col`}>
        <main data-testid="finish-screen" className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="brut bg-moss p-5 text-white"><Check size={64} strokeWidth={3} /></div>
          <h1 className="mt-6 text-4xl font-extrabold">{t("finish.title")}</h1>
          <p className="mt-3 text-2xl font-bold">{t("finish.body", { n: total })}</p>
          <div className="mt-8 flex flex-col gap-3">
            <button data-testid="finish-again" onClick={() => { setFinished(false); setIndex(0); setDurations([]); }} className="brut-btn worker-tap bg-amber px-6 py-4 text-lg">
              <RotateCcw size={22} strokeWidth={2.5} /> {t("finish.again")}
            </button>
            <Link data-testid="finish-tasks" to="/work" className="brut-btn worker-tap bg-white px-6 py-4 text-lg">
              <Home size={22} strokeWidth={2.5} /> {t("finish.tasks")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${scope} flex min-h-screen flex-col`}>
      <header className="flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3">
        <Link to="/work" data-testid="runner-back-tasks" className="brut-btn worker-tap bg-white px-3 py-2" aria-label={t("finish.tasks")}>
          <Home size={22} strokeWidth={2.5} />
        </Link>
        <div data-testid="progress-dots" className="flex flex-wrap items-center justify-center gap-1.5" aria-label={t("worker.step_of", { a: index + 1, b: total })}>
          {steps.map((_, i) => (
            <span key={i} className={`h-3 w-3 border-2 border-ink ${i < index ? "bg-moss" : i === index ? "bg-teal" : "bg-white"}`} />
          ))}
        </div>
        <LangToggle large />
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <p className="text-lg font-bold text-ink/60">{t("worker.step_of", { a: index + 1, b: total })}</p>

        {step.safety && (
          <div data-testid="safety-banner" className="brut mt-3 flex items-center gap-2 border-clay bg-clay px-4 py-2 text-white" style={{ boxShadow: "4px 4px 0 #1C1F26" }}>
            <ShieldAlert size={24} strokeWidth={2.5} />
            <span className="text-xl font-extrabold uppercase">{t("worker.careful")}</span>
          </div>
        )}

        <div className={`brut mt-4 flex h-52 w-full max-w-md items-center justify-center bg-white ${step.safety ? "border-clay" : ""}`}>
          {step.image_url ? (
            <img src={step.image_url} alt={instruction} className="h-full w-full object-contain" />
          ) : (
            <Pictogram name={step.pictogram} size={140} strokeWidth={2} />
          )}
        </div>

        <p data-testid="step-instruction" className="mt-6 max-w-md text-center text-3xl font-extrabold leading-snug">
          {instruction}
        </p>
        <div className="mt-4 max-w-md border-l-4 border-teal bg-white px-4 py-3 text-center">
          <p className="text-sm font-bold uppercase text-teal">{t("worker.check_label")}</p>
          <p className="text-xl font-bold">{step.check[lang] || step.check.id}</p>
        </div>

        <div className="mt-5 flex w-full max-w-md items-center justify-center gap-3">
          <button data-testid="prev-btn" aria-label={t("worker.prev")} disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))} className="brut-btn worker-tap bg-white px-4">
            <ArrowLeft size={26} strokeWidth={2.5} />
          </button>
          <button data-testid="audio-btn" aria-label={t("worker.play")} disabled={prefs.nosound} onClick={() => speak(instruction, lang, !prefs.nosound)} className="brut-btn worker-tap bg-white px-4">
            <Volume2 size={26} strokeWidth={2.5} />
          </button>
          {step.sign_video_url && (
            <button data-testid="sign-btn" aria-label={t("worker.sign")} onClick={() => setSignOpen(true)} className="brut-btn worker-tap bg-white px-4">
              <Hand size={26} strokeWidth={2.5} />
            </button>
          )}
          <button data-testid="stuck-btn" onClick={() => setStuck("menu")} className="brut-btn worker-tap flex-1 bg-amber px-4 text-lg">
            <HelpCircle size={26} strokeWidth={2.5} /> {t("worker.stuck")}
          </button>
        </div>

        <button data-testid="done-btn" onClick={onDone} className="brut-btn worker-tap mt-4 w-full max-w-md bg-teal px-6 py-6 text-2xl text-white">
          <Check size={30} strokeWidth={3} /> {t("worker.done")}
        </button>
      </main>

      {stuck && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div data-testid="stuck-modal" className="worker-scope brut w-full max-w-md bg-paper p-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">
                {stuck === "menu" ? t("stuck.title") : stuck === "simpler" ? t("stuck.simpler_title") : stuck === "picture" ? t("stuck.picture") : t("stuck.asked_title")}
              </h2>
              <button data-testid="stuck-close" aria-label={t("stuck.close")} onClick={() => setStuck(null)} className="brut-btn bg-white p-2">
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            {stuck === "menu" && (
              <div className="mt-4 grid gap-3">
                <button data-testid="stuck-simpler" onClick={openSimpler} className="brut-btn worker-tap justify-start bg-white px-4 text-lg normal-case">
                  <Sparkles size={24} strokeWidth={2.5} /> {t("stuck.simpler")}
                </button>
                <button data-testid="stuck-picture" onClick={openPicture} className="brut-btn worker-tap justify-start bg-white px-4 text-lg normal-case">
                  <ImageIcon size={24} strokeWidth={2.5} /> {t("stuck.picture")}
                </button>
                <button data-testid="stuck-ask" onClick={openAsk} className="brut-btn worker-tap justify-start bg-white px-4 text-lg normal-case">
                  <UserRound size={24} strokeWidth={2.5} /> {t("stuck.ask")}
                </button>
              </div>
            )}

            {stuck === "simpler" && (
              <div className="mt-4">
                {simplifying ? (
                  <p className="text-lg font-bold">{t("stuck.simplifying")}</p>
                ) : (
                  <p data-testid="simpler-text" className="border-l-4 border-amber bg-white px-4 py-3 text-2xl font-extrabold">{simplerText}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button data-testid="simpler-audio" disabled={prefs.nosound || simplifying} onClick={() => speak(simplerText, lang, !prefs.nosound)} className="brut-btn worker-tap bg-white px-4">
                    <Volume2 size={24} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => setStuck(null)} className="brut-btn worker-tap flex-1 bg-teal px-4 text-white">{t("stuck.back")}</button>
                </div>
              </div>
            )}

            {stuck === "picture" && (
              <div className="mt-4 text-center">
                <div className="brut flex h-56 items-center justify-center bg-white">
                  {step.image_url ? (
                    <img src={step.image_url} alt={instruction} className="h-full w-full object-contain" />
                  ) : (
                    <Pictogram name={step.pictogram} size={150} strokeWidth={2} />
                  )}
                </div>
                {!step.image_url && <p className="mt-2 font-semibold">{t("stuck.picture_none")}</p>}
                <button onClick={() => setStuck(null)} className="brut-btn worker-tap mt-3 w-full bg-teal px-4 text-white">{t("stuck.back")}</button>
              </div>
            )}

            {stuck === "ask" && (
              <div data-testid="stuck-asked" className="mt-4 text-center">
                <div className="brut mx-auto inline-flex bg-moss p-4 text-white"><Check size={40} strokeWidth={3} /></div>
                <p className="mt-3 text-xl font-bold">{t("stuck.asked_body")}</p>
                <button onClick={() => setStuck(null)} className="brut-btn worker-tap mt-4 w-full bg-teal px-4 text-white">{t("stuck.close")}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {signOpen && step.sign_video_url && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" data-testid="sign-overlay">
          <div className="flex items-center justify-between border-b-[3px] border-white/30 px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-xl font-extrabold">
              <Hand size={26} strokeWidth={2.5} /> {t("worker.sign")}
            </span>
            <button data-testid="sign-close" aria-label={t("stuck.close")} onClick={() => setSignOpen(false)} className="brut-btn worker-tap bg-white px-3 py-2 text-ink">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-3">
            {isDirectVideo(step.sign_video_url) ? (
              <video data-testid="sign-video" src={step.sign_video_url} controls autoPlay playsInline className="max-h-full max-w-full border-[3px] border-white bg-black" />
            ) : (
              <iframe data-testid="sign-video" src={embedUrl(step.sign_video_url)} title={t("worker.sign")} allow="autoplay; fullscreen" allowFullScreen className="h-full w-full border-[3px] border-white bg-black" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
