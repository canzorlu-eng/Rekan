import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FileText, Upload, Mic, Square, ArrowLeft, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";

const MODES = [
  { key: "paste", icon: FileText },
  { key: "upload", icon: Upload },
  { key: "speak", icon: Mic },
];

export default function CreateCard() {
  const { businessId } = useParams();
  const { t } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // recorder
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!busy) return;
    const steps = ["create.generating", "create.generating2", "create.generating3"];
    setProgress(0);
    const iv = setInterval(() => setProgress((p) => (p + 1) % steps.length), 1500);
    return () => clearInterval(iv);
  }, [busy]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setFile(new File([blob], "recording.webm", { type: "audio/webm" }));
        stream.getTracks().forEach((tk) => tk.stop());
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError(t("common.error"));
    }
  }
  function stopRecording() {
    recRef.current && recRef.current.stop();
    setRecording(false);
  }

  async function generate() {
    setError("");
    const hasInput = mode === "paste" ? text.trim() : file;
    if (!hasInput) {
      setError(t("create.no_input"));
      return;
    }
    setBusy(true);
    try {
      let card;
      if (mode === "paste") {
        card = await api.generate(businessId, text);
      } else {
        card = await api.generateUpload(businessId, "", file);
      }
      navigate(`/employer/card/${card.id}`);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const progressKeys = ["create.generating", "create.generating2", "create.generating3"];

  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/employer" className="brut-btn mb-4 bg-white px-3 py-2 text-sm">
          <ArrowLeft size={16} strokeWidth={2.5} />
          {t("common.back")}
        </Link>
        <h1 className="text-3xl font-extrabold">{t("create.title")}</h1>
        <p className="mt-1 font-bold uppercase tracking-wide text-teal">{t("create.how")}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                data-testid={`mode-${m.key}`}
                onClick={() => setMode(m.key)}
                className={`brut-flat p-4 text-left ${active ? "bg-teal text-white" : "bg-white"}`}
              >
                <Icon size={24} strokeWidth={2.5} />
                <p className="mt-2 text-base font-extrabold normal-case">{t(`create.${m.key}`)}</p>
                <p className={`text-xs font-medium ${active ? "text-white/85" : "text-ink/70"}`}>
                  {t(`create.${m.key}.desc`)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="brut mt-5 bg-white p-5">
          {mode === "paste" && (
            <textarea
              data-testid="paste-input"
              className="brut-input h-48 resize-none"
              placeholder={t("create.paste_ph")}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {mode === "upload" && (
            <div>
              <input
                data-testid="file-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="brut-input"
              />
              {file && (
                <p className="mt-2 text-sm font-semibold">
                  {t("create.file_chosen")} {file.name}
                </p>
              )}
            </div>
          )}

          {mode === "speak" && (
            <div className="flex flex-col items-start gap-3">
              {!recording ? (
                <button data-testid="record-btn" onClick={startRecording} className="brut-btn bg-clay px-4 py-3 text-white">
                  <Mic size={18} strokeWidth={2.5} />
                  {t("create.record")}
                </button>
              ) : (
                <button data-testid="stop-btn" onClick={stopRecording} className="brut-btn bg-ink px-4 py-3 text-white">
                  <Square size={18} strokeWidth={2.5} />
                  {t("create.stop")}
                </button>
              )}
              {recording && <p className="font-semibold text-clay">{t("create.recording")}</p>}
              {file && !recording && (
                <p className="text-sm font-semibold">{t("create.file_chosen")} {file.name}</p>
              )}
            </div>
          )}

          {error && <p data-testid="create-error" className="mt-3 font-bold text-clay">{error}</p>}

          <button
            data-testid="generate-btn"
            onClick={generate}
            disabled={busy}
            className="brut-btn mt-4 w-full bg-teal px-5 py-4 text-lg text-white"
          >
            <Sparkles size={20} strokeWidth={2.5} />
            {busy ? t(progressKeys[progress]) : t("create.generate")}
          </button>
          {busy && (
            <div className="mt-3 h-2 w-full border-2 border-ink bg-white">
              <div
                className="h-full bg-amber transition-all duration-500"
                style={{ width: `${((progress + 1) / 3) * 100}%` }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
