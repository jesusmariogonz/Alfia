import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore, scoreLabel } from "@/lib/analytics/score";
import { getAnthropicClient } from "@/lib/ai/client";
import { FINANCIAL_DISCLAIMER, SYSTEM_PROMPT } from "@/lib/ai/guardrails";
import { resolveModel } from "@/lib/ai/router";
import { CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/credits";

export type RecommendationAction = "comprar" | "mantener" | "vender";

function parseAction(text: string): RecommendationAction {
  const firstLine = text.trim().split("\n")[0].toLowerCase();
  if (firstLine.includes("comprar")) return "comprar";
  if (firstLine.includes("vender")) return "vender";
  return "mantener";
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
  const asset = symbol ? findAsset(symbol) : undefined;

  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }

  const model = resolveModel("avanzado");
  let charge;
  try {
    charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: CREDIT_COSTS.recomendacion,
      queryType: "recomendacion",
      model,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error:
            "No tienes créditos suficientes para esta recomendación. Compra más créditos en la sección de Créditos.",
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const closes = (await getCloses(asset.symbol))!;
  const metrics = computeRiskMetrics(closes);
  const score = computeAlfiaScore(metrics);

  const anthropic = getAnthropicClient();
  let action: RecommendationAction = "mantener";
  let reasoning =
    "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY). Los datos numéricos son válidos; la recomendación se agregará al configurar la clave.";

  if (anthropic) {
    const prompt = `Analiza ${asset.symbol} (${asset.name}, sector ${asset.sector}) con estos datos:
- Retorno anualizado: ${(metrics.annualizedReturn * 100).toFixed(1)}%
- Volatilidad anualizada: ${(metrics.annualizedVolatility * 100).toFixed(1)}%
- Sharpe ratio: ${metrics.sharpeRatio.toFixed(2)}
- Máximo drawdown: ${(metrics.maxDrawdown * 100).toFixed(1)}%
- Alfia Score: ${score}/100 (${scoreLabel(score)})

Responde en este formato exacto:
Primera línea, solo una palabra en mayúsculas: COMPRAR, MANTENER o VENDER (tu conclusión).
Después, en un párrafo o viñetas (deja una línea en blanco antes), explica el razonamiento en máximo 120 palabras — a qué le das más peso (retorno, riesgo, tendencia) y qué lo haría cambiar. No presentes esto como una garantía ni una señal infalible, es una lectura de las métricas, no una certeza.`;

    const completion = await anthropic.messages.create({
      model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    action = parseAction(text);
    reasoning = text.split("\n").slice(1).join("\n").trim();
  }

  return NextResponse.json({
    asset: { symbol: asset.symbol, name: asset.name },
    action,
    reasoning,
    score,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: CREDIT_COSTS.recomendacion,
    newBalance: charge.newBalance,
  });
}
