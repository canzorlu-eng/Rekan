import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Settings2, Home, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { LangToggle, Loading, ErrorState } from "@/components/TopBar";
import { Pictogram } from "@/lib/pictograms";
import { SupportPrefsModal } from "./SupportPrefsModal";

export default function WorkerHome() {
  const { t, loc, prefs } = useApp();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { data: cards, isLoading, isError, refetch } = useQuery({
    queryKey: ["published-cards"],
    queryFn: () => api.listCards({ status: "published" }),
  });

  const scope = `worker-scope ${prefs.large ? "pref-large" : ""} ${prefs.contrast ? "pref-contrast" : ""}`;

  return (
    <div className={`${scope} min-h-screen`}>
      <header className="flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3">
        <Link to="/" data-testid="worker-home-link" className="brut-btn worker-tap bg-white px-3 py-2">
          <Home size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-extrabold">{t("worker.title")}</h1>
        <div className="flex gap-2">
          <button data-testid="worker-prefs-btn" aria-label={t("worker.prefs")} onClick={() => setPrefsOpen(true)} className="brut-btn worker-tap bg-white px-3 py-2">
            <Settings2 size={22} strokeWidth={2.5} />
          </button>
          <LangToggle large />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {isLoading && <Loading />}
        {isError && <ErrorState onRetry={refetch} />}
        {cards && cards.length === 0 && (
          <p data-testid="worker-empty" className="p-8 text-center text-xl font-bold">{t("worker.no_tasks")}</p>
        )}
        <div className="grid gap-4">
          {(cards || []).map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`worker-task-${c.id}`}
              className="brut worker-tap flex items-center gap-4 bg-white p-5 animate-fade-up"
            >
              <div className="brut-flat bg-amber p-3">
                <Pictogram name={c.steps[0]?.pictogram || "check"} size={44} />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-extrabold leading-tight">{loc(c.title)}</p>
                <p className="mt-1 flex items-center gap-1 font-bold text-ink/70">
                  <Clock size={16} strokeWidth={2.5} /> {c.estimated_minutes} {t("common.minutes")} · {c.steps.length} ✓
                </p>
              </div>
              <span className="brut-btn bg-teal px-4 py-3 text-white">
                <Play size={20} strokeWidth={2.5} /> {t("worker.start")}
              </span>
            </Link>
          ))}
        </div>
      </main>

      <SupportPrefsModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}
