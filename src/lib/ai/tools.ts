import type Anthropic from "@anthropic-ai/sdk";
import { findAsset, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore, scoreLabel } from "@/lib/analytics/score";
import { runMonteCarlo } from "@/lib/analytics/montecarlo";
import { runBacktest, type StrategyConfig } from "@/lib/analytics/backtest";
import { CREDIT_COSTS } from "@/lib/credits";
import type { QueryType } from "@/types/database";

/**
 * Herramientas que el chat de Alfia (Pro) puede invocar por su cuenta
 * durante una conversación — reemplazan las pantallas dedicadas de
 * Montecarlo/comparador/backtest/recomendación. Cada una cuesta créditos
 * por separado (ver TOOL_CREDIT_COSTS) además del costo base del mensaje,
 * reflejando que son análisis más pesados que una respuesta de texto simple.
 */
export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "run_montecarlo",
    description:
      "Corre una simulación de Montecarlo (2,000 escenarios) para proyectar el valor futuro de una inversión en un activo específico. Úsala cuando el usuario pregunte por proyecciones, escenarios futuros, o 'qué pasaría si invierto X en Y'.",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Símbolo del activo, ej. AAPL" },
        initialAmount: { type: "number", description: "Monto inicial en USD" },
        horizonDays: {
          type: "number",
          description: "Horizonte en días de trading (252 = 1 año). Entre 5 y 1260.",
        },
      },
      required: ["symbol", "initialAmount", "horizonDays"],
    },
  },
  {
    name: "compare_assets",
    description:
      "Compara las métricas de riesgo y retorno de dos activos. Úsala cuando el usuario pida comparar, poner lado a lado, o preguntar cuál de dos activos es mejor en algún sentido.",
    input_schema: {
      type: "object",
      properties: {
        symbolA: { type: "string" },
        symbolB: { type: "string" },
      },
      required: ["symbolA", "symbolB"],
    },
  },
  {
    name: "run_backtest",
    description:
      "Prueba una estrategia de trading contra los últimos 2 años de precios de un activo, comparada contra comprar y mantener. Úsala cuando el usuario describa una estrategia de compra/venta y quiera saber cómo le hubiera ido.",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        strategy: {
          type: "object",
          description: "Estrategia extraída de la descripción del usuario.",
          properties: {
            type: {
              type: "string",
              enum: ["comprar_mantener", "cruce_medias", "rsi"],
            },
            fastWindow: { type: "number", description: "Solo para cruce_medias, 5-50" },
            slowWindow: { type: "number", description: "Solo para cruce_medias, 20-200" },
            period: { type: "number", description: "Solo para rsi, 5-30" },
            buyBelow: { type: "number", description: "Solo para rsi, 10-40" },
            sellAbove: { type: "number", description: "Solo para rsi, 60-90" },
          },
          required: ["type"],
        },
      },
      required: ["symbol", "strategy"],
    },
  },
  {
    name: "get_recommendation",
    description:
      "Obtiene las métricas de riesgo y el Alfia Score de un activo para fundamentar una recomendación de comprar, mantener o vender. Úsala cuando el usuario pregunte directamente si debería comprar, vender o mantener algo.",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string" },
      },
      required: ["symbol"],
    },
  },
];

export const TOOL_QUERY_TYPE: Record<string, QueryType> = {
  run_montecarlo: "montecarlo",
  compare_assets: "comparador",
  run_backtest: "backtest",
  get_recommendation: "recomendacion",
};

/** Costo en créditos de cada herramienta, además del costo base del mensaje. */
export const TOOL_CREDIT_COSTS: Record<string, number> = Object.fromEntries(
  Object.entries(TOOL_QUERY_TYPE).map(([tool, queryType]) => [tool, CREDIT_COSTS[queryType]]),
);

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (toolName) {
    case "run_montecarlo": {
      const symbol = String(input.symbol ?? "");
      const asset = findAsset(symbol);
      if (!asset) return JSON.stringify({ error: `Activo ${symbol} no encontrado.` });

      const horizonDays = Math.min(1260, Math.max(5, Number(input.horizonDays) || 252));
      const initialAmount = Number(input.initialAmount) || 0;
      if (initialAmount <= 0) return JSON.stringify({ error: "Monto inicial inválido." });

      const closes = await getCloses(asset.symbol);
      if (!closes) return JSON.stringify({ error: "No hay datos para este activo." });

      const result = runMonteCarlo({
        initialAmount,
        annualDrift: asset.annualDrift,
        annualVolatility: asset.annualVolatility,
        horizonDays,
        simulations: 2000,
      });

      return JSON.stringify({
        asset: asset.symbol,
        initialAmount,
        horizonDays,
        percentiles: result.percentiles,
        probabilityOfLoss: result.probabilityOfLoss,
      });
    }

    case "compare_assets": {
      const symbolA = String(input.symbolA ?? "");
      const symbolB = String(input.symbolB ?? "");
      const assetA = findAsset(symbolA);
      const assetB = findAsset(symbolB);
      if (!assetA || !assetB) {
        return JSON.stringify({ error: "Uno o ambos activos no se encontraron." });
      }

      const [closesA, closesB] = await Promise.all([
        getCloses(assetA.symbol),
        getCloses(assetB.symbol),
      ]);
      if (!closesA || !closesB) {
        return JSON.stringify({ error: "No hay datos para uno de los activos." });
      }

      const metricsA = computeRiskMetrics(closesA);
      const metricsB = computeRiskMetrics(closesB);

      return JSON.stringify({
        [assetA.symbol]: { sector: assetA.sector, ...metricsA },
        [assetB.symbol]: { sector: assetB.sector, ...metricsB },
      });
    }

    case "run_backtest": {
      const symbol = String(input.symbol ?? "");
      const asset = findAsset(symbol);
      if (!asset) return JSON.stringify({ error: `Activo ${symbol} no encontrado.` });

      const strategy = input.strategy as StrategyConfig | undefined;
      if (!strategy?.type) {
        return JSON.stringify({ error: "Estrategia inválida." });
      }

      const closes = await getCloses(asset.symbol);
      if (!closes) return JSON.stringify({ error: "No hay datos para este activo." });

      const result = runBacktest(closes, strategy);

      return JSON.stringify({
        asset: asset.symbol,
        strategy,
        strategyReturn: result.strategyReturn,
        benchmarkReturn: result.benchmarkReturn,
        strategyMaxDrawdown: result.strategyMaxDrawdown,
        trades: result.trades,
      });
    }

    case "get_recommendation": {
      const symbol = String(input.symbol ?? "");
      const asset = findAsset(symbol);
      if (!asset) return JSON.stringify({ error: `Activo ${symbol} no encontrado.` });

      const closes = await getCloses(asset.symbol);
      if (!closes) return JSON.stringify({ error: "No hay datos para este activo." });

      const metrics = computeRiskMetrics(closes);
      const score = computeAlfiaScore(metrics);

      return JSON.stringify({
        asset: asset.symbol,
        sector: asset.sector,
        ...metrics,
        alfiaScore: score,
        alfiaScoreLabel: scoreLabel(score),
      });
    }

    default:
      return JSON.stringify({ error: `Herramienta desconocida: ${toolName}` });
  }
}
