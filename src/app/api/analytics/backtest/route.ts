import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { runBacktest, type StrategyConfig } from "@/lib/analytics/backtest";
import { getAnthropicClient } from "@/lib/ai/client";
import { FINANCIAL_DISCLAIMER, SYSTEM_PROMPT } from "@/lib/ai/guardrails";
import { resolveModel } from "@/lib/ai/router";
import { CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/credits";

const DEFAULT_STRATEGY: StrategyConfig = { type: "comprar_mantener" };

const EXTRACTION_PROMPT = `Convierte la descripción de una estrategia de trading a JSON. Responde ÚNICAMENTE con el JSON, sin texto adicional, con una de estas tres formas exactas:

{"type":"comprar_mantener"}
{"type":"cruce_medias","fastWindow":<entero 5-50>,"slowWindow":<entero 20-200, mayor que fastWindow>}
{"type":"rsi","period":<entero 5-30>,"buyBelow":<entero 10-40>,"sellAbove":<entero 60-90>}

Si la descripción no especifica números claros, usa valores razonables por defecto (cruce de medias 20/50, o RSI 14 con compra bajo 30 y venta sobre 70). Si la descripción no corresponde a ninguna de estas estrategias, responde con {"type":"comprar_mantener"}.

Descripción del usuario: "%DESCRIPTION%"`;

function parseStrategy(text: string): StrategyConfig {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return DEFAULT_STRATEGY;
    const parsed = JSON.parse(match[0]);
    if (parsed.type === "cruce_medias" && parsed.fastWindow && parsed.slowWindow) {
      return {
        type: "cruce_medias",
        fastWindow: Number(parsed.fastWindow),
        slowWindow: Number(parsed.slowWindow),
      };
    }
    if (parsed.type === "rsi" && parsed.period && parsed.buyBelow && parsed.sellAbove) {
      return {
        type: "rsi",
        period: Number(parsed.period),
        buyBelow: Number(parsed.buyBelow),
        sellAbove: Number(parsed.sellAbove),
      };
    }
    return DEFAULT_STRATEGY;
  } catch {
    return DEFAULT_STRATEGY;
  }
}

function describeStrategy(strategy: StrategyConfig): string {
  if (strategy.type === "comprar_mantener") return "Comprar y mantener";
  if (strategy.type === "cruce_medias") {
    return `Cruce de medias móviles (${strategy.fastWindow}/${strategy.slowWindow} días)`;
  }
  return `RSI (${strategy.period} días, compra bajo ${strategy.buyBelow}, vende sobre ${strategy.sellAbove})`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const symbol: string | undefined = body?.symbol;
  const description: string | undefined = body?.description;

  const asset = symbol ? findAsset(symbol) : undefined;
  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json(
      { error: "Describe la estrategia que quieres probar." },
      { status: 400 },
    );
  }

  const model = resolveModel("avanzado");
  let charge;
  try {
    charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: CREDIT_COSTS.backtest,
      queryType: "backtest",
      model,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error:
            "No tienes créditos suficientes para este backtest. Compra más créditos en la sección de Créditos.",
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const anthropic = getAnthropicClient();
  let strategy: StrategyConfig = DEFAULT_STRATEGY;
  let interpretation =
    "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY). Se usó 'comprar y mantener' por defecto; los resultados numéricos del backtest son válidos.";

  if (anthropic) {
    const extraction = await anthropic.messages.create({
      model,
      max_tokens: 150,
      messages: [
        { role: "user", content: EXTRACTION_PROMPT.replace("%DESCRIPTION%", description) },
      ],
    });
    const extractionText = extraction.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    strategy = parseStrategy(extractionText);
  }

  const closes = (await getCloses(asset.symbol))!;
  const result = runBacktest(closes, strategy);

  if (anthropic) {
    const prompt = `Un usuario probó esta estrategia sobre ${asset.symbol} (${asset.name}) en los últimos 2 años: "${describeStrategy(strategy)}", interpretada a partir de su descripción: "${description}".

Resultados del backtest:
- Retorno de la estrategia: ${(result.strategyReturn * 100).toFixed(1)}%
- Retorno de comprar y mantener (benchmark): ${(result.benchmarkReturn * 100).toFixed(1)}%
- Máximo drawdown de la estrategia: ${(result.strategyMaxDrawdown * 100).toFixed(1)}%
- Número de operaciones: ${result.trades}

Escribe en español, máximo 120 palabras, una interpretación de si la estrategia superó o no al benchmark y qué implica el número de operaciones (más operaciones = más sensible a comisiones y errores de ejecución en la vida real). No la presentes como garantía de resultados futuros.`;

    const completion = await anthropic.messages.create({
      model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    interpretation = completion.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  return NextResponse.json({
    asset: { symbol: asset.symbol, name: asset.name },
    strategy,
    strategyLabel: describeStrategy(strategy),
    result,
    interpretation,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: CREDIT_COSTS.backtest,
    newBalance: charge.newBalance,
  });
}
