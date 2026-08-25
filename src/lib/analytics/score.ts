import type { RiskMetrics } from "./metrics";

/** Comprime un valor a [0, 1] dado un rango esperado, recortando los extremos. */
function normalize(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Alfia Score (0-100): un puntaje propio que combina retorno ajustado por
 * riesgo (Sharpe), retorno anualizado, volatilidad y máximo drawdown en un
 * solo número fácil de comparar entre activos. No es una recomendación de
 * compra — es una forma de resumir cuatro métricas en una sola cifra para
 * ordenar/filtrar rápido; el detalle siempre está disponible en las
 * métricas individuales.
 */
export function computeAlfiaScore(metrics: RiskMetrics): number {
  const sharpeComponent = normalize(metrics.sharpeRatio, -1, 2.5);
  const returnComponent = normalize(metrics.annualizedReturn, -0.3, 0.4);
  const volatilityComponent = 1 - normalize(metrics.annualizedVolatility, 0.1, 0.8);
  const drawdownComponent = 1 - normalize(-metrics.maxDrawdown, 0.1, 0.7);

  const weighted =
    sharpeComponent * 0.4 +
    returnComponent * 0.25 +
    volatilityComponent * 0.2 +
    drawdownComponent * 0.15;

  return Math.round(weighted * 100);
}

export function scoreLabel(score: number): "Sólido" | "Moderado" | "Riesgoso" {
  if (score >= 65) return "Sólido";
  if (score >= 40) return "Moderado";
  return "Riesgoso";
}
