import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingDown, Wrench, Clock, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { TopBar, Loading, ErrorState } from "@/components/TopBar";

function fmt(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function shade(rate, max) {
  if (max <= 0 || rate <= 0) return { bg: "#EDE6D8", fg: "#1C1F26" };
  const ratio = rate / max;
  if (ratio > 0.66) return { bg: "#C4432B", fg: "#fff" };
  if (ratio > 0.33) return { bg: "#E8A33D", fg: "#1C1F26" };
  return { bg: "#F1E9DA", fg: "#1C1F26" };
}

function CardSelector() {
  const { t, loc } = useApp();
  const { data: cards, isLoading } = useQuery({
    queryKey: ["published-cards-insights"],
    queryFn: () => api.listCards({ status: "published" }),
  });
  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">{t("insights.title")}</h1>
        <p className="mt-2 font-bold uppercase tracking-wide text-teal">{t("insights.select")}</p>
        {isLoading && <Loading />}
        <div className="mt-4 grid gap-3">
          {(cards || []).map((c) => (
            <Link key={c.id} to={`/insights/${c.id}`} data-testid={`insights-card-${c.id}`} className="brut flex items-center justify-between bg-white p-4">
              <span className="text-xl font-extrabold">{loc(c.title)}</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ cardId }) {
  const { t, loc, lang } = useApp();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insights", cardId],
    queryFn: () => api.insights(cardId),
  });

  if (isLoading) return (<div><TopBar /><Loading /></div>);
  if (isError) return (<div><TopBar /><ErrorState onRetry={refetch} /></div>);

  const maxRate = Math.max(...data.steps.map((s) => s.stuck_rate), 0);
  const maxMed = Math.max(...data.steps.map((s) => s.median_seconds), 1);
  const impact = data.impact;

  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/insights")} className="brut-btn mb-3 bg-white px-3 py-2 text-sm">{t("common.back")}</button>
        <h1 className="text-3xl font-extrabold">{loc(data.title)}</h1>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="brut bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-bold uppercase text-teal"><CheckCircle2 size={16} strokeWidth={2.5} /> {t("insights.completions")}</p>
            <p data-testid="completions" className="mt-1 text-4xl font-extrabold">{impact.completion_count}</p>
          </div>
          <div className="brut bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-bold uppercase text-teal"><Clock size={16} strokeWidth={2.5} /> {t("insights.median_time")}</p>
            <p data-testid="median-time" className="mt-1 text-4xl font-extrabold">{fmt(impact.median_total_seconds)}</p>
          </div>
        </div>

        {/* Heatmap */}
        <section className="brut mt-5 bg-white p-5">
          <h2 className="text-xl font-extrabold">{t("insights.heatmap")}</h2>
          <p className="mt-1 font-bold text-clay">{t("insights.heatmap_head")}</p>
          <div data-testid="heatmap" className="mt-4 flex gap-1.5 overflow-x-auto">
            {data.steps.map((s) => {
              const c = shade(s.stuck_rate, maxRate);
              return (
                <div key={s.order} className="brut-flat flex min-w-[60px] flex-1 flex-col items-center p-2" style={{ background: c.bg, color: c.fg }} title={`${loc(s.title)}`}>
                  <span className="text-xs font-bold">{t("insights.step")} {s.order}</span>
                  <span data-testid={`heat-count-${s.order}`} className="text-2xl font-extrabold">{s.stuck_count}</span>
                  <span className="text-[10px] font-bold uppercase">{t("insights.stuck")}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Time per step */}
        <section className="brut mt-5 bg-white p-5">
          <h2 className="text-xl font-extrabold">{t("insights.per_step")}</h2>
          <div className="mt-3 grid gap-2">
            {data.steps.map((s) => (
              <div key={s.order} className="flex items-center gap-3">
                <span className="w-16 text-sm font-bold">{t("insights.step")} {s.order}</span>
                <div className="h-6 flex-1 border-2 border-ink bg-paper">
                  <div className="h-full bg-teal" style={{ width: `${(s.median_seconds / maxMed) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-sm font-bold">{fmt(s.median_seconds)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Suggestions */}
        <section className="brut mt-5 bg-white p-5">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Wrench size={20} strokeWidth={2.5} /> {t("insights.suggestions")}</h2>
          <div className="mt-3 grid gap-3">
            {data.suggestions.length === 0 && <p className="font-medium text-ink/60">{t("insights.no_suggestions")}</p>}
            {data.suggestions.map((s) => (
              <div key={s.id} data-testid={`suggestion-${s.id}`} className="brut-flat bg-paper-2 p-4">
                <span className="chip bg-amber">{t("insights.step")} {s.step_order}</span>
                <p className="mt-2 font-bold">{s.text[lang] || s.text.id}</p>
                <Link to={`/employer/card/${cardId}`} data-testid={`apply-${s.id}`} className="brut-btn mt-3 bg-teal px-3 py-2 text-sm text-white">
                  {t("insights.apply")} {s.step_order} <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Impact strip */}
        <section data-testid="impact-strip" className="brut mt-5 bg-moss p-5 text-white">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><TrendingDown size={22} strokeWidth={2.5} /> {t("insights.impact")}</h2>
          <p className="mt-2 text-2xl font-extrabold">
            {t("insights.impact_line", { a: fmt(impact.first_run_seconds), b: fmt(impact.latest_run_seconds) })}
          </p>
        </section>
      </main>
    </div>
  );
}

export default function Insights() {
  const { cardId } = useParams();
  return cardId ? <Dashboard cardId={cardId} /> : <CardSelector />;
}
