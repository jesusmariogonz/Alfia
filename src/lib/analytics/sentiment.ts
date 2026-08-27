import { getCloses, UNIVERSE, type Candle } from "@/lib/market-data";
import { dailyReturns, annualizedVolatility } from "./metrics";

const INDEX_SYMBOLS = ["SPY", "QQQ"];
const BOND_SYMBOL = "TLT"; // refugio seguro real (igual que CNN: bonos, no oro)
const GOLD_SYMBOL = "GLD"; // señal complementaria, no está en el índice original de CNN
const OIL_SYMBOL = "USO"; // solo para el texto explicativo, no pondera el score

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normaliza un valor a un sub-score 0-100 dado el rango que se considera "normal". */
function toSubScore(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function cumulativeReturn(closes: Candle[], days: number): number {
  const end = closes[closes.length - 1].close;
  const start = closes[Math.max(0, closes.length - 1 - days)].close;
  return end / start - 1;
}

function sma(closes: Candle[], days: number): number {
  const window = closes.slice(-days);
  return window.reduce((sum, c) => sum + c.close, 0) / window.length;
}

export type MarketSentiment = {
  score: number; // 0-100
  label: "Miedo extremo" | "Temeroso" | "Cauteloso" | "Optimista" | "Codicia extrema";
  summary: string;
  indicators: {
    momentum: number;
    priceStrength: number;
    volatility: number;
    safeHavenDemand: number;
    breadth: number;
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
 * Sentimiento de mercado 0-100, homologado con la metodología del "Fear &
 * Greed Index" de CNN: varios indicadores con el MISMO peso cada uno,
 * cada uno normalizado según qué tanto se desvía de su propio promedio
 * (no ajustes arbitrarios). CNN usa 7 indicadores; Alfia puede calcular 5
 * de esos 7 con los datos disponibles:
 *
 *   1. Momentum      — precio del índice vs su propia media de 125 días.
 *   2. Fortaleza      — % de activos del universo cerca de su máximo de 1
 *                        año vs cerca de su mínimo (proxy de "52-week highs
 *                        vs lows" de CNN, que usa todo el NYSE).
 *   3. Volatilidad    — volatilidad realizada reciente vs la propia de más
 *                        largo plazo (proxy del VIX, que CNN sí tiene acceso
 *                        directo).
 *   4. Refugio seguro — bonos de largo plazo (TLT) vs índices en 20 días,
 *                        igual que CNN (bonos, no oro).
 *   5. Amplitud       — % del universo con retorno de 20 días positivo
 *                        (proxy sin volumen del "McClellan Volume Summation
 *                        Index" de CNN, que si usa volumen real de NYSE).
 *
 * Quedan fuera, por falta de datos: put/call options y demanda de junk
 * bonds (ninguno de los dos tiene una fuente conectada hoy). El oro y el
 * petróleo no son parte del índice de CNN — se usan aquí solo para el
 * texto explicativo, no para el número, porque fueron el ejemplo concreto
 * que pediste (guerra → sube petróleo → cae mercado → sube oro).
 */
export async function computeMarketSentiment(): Promise<MarketSentiment | null> {
  const [indexClosesRaw, bondCloses, goldCloses, oilCloses] = await Promise.all([
    Promise.all(INDEX_SYMBOLS.map((s) => getCloses(s))),
    getCloses(BOND_SYMBOL),
    getCloses(GOLD_SYMBOL),
    getCloses(OIL_SYMBOL),
  ]);

  if (indexClosesRaw.some((c) => !c) || !bondCloses) return null;
  const indexCloses = indexClosesRaw as Candle[][];

  // 1. Momentum: precio actual vs media de 125 días (o el histórico
  // disponible si es más corto), promediado entre los índices.
  const momentum =
    indexCloses.reduce((sum, closes) => {
      const last = closes[closes.length - 1].close;
      const ma = sma(closes, Math.min(125, closes.length));
      return sum + (last / ma - 1);
    }, 0) / indexCloses.length;
  const momentumScore = toSubScore(momentum, -0.08, 0.08);

  // 2. Fortaleza: activos a <5% de su máximo de 1 año vs a <5% de su mínimo.
  const allCloses = (await Promise.all(UNIVERSE.map((a) => getCloses(a.symbol)))).filter(
    (c): c is Candle[] => Boolean(c),
  );
  let nearHigh = 0;
  let nearLow = 0;
  for (const closes of allCloses) {
    const window = closes.slice(-252);
    const last = window[window.length - 1].close;
    const yearHigh = Math.max(...window.map((c) => c.close));
    const yearLow = Math.min(...window.map((c) => c.close));
    if (last >= yearHigh * 0.95) nearHigh++;
    if (last <= yearLow * 1.05) nearLow++;
  }
  const priceStrengthScore =
    nearHigh + nearLow === 0 ? 50 : (nearHigh / (nearHigh + nearLow)) * 100;

  // 3. Volatilidad: realizada reciente (21d) vs la propia de largo plazo.
  const recentVol =
    indexCloses.reduce((sum, closes) => sum + annualizedVolatility(dailyReturns(closes.slice(-21))), 0) /
    indexCloses.length;
  const baselineVol =
    indexCloses.reduce((sum, closes) => sum + annualizedVolatility(dailyReturns(closes)), 0) /
    indexCloses.length;
  const volatilityRatio = baselineVol > 0 ? recentVol / baselineVol : 1;
  // Ratio alto = más miedo = score bajo, por eso se invierte (100 - ...).
  const volatilityScore = 100 - toSubScore(volatilityRatio, 0.7, 1.6);

  // 4. Refugio seguro: retorno de 20 días de los índices menos el de bonos.
  // Índices ganándole a bonos = apetito por riesgo = greed (score alto).
  const indexReturn20d =
    indexCloses.reduce((sum, closes) => sum + cumulativeReturn(closes, 20), 0) / indexCloses.length;
  const bondReturn20d = cumulativeReturn(bondCloses, 20);
  const safeHavenSpread = indexReturn20d - bondReturn20d;
  const safeHavenScore = toSubScore(safeHavenSpread, -0.08, 0.08);

  // 5. Amplitud: % del universo con retorno de 20 días positivo.
  const breadthScore =
    (allCloses.filter((c) => cumulativeReturn(c, 20) > 0).length / allCloses.length) * 100;

  const score = Math.round(
    (momentumScore + priceStrengthScore + volatilityScore + safeHavenScore + breadthScore) / 5,
  );
  const label = labelFor(score);

  const notes: string[] = [];
  if (Math.abs(indexReturn20d) > 0.01) {
    notes.push(
      `los índices ${indexReturn20d >= 0 ? "subieron" : "cayeron"} ${(Math.abs(indexReturn20d) * 100).toFixed(1)}% en 20 días`,
    );
  }
  if (bondReturn20d - indexReturn20d > 0.02) {
    notes.push("los bonos le están ganando a las acciones — señal clásica de refugio ante el miedo");
  }
  if (goldCloses) {
    const goldReturn20d = cumulativeReturn(goldCloses, 20);
    if (goldReturn20d - indexReturn20d > 0.02) {
      notes.push(`el oro subió ${(goldReturn20d * 100).toFixed(1)}% más que los índices en 20 días`);
    }
  }
  if (oilCloses) {
    const oilReturn20d = cumulativeReturn(oilCloses, 20);
    if (oilReturn20d > 0.05 && indexReturn20d < 0) {
      notes.push(
        `el petróleo subió ${(oilReturn20d * 100).toFixed(1)}% mientras los índices caían — posible shock de oferta`,
      );
    }
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
      momentum: momentumScore,
      priceStrength: priceStrengthScore,
      volatility: volatilityScore,
      safeHavenDemand: safeHavenScore,
      breadth: breadthScore,
    },
  };
}
