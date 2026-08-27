import type { Candle } from "@/lib/market-data";
import { maxDrawdown } from "./metrics";

export type StrategyConfig =
  | { type: "comprar_mantener" }
  | { type: "cruce_medias"; fastWindow: number; slowWindow: number }
  | { type: "rsi"; period: number; buyBelow: number; sellAbove: number };

export type BacktestResult = {
  strategyReturn: number;
  benchmarkReturn: number;
  strategyMaxDrawdown: number;
  trades: number;
  equityCurve: { day: number; strategy: number; benchmark: number }[];
};

function sma(values: number[], window: number, index: number): number | null {
  if (index + 1 < window) return null;
  let sum = 0;
  for (let i = index - window + 1; i <= index; i++) sum += values[i];
  return sum / window;
}

function rsi(values: number[], period: number, index: number): number | null {
  if (index + 1 < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = index - period + 1; i <= index; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Backtest simple sobre precios de cierre diarios: simula "estar dentro"
 * (100% invertido) o "estar fuera" (100% en efectivo, sin costo/beneficio)
 * según la señal de la estrategia, día a día, y compara contra comprar y
 * mantener. Sin apalancamiento, sin comisiones — es una aproximación
 * educativa, no un motor de ejecución real.
 */
export function runBacktest(closes: Candle[], strategy: StrategyConfig): BacktestResult {
  const prices = closes.map((c) => c.close);
  let inPosition = strategy.type === "comprar_mantener";
  let trades = 0;

  let strategyValue = 1;
  let benchmarkValue = 1;
  const equityCurve: BacktestResult["equityCurve"] = [
    { day: 0, strategy: 1, benchmark: 1 },
  ];
  const strategyValues: number[] = [1];

  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = prices[i] / prices[i - 1] - 1;
    benchmarkValue *= 1 + dailyReturn;

    if (strategy.type === "comprar_mantener") {
      inPosition = true;
    } else if (strategy.type === "cruce_medias") {
      const fast = sma(prices, strategy.fastWindow, i);
      const slow = sma(prices, strategy.slowWindow, i);
      if (fast !== null && slow !== null) {
        const shouldBeIn = fast > slow;
        if (shouldBeIn !== inPosition) trades++;
        inPosition = shouldBeIn;
      }
    } else if (strategy.type === "rsi") {
      const value = rsi(prices, strategy.period, i);
      if (value !== null) {
        if (!inPosition && value < strategy.buyBelow) {
          inPosition = true;
          trades++;
        } else if (inPosition && value > strategy.sellAbove) {
          inPosition = false;
          trades++;
        }
      }
    }

    strategyValue *= 1 + (inPosition ? dailyReturn : 0);
    strategyValues.push(strategyValue);
    equityCurve.push({ day: i, strategy: strategyValue, benchmark: benchmarkValue });
  }

  const syntheticCloses: Candle[] = strategyValues.map((v, i) => ({
    date: closes[i].date,
    close: v,
    open: v,
    high: v,
    low: v,
  }));

  return {
    strategyReturn: strategyValue - 1,
    benchmarkReturn: benchmarkValue - 1,
    strategyMaxDrawdown: maxDrawdown(syntheticCloses),
    trades,
    equityCurve,
  };
}
