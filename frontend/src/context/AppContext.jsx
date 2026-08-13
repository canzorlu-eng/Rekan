import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STRINGS } from "@/i18n";

const AppContext = createContext(null);

const DEFAULT_PREFS = {
  large: false,
  contrast: false,
  audio: false,
  fewer: false,
  nosound: false,
};

function readLang() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("lang") === "en" || params.get("lang") === "id") {
    return params.get("lang");
  }
  return localStorage.getItem("rekan_lang") || "id";
}

function workerId() {
  let id = localStorage.getItem("rekan_worker_id");
  if (!id) {
    id = "w-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("rekan_worker_id", id);
  }
  return id;
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState(readLang);
  const [prefs, setPrefs] = useState(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("rekan_prefs") || "{}") };
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    localStorage.setItem("rekan_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("rekan_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const t = useCallback(
    (key, vars) => {
      let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.id[key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(`{${k}}`, v);
        });
      }
      return s;
    },
    [lang]
  );

  const toggleLang = useCallback(() => setLang((l) => (l === "id" ? "en" : "id")), []);
  const loc = useCallback((obj) => (obj ? obj[lang] || obj.id || "" : ""), [lang]);

  const value = {
    lang,
    setLang,
    toggleLang,
    t,
    loc,
    prefs,
    setPrefs,
    workerId: workerId(),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function speak(text, lang, enabled = true) {
  if (!enabled || !text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "id" ? "id-ID" : "en-US";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
