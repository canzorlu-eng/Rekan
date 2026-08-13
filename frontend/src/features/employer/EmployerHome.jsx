import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { TopBar, Loading, ErrorState } from "@/components/TopBar";

function BusinessBlock({ business }) {
  const { t, loc } = useApp();
  const { data: cards } = useQuery({
    queryKey: ["cards", business.id],
    queryFn: () => api.listCards({ business_id: business.id }),
  });
  return (
    <div className="brut bg-white p-5" data-testid={`business-${business.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="brut-flat bg-teal p-2 text-white">
            <Building2 size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{business.name}</h3>
            <p className="text-sm font-medium capitalize text-ink/70">
              {business.sector} · {business.city}
            </p>
          </div>
        </div>
        <Link
          to={`/employer/${business.id}/create`}
          data-testid={`create-card-${business.id}`}
          className="brut-btn bg-amber px-3 py-2 text-sm"
        >
          <Plus size={16} strokeWidth={3} />
          {t("employer.create_card")}
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {cards && cards.length === 0 && (
          <p className="text-sm font-medium text-ink/60">{t("employer.no_cards")}</p>
        )}
        {(cards || []).map((c) => (
          <Link
            key={c.id}
            to={`/employer/card/${c.id}`}
            data-testid={`card-link-${c.id}`}
            className="brut-flat flex items-center justify-between gap-3 bg-paper px-4 py-3 hover:bg-paper-2"
          >
            <div>
              <p className="font-bold">{loc(c.title)}</p>
              <p className="text-xs font-semibold text-ink/60">
                {c.steps.length} · {t("employer.join")} {c.join_code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`chip ${c.status === "published" ? "bg-moss text-white" : "bg-paper-2"}`}
              >
                {c.status === "published" ? t("employer.published") : t("employer.draft")}
              </span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function EmployerHome() {
  const { t } = useApp();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: businesses, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses"],
    queryFn: api.listBusinesses,
  });

  const addBiz = useMutation({
    mutationFn: () => api.createBusiness({ name, sector: "umum", city: "-" }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });

  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">{t("employer.title")}</h1>
        <p className="mt-1 font-medium text-ink/70">{t("app.tagline")}</p>

        <div className="brut mt-6 flex flex-wrap items-end gap-3 bg-paper-2 p-4">
          <div className="flex-1">
            <label className="text-sm font-bold uppercase">{t("employer.new_business")}</label>
            <input
              data-testid="new-business-input"
              className="brut-input mt-1"
              placeholder={t("employer.new_business_name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            data-testid="add-business-btn"
            className="brut-btn bg-teal px-4 py-3 text-white disabled:opacity-50"
            disabled={!name.trim() || addBiz.isPending}
            onClick={() => addBiz.mutate()}
          >
            <Plus size={18} strokeWidth={3} />
            {t("employer.add")}
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          {isLoading && <Loading />}
          {isError && <ErrorState onRetry={refetch} />}
          {(businesses || []).map((b) => (
            <BusinessBlock key={b.id} business={b} />
          ))}
        </div>
      </main>
    </div>
  );
}
