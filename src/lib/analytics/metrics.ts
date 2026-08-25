import type { Candle } from "@/lib/market-data";

const TRADING_DAYS_PER_YEAR = 252;

export function dailyReturns(closes: Candle[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(closes[i].close / closes[i - 1].close - 1);
  }
  return returns;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  const m = mean(xs);
  const variance = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(variance);
}

/** Retorno total del periodo, anualizado (CAGR aproximado). */
export function annualizedReturn(closes: Candle[]): number {
  const totalReturn = closes[closes.length - 1].close / closes[0].close - 1;
  const years = closes.length / TRADING_DAYS_PER_YEAR;
  return (1 + totalReturn) ** (1 / years) - 1;
}

export function annualizedVolatility(returns: number[]): number {
  return stdDev(returns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/** Sharpe ratio con tasa libre de riesgo anual (default 4%). */
export function sharpeRatio(
  returns: number[],
  riskFreeAnnual = 0.04,
): number {
  const meanDailyReturn = mean(returns);
  const riskFreeDaily = riskFreeAnnual / TRADING_DAYS_PER_YEAR;
  const excessDaily = meanDailyReturn - riskFreeDaily;
  const dailyStd = stdDev(returns);
  if (dailyStd === 0) return 0;
  return (excessDaily / dailyStd) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/** Máxima caída desde un pico histórico, como fracción negativa (ej. -0.32). */
export function maxDrawdown(closes: Candle[]): number {
  let peak = closes[0].close;
  let worst = 0;
  for (const { close } of closes) {
    if (close > peak) peak = close;
    const drawdown = close / peak - 1;
    if (drawdown < worst) worst = drawdown;
  }
  return worst;
}

/**
 * Value at Risk histórico: la pérdida diaria (como fracción positiva) que no
 * se supera con `confidence` de probabilidad. Ej. VaR 95% de 0.032 significa
 * que en el 95% de los días la pérdida no superó el 3.2%.
 */
export function valueAtRisk(returns: number[], confidence = 0.95): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const worstReturn = sorted[Math.max(0, index)];
  return Math.max(0, -worstReturn);
}

export type RiskMetrics = {
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk95: number;
};

export function computeRiskMetrics(closes: Candle[]): RiskMetrics {
  const returns = dailyReturns(closes);
  return {
    annualizedReturn: annualizedReturn(closes),
    annualizedVolatility: annualizedVolatility(returns),
    sharpeRatio: sharpeRatio(returns),
    maxDrawdown: maxDrawdown(closes),
    valueAtRisk95: valueAtRisk(returns, 0.95),
  };
}
