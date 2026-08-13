// Deterministic readability meter (SPEC §3.5). No AI — must never fail.
export function readability(text) {
  const clean = (text || "").trim();
  if (!clean) return "okay";
  const words = clean.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const clauseMatches =
    clean.match(
      /,|;|\bdan\b|\batau\b|\bjika\b|\bkarena\b|\bsetelah\b|\bsampai\b|\bdengan\b|\band\b|\bor\b|\bif\b|\bbecause\b|\bafter\b|\buntil\b|\bthen\b|\bwith\b/gi
    ) || [];
  const clauses = clauseMatches.length;
  if (wc <= 8 && clauses <= 1) return "simple";
  if (wc <= 12 && clauses <= 2) return "okay";
  return "complex";
}

export const READABILITY_META = {
  simple: { color: "#3F7A4E", bg: "#E4F0E7" },
  okay: { color: "#8A6D1D", bg: "#FBEFD5" },
  complex: { color: "#C4432B", bg: "#F7DED8" },
};
