/**
 * Clasificador de sentimiento por palabras clave — deliberadamente simple
 * (sin llamar a un LLM por noticia, que sería lento y no aporta suficiente
 * sobre este enfoque para un titular corto). Cuenta coincidencias de
 * palabras asociadas a subidas/optimismo vs caídas/pesimismo en el
 * titular + resumen, en inglés (fuente: Finnhub).
 */
const POSITIVE_WORDS = [
  "rally", "surge", "surges", "soar", "soars", "gain", "gains", "gained",
  "jump", "jumps", "record high", "beat", "beats", "upgrade", "upgraded",
  "growth", "profit", "profits", "rebound", "recovery", "optimis", "bullish",
  "rises", "rose", "climb", "climbs", "strong", "boost", "boosts",
];

const NEGATIVE_WORDS = [
  "plunge", "plunges", "crash", "crashes", "slump", "slumps", "fall", "falls",
  "fell", "drop", "drops", "dropped", "loss", "losses", "downgrade",
  "downgraded", "recession", "layoff", "layoffs", "miss", "misses", "warn",
  "warns", "warning", "sell-off", "selloff", "bearish", "decline", "declines",
  "cut", "cuts", "tumble", "tumbles", "fear", "fears", "concern", "concerns",
];

export function classifySentiment(text: string): "positivo" | "negativo" | "neutral" {
  const lower = text.toLowerCase();
  const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negativeHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (positiveHits === negativeHits) return "neutral";
  return positiveHits > negativeHits ? "positivo" : "negativo";
}
