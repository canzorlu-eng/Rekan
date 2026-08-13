import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, RotateCcw, Home, Sparkles, Check, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { LangToggle } from "@/components/TopBar";
import { Pictogram } from "@/lib/pictograms";

// Offline insurance: minimal bundled café card if the backend is unreachable.
const FALLBACK = {
  card: {
    title: { id: "Membuat Es Kopi Susu", en: "Make Iced Milk Coffee" },
    steps: [
      { order: 1, pictogram: "cup", safety: false, instruction: { id: "Ambil gelas bersih dari rak.", en: "Take a clean glass from the shelf." }, check: { id: "Gelas kering.", en: "Glass is dry." } },
      { order: 2, pictogram: "ice", safety: false, instruction: { id: "Isi gelas dengan es batu.", en: "Fill the glass with ice cubes." }, check: { id: "Es setengah gelas.", en: "Ice fills half." } },
      { order: 3, pictogram: "milk", safety: false, instruction: { id: "Tuang susu sampai setengah gelas.", en: "Pour milk until half full." }, check: { id: "Susu di tengah.", en: "Milk at the middle." } },
      { order: 4, pictogram: "coffee", safety: false, instruction: { id: "Buat satu shot espresso.", en: "Make one shot of espresso." }, check: { id: "Coklat pekat.", en: "Dark brown." } },
      { order: 5, pictogram: "hot", safety: true, instruction: { id: "Panaskan susu dengan steam wand.", en: "Heat the milk with the steam wand." }, check: { id: "Hangat, tidak mendidih.", en: "Warm, not boiling." } },
      { order: 6, pictogram: "pour", safety: false, instruction: { id: "Tuang espresso ke atas susu.", en: "Pour espresso over the milk." }, check: { id: "Ada lapisan coklat.", en: "A brown layer." } },
      { order: 7, pictogram: "mix", safety: false, instruction: { id: "Aduk perlahan dengan sendok.", en: "Stir gently with the spoon." }, check: { id: "Warna rata.", en: "Color is even." } },
      { order: 8, pictogram: "sugar", safety: false, instruction: { id: "Tambahkan gula cair jika diminta.", en: "Add liquid sugar if asked." }, check: { id: "Manis sesuai pesanan.", en: "Sweetness matches." } },
      { order: 9, pictogram: "done", safety: false, instruction: { id: "Sajikan dengan sedotan.", en: "Serve with a straw." }, check: { id: "Sedotan terpasang.", en: "Straw is in." } },
    ],
  },
  simpler: {
    4: { id: "Tekan tombol satu shot espresso.", en: "Press the one-shot espresso button." },
    5: { id: "Panaskan susu sampai hangat saja.", en: "Heat the milk until just warm." },
    7: { id: "Aduk 3 kali dengan sendok.", en: "Stir 3 times with the spoon." },
  },
  script: [
    { step: 1, action: "done" }, { step: 2, action: "done" }, { step: 3, action: "done" },
    { step: 4, action: "stuck_simpler" }, { step: 4, action: "done" }, { step: 5, action: "done" },
    { step: 6, action: "done" }, { step: 7, action: "stuck_simpler" }, { step: 7, action: "done" },
    { step: 8, action: "done" }, { step: 9, action: "done" },
  ],
};

export default function Demo() {
  const { t, lang, loc } = useApp();
  const [data, setData] = useState(null);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    api.demo().then(setData).catch(() => setData(FALLBACK));
  }, []);

  useEffect(() => {
    if (!data || !playing) return;
    if (pos >= data.script.length) return;
    timer.current = setTimeout(() => setPos((p) => p + 1), 1900);
    return () => clearTimeout(timer.current);
  }, [data, playing, pos]);

  if (!data) return null;

  const done = pos >= data.script.length;
  const item = done ? data.script[data.script.length - 1] : data.script[pos];
  const step = data.card.steps.find((s) => s.order === item.step);
  const showSimpler = !done && item.action === "stuck_simpler";
  const simpler = data.simpler[item.step];

  return (
    <div className="worker-scope flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3">
        <Link to="/" className="brut-btn worker-tap bg-white px-3 py-2"><Home size={22} strokeWidth={2.5} /></Link>
        <div>
          <h1 className="text-xl font-extrabold">{t("demo.title")}</h1>
          <p className="text-xs font-semibold text-ink/60">{t("demo.note")}</p>
        </div>
        <LangToggle large />
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <p className="font-bold text-teal">{loc(data.card.title)}</p>
        <div data-testid="demo-progress" className="mt-2 flex flex-wrap justify-center gap-1.5">
          {data.card.steps.map((s) => (
            <span key={s.order} className={`h-3 w-3 border-2 border-ink ${s.order < item.step || done ? "bg-moss" : s.order === item.step ? "bg-teal" : "bg-white"}`} />
          ))}
        </div>

        {done ? (
          <div data-testid="demo-done" className="mt-10 text-center">
            <div className="brut mx-auto inline-flex bg-moss p-5 text-white"><Check size={56} strokeWidth={3} /></div>
            <p className="mt-4 text-3xl font-extrabold">{t("demo.done")}</p>
          </div>
        ) : (
          <>
            {step.safety && (
              <div className="brut mt-3 flex items-center gap-2 border-clay bg-clay px-4 py-2 text-white">
                <ShieldAlert size={22} strokeWidth={2.5} /><span className="text-lg font-extrabold uppercase">{t("worker.careful")}</span>
              </div>
            )}
            <div className={`brut mt-4 flex h-48 w-full max-w-md items-center justify-center bg-white ${step.safety ? "border-clay" : ""}`}>
              <Pictogram name={step.pictogram} size={130} strokeWidth={2} />
            </div>
            <p data-testid="demo-instruction" className="mt-5 max-w-md text-center text-3xl font-extrabold leading-snug">
              {showSimpler && simpler ? (simpler[lang] || simpler.id) : (step.instruction[lang] || step.instruction.id)}
            </p>
            {showSimpler && (
              <span className="chip mt-3 bg-amber"><Sparkles size={14} strokeWidth={2.5} /> {t("stuck.simpler_title")}</span>
            )}
          </>
        )}
      </main>

      <footer className="flex items-center justify-center gap-3 border-t-[3px] border-ink px-4 py-4">
        <button data-testid="demo-toggle" onClick={() => setPlaying((p) => !p)} className="brut-btn worker-tap bg-teal px-5 text-white">
          {playing ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} />}
          {playing ? t("demo.pause") : t("demo.play")}
        </button>
        <button data-testid="demo-restart" onClick={() => { setPos(0); setPlaying(true); }} className="brut-btn worker-tap bg-white px-5">
          <RotateCcw size={24} strokeWidth={2.5} /> {t("demo.restart")}
        </button>
      </footer>
    </div>
  );
}
