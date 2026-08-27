import { getCloses, UNIVERSE, type Candle } from "@/lib/market-data";
import { dailyReturns, annualizedVolatility } from "./metrics";

const INDEX_SYMBOLS = ["SPY", "QQQ"];
const SAFE_HAVEN_SYMBOL = "GLD";
const OIL_SYMBOL = "USO";

function cumulativeReturn(closes: Candle[], days: number): number {
  const end = closes[closes.length - 1].close;
  const start = closes[Math.max(0, closes.length - 1 - days)].close;
  return end / start - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type MarketSentiment = {
  score: number; // 0-100
  label: "Miedo extremo" | "Temeroso" | "Cauteloso" | "Optimista" | "Codicia extrema";
  summary: string;
  indicators: {
    indexMomentum20d: number;
    volatilityRatio: number;
    safeHavenSpread20d: number;
    oilMove20d: number;
    breadthPositivePct: number;
  };
};

function labelFor(score: number): MarketSentiment["label"] {
  if (score < 25) return "Miedo extremo";
  if (score < 45) return "Temeroso";
  if (score <= 55) return "Cauteloso";
  if (score <= 75) return "Optimista";
  return "Codicia extrema";
}

/**
 * Sentimiento de mercado 0-100, inspirado en la lógica del "Fear & Greed
 * Index" de CNN pero simplificado a lo que se puede calcular con nuestro
 * universo: momentum de los índices, volatilidad realizada vs su propio
 * nivel base, flujo hacia refugios seguros (oro) y movimiento del petróleo,
 * más qué tan amplia es la subida/bajada en el resto del universo. Es un
 * heurístico de reglas — no reemplaza indicadores reales de mercado como
 * el VIX o el put/call ratio, que Alfia no tiene acceso a día de hoy.
 */
export async function computeMarketSentiment(): Promise<MarketSentiment | null> {
  const indexCloses = await Promise.all(INDEX_SYMBOLS.map((s) => getCloses(s)));
  const goldCloses = await getCloses(SAFE_HAVEN_SYMBOL);
  const oilCloses = await getCloses(OIL_SYMBOL);

  if (indexCloses.some((c) => !c) || !goldCloses || !oilCloses) return null;
  const validIndexCloses = indexCloses as Candle[][];

  // 1. Momentum: retorno promedio de los índices en los últimos 20 días de trading.
  const indexMomentum20d =
    validIndexCloses.reduce((sum, closes) => sum + cumulativeReturn(closes, 20), 0) /
    validIndexCloses.length;

  // 2. Régimen de volatilidad: volatilidad realizada reciente (20d) de los
  // índices vs su propia volatilidad de más largo plazo (todo el histórico
  // disponible). >1 = más nerviosismo del habitual.
  const recentVol =
    validIndexCloses.reduce(
      (sum, closes) => sum + annualizedVolatility(dailyReturns(closes.slice(-21))),
      0,
    ) / validIndexCloses.length;
  const baselineVol =
    validIndexCloses.reduce((sum, closes) => sum + annualizedVolatility(dailyReturns(closes)), 0) /
    validIndexCloses.length;
  const volatilityRatio = baselineVol > 0 ? recentVol / baselineVol : 1;

  // 3. Refugio seguro: cuánto le está ganando el oro a los índices en 20
  // días. Positivo y grande = dinero saliendo de acciones hacia oro = miedo.
  const goldReturn20d = cumulativeReturn(goldCloses, 20);
  const safeHavenSpread20d = goldReturn20d - indexMomentum20d;

  // 4. Petróleo: un salto fuerte de petróleo junto con índices cayendo es la
  // señal de "shock" (ej. geopolítico) que pediste — index buys momentum,
  // this term especially penalizes an oil spike happening while stocks fall.
  const oilMove20d = cumulativeReturn(oilCloses, 20);

  // 5. Amplitud: qué porcentaje del universo tuvo un retorno de 20 días positivo.
  const allCloses = await Promise.all(UNIVERSE.map((a) => getCloses(a.symbol)));
  const validCloses = allCloses.filter((c): c is Candle[] => Boolean(c));
  const breadthPositivePct =
    validCloses.filter((c) => cumulativeReturn(c, 20) > 0).length / validCloses.length;

  let score = 50;
  score += clamp(indexMomentum20d * 300, -25, 25);
  score += clamp((breadthPositivePct - 0.5) * 30, -15, 15);
  score -= clamp(safeHavenSpread20d * 200, 0, 20);
  score -= clamp((volatilityRatio - 1) * 40, 0, 20);
  if (oilMove20d > 0.05 && indexMomentum20d < 0) {
    score -= clamp(oilMove20d * 60, 0, 15);
  }
  score = Math.round(clamp(score, 0, 100));

  const label = labelFor(score);

  const notes: string[] = [];
  if (Math.abs(indexMomentum20d) > 0.01) {
    notes.push(
      `los índices ${indexMomentum20d >= 0 ? "subieron" : "cayeron"} ${(Math.abs(indexMomentum20d) * 100).toFixed(1)}% en 20 días`,
    );
  }
  if (safeHavenSpread20d > 0.02) {
    notes.push(`el oro le ganó a los índices por ${(safeHavenSpread20d * 100).toFixed(1)} puntos — señal de refugio`);
  }
  if (oilMove20d > 0.05 && indexMomentum20d < 0) {
    notes.push(`el petróleo subió ${(oilMove20d * 100).toFixed(1)}% mientras los índices caían — posible shock de oferta`);
  }
  if (volatilityRatio > 1.15) {
    notes.push("la volatilidad reciente está por encima de lo habitual");
  }

  const summary =
    notes.length > 0
      ? `Esta lectura se basa en que ${notes.join(", y ")}.`
      : "El mercado se mueve dentro de rangos normales, sin señales fuertes en ningún sentido.";

  return {
    score,
    label,
    summary,
    indicators: {
      indexMomentum20d,
      volatilityRatio,
      safeHavenSpread20d,
      oilMove20d,
      breadthPositivePct,
    },
  };
}
