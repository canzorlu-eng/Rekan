import { useApp } from "@/context/AppContext";
import { X, Check } from "lucide-react";

const OPTIONS = ["large", "contrast", "audio", "fewer", "nosound"];

export function SupportPrefsModal({ open, onClose }) {
  const { t, prefs, setPrefs } = useApp();
  if (!open) return null;
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div data-testid="prefs-modal" className="brut w-full max-w-md bg-paper p-6 animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">{t("prefs.title")}</h2>
            <p className="mt-1 text-sm font-medium text-ink/70">{t("prefs.intro")}</p>
          </div>
          <button data-testid="prefs-close" aria-label={t("prefs.done")} onClick={onClose} className="brut-btn bg-white p-2">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {OPTIONS.map((k) => (
            <button
              key={k}
              data-testid={`pref-${k}`}
              onClick={() => toggle(k)}
              className={`brut-flat worker-tap flex items-center justify-between px-4 py-3 text-left text-lg font-bold ${prefs[k] ? "bg-teal text-white" : "bg-white"}`}
            >
              {t(`prefs.${k}`)}
              <span className={`flex h-7 w-7 items-center justify-center border-2 ${prefs[k] ? "border-white bg-white text-teal" : "border-ink"}`}>
                {prefs[k] && <Check size={18} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
        <button data-testid="prefs-done" onClick={onClose} className="brut-btn mt-5 w-full bg-ink px-5 py-4 text-lg text-white">
          {t("prefs.done")}
        </button>
      </div>
    </div>
  );
}
