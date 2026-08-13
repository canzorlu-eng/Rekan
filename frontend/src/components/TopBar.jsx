import { Link, useLocation } from "react-router-dom";
import { Languages, Briefcase, HardHat, BarChart3, Home } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function LangToggle({ large = false }) {
  const { toggleLang, t } = useApp();
  return (
    <button
      data-testid="lang-toggle"
      onClick={toggleLang}
      className={`brut-btn bg-amber text-ink ${large ? "px-5 py-3 text-lg" : "px-3 py-2 text-sm"}`}
      aria-label="Switch language"
    >
      <Languages size={large ? 22 : 18} strokeWidth={2.5} />
      {t("lang.other")}
    </button>
  );
}

export function TopBar() {
  const { t } = useApp();
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: t("app.name"), icon: Home, id: "nav-home" },
    { to: "/employer", label: t("role.employer"), icon: Briefcase, id: "nav-employer" },
    { to: "/work", label: t("role.worker"), icon: HardHat, id: "nav-worker" },
    { to: "/insights", label: t("role.supervisor"), icon: BarChart3, id: "nav-insights" },
  ];
  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                data-testid={l.id}
                className={`brut-btn px-3 py-2 text-sm ${
                  active ? "bg-teal text-white" : "bg-white text-ink"
                }`}
              >
                <Icon size={16} strokeWidth={2.5} />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}

export function Loading({ label }) {
  const { t } = useApp();
  return (
    <div data-testid="loading" className="p-10 text-center text-lg font-bold">
      {label || t("common.loading")}
    </div>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useApp();
  return (
    <div data-testid="error-state" className="brut mx-auto my-10 max-w-md p-6 text-center">
      <p className="mb-4 font-bold text-clay">{t("common.error")}</p>
      {onRetry && (
        <button className="brut-btn bg-ink px-4 py-2 text-white" onClick={onRetry}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
