import { Link } from "react-router-dom";
import { Briefcase, HardHat, BarChart3, PlayCircle, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LangToggle } from "@/components/TopBar";

const ROLES = [
  { to: "/employer", icon: Briefcase, key: "employer", bg: "bg-teal", testid: "role-employer" },
  { to: "/work", icon: HardHat, key: "worker", bg: "bg-amber", testid: "role-worker" },
  { to: "/insights", icon: BarChart3, key: "supervisor", bg: "bg-moss", testid: "role-supervisor" },
];

export default function Landing() {
  const { t } = useApp();
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight">Rekan</span>
          <span className="hidden text-sm font-semibold text-teal sm:inline">
            {t("app.tagline")}
          </span>
        </div>
        <LangToggle />
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="brut bg-white p-6 sm:p-10 shadow-brut-lg animate-fade-up">
          <span className="chip bg-amber">Rekan · Indonesia</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {t("landing.hero")}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-ink/80 sm:text-lg">
            {t("landing.sub")}
          </p>
          <Link
            to="/demo"
            data-testid="landing-demo"
            className="brut-btn mt-6 bg-ink px-5 py-3 text-white"
          >
            <PlayCircle size={20} strokeWidth={2.5} />
            {t("landing.demo")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-lg font-extrabold uppercase tracking-wide">
          {t("landing.choose")}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.key}
                to={r.to}
                data-testid={r.testid}
                className="brut group bg-white p-6 animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className={`brut-flat inline-flex p-3 ${r.bg} text-ink`}>
                  <Icon size={30} strokeWidth={2.5} />
                </div>
                <h3 className="mt-4 text-2xl font-extrabold">{t(`role.${r.key}`)}</h3>
                <p className="mt-1 font-medium text-ink/75">{t(`role.${r.key}.desc`)}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-bold text-teal">
                  {t("role.open")}
                  <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="brut bg-paper-2 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-clay">Ethics</p>
          <p className="mt-2 max-w-3xl text-base font-medium">{t("landing.ethics")}</p>
        </div>
      </section>
    </div>
  );
}
