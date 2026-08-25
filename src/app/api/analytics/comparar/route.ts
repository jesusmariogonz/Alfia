import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { getAnthropicClient } from "@/lib/ai/client";
import { FINANCIAL_DISCLAIMER, SYSTEM_PROMPT } from "@/lib/ai/guardrails";
import { resolveModel } from "@/lib/ai/router";
import { CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/credits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const symbolA: string | undefined = body?.symbolA;
  const symbolB: string | undefined = body?.symbolB;

  const assetA = symbolA ? findAsset(symbolA) : undefined;
  const assetB = symbolB ? findAsset(symbolB) : undefined;

  if (!assetA || !assetB) {
    return NextResponse.json(
      { error: "Elige dos activos válidos para comparar." },
      { status: 404 },
    );
  }
  if (assetA.symbol === assetB.symbol) {
    return NextResponse.json(
      { error: "Elige dos activos distintos." },
      { status: 400 },
    );
  }

  const model = resolveModel("avanzado");
  let charge;
  try {
    charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: CREDIT_COSTS.comparador,
      queryType: "comparador",
      model,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error:
            "No tienes créditos suficientes para esta comparación. Compra más créditos en la sección de Créditos.",
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const metricsA = computeRiskMetrics(getCloses(assetA.symbol)!);
  const metricsB = computeRiskMetrics(getCloses(assetB.symbol)!);

  const anthropic = getAnthropicClient();
  let interpretation =
    "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY). Las métricas numéricas de la comparación son válidas; la interpretación se agregará al configurar la clave.";

  if (anthropic) {
    const prompt = `Compara estos dos activos para un usuario, en español, en máximo 150 palabras:

${assetA.symbol} (${assetA.name}, sector ${assetA.sector}):
- Retorno anualizado: ${(metricsA.annualizedReturn * 100).toFixed(1)}%
- Volatilidad anualizada: ${(metricsA.annualizedVolatility * 100).toFixed(1)}%
- Sharpe: ${metricsA.sharpeRatio.toFixed(2)}
- Máximo drawdown: ${(metricsA.maxDrawdown * 100).toFixed(1)}%

${assetB.symbol} (${assetB.name}, sector ${assetB.sector}):
- Retorno anualizado: ${(metricsB.annualizedReturn * 100).toFixed(1)}%
- Volatilidad anualizada: ${(metricsB.annualizedVolatility * 100).toFixed(1)}%
- Sharpe: ${metricsB.sharpeRatio.toFixed(2)}
- Máximo drawdown: ${(metricsB.maxDrawdown * 100).toFixed(1)}%

Explica las diferencias clave de riesgo/retorno sin recomendar cuál comprar.`;

    const completion = await anthropic.messages.create({
      model,
      max_tokens: 450,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    interpretation = completion.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  return NextResponse.json({
    a: { asset: assetA, metrics: metricsA },
    b: { asset: assetB, metrics: metricsB },
    interpretation,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: CREDIT_COSTS.comparador,
    newBalance: charge.newBalance,
  });
}
