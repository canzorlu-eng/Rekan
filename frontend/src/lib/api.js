const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const err = new Error(`API ${res.status}`);
    err.detail = detail;
    throw err;
  }
  return res.json();
}

export const api = {
  listBusinesses: () => req("GET", "/businesses"),
  createBusiness: (b) => req("POST", "/businesses", b),

  listCards: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req("GET", `/task_cards${q ? `?${q}` : ""}`);
  },
  getCard: (id) => req("GET", `/task_cards/${id}`),
  createCard: (c) => req("POST", "/task_cards", c),
  updateCard: (id, patch) => req("PUT", `/task_cards/${id}`, patch),
  publishCard: (id) => req("POST", `/task_cards/${id}/publish`),
  deleteCard: (id) => req("DELETE", `/task_cards/${id}`),

  generate: (business_id, text) => req("POST", "/ai/generate", { business_id, text }),
  generateUpload: async (business_id, text, file) => {
    const fd = new FormData();
    fd.append("business_id", business_id);
    fd.append("text", text || "");
    if (file) fd.append("file", file);
    const res = await fetch(`${API}/ai/generate_upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
  simplify: (text, lang) => req("POST", "/ai/simplify", { text, lang }),
  translate: (text, target) => req("POST", "/ai/translate", { text, target }),
  simplifyStep: (cardId, order, lang) =>
    req("POST", `/ai/task_cards/${cardId}/steps/${order}/simplify?lang=${lang}`),

  startRun: (worker_id, task_card_id) => req("POST", "/runs", { worker_id, task_card_id }),
  finishRun: (id, step_durations) => req("POST", `/runs/${id}/finish`, { step_durations }),
  logStuck: (payload) => req("POST", "/stuck", payload),

  insights: (id) => req("GET", `/insights/${id}`),
  demo: () => req("GET", "/demo"),
};
