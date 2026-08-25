import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset } from "@/lib/market-data";
import { runMonteCarlo } from "@/lib/analytics/montecarlo";
import { getAnthropicClient } from "@/lib/ai/client";
import { FINANCIAL_DISCLAIMER, SYSTEM_PROMPT } from "@/lib/ai/guardrails";
import { resolveModel } from "@/lib/ai/router";
import { CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/credits";

const MAX_HORIZON_DAYS = 252 * 5;
const SIMULATIONS = 2000;

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
  const initialAmount = Number(body?.initialAmount);
  const horizonDays = Number(body?.horizonDays);

  const asset = symbol ? findAsset(symbol) : undefined;
  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }
  if (!Number.isFinite(initialAmount) || initialAmount <= 0) {
    return NextResponse.json(
      { error: "Ingresa un monto inicial válido." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(horizonDays) || horizonDays < 5 || horizonDays > MAX_HORIZON_DAYS) {
    return NextResponse.json(
      { error: `El horizonte debe estar entre 5 y ${MAX_HORIZON_DAYS} días.` },
      { status: 400 },
    );
  }

  const model = resolveModel("avanzado");
  let charge;
  try {
    charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: CREDIT_COSTS.montecarlo,
      queryType: "montecarlo",
      model,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error:
            "No tienes créditos suficientes para correr una simulación. Compra más créditos en la sección de Créditos.",
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const result = runMonteCarlo({
    initialAmount,
    annualDrift: asset.annualDrift,
    annualVolatility: asset.annualVolatility,
    horizonDays,
    simulations: SIMULATIONS,
  });

  const anthropic = getAnthropicClient();
  let interpretation =
    "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY). Los resultados numéricos de la simulación son válidos; la interpretación en lenguaje natural se agregará al configurar la clave.";

  if (anthropic) {
    const years = (horizonDays / 252).toFixed(1);
    const prompt = `Un usuario simuló invertir $${initialAmount.toLocaleString("es")} en ${asset.symbol} (${asset.name}) durante ${years} años usando ${SIMULATIONS} simulaciones de Montecarlo con deriva anual de ${(asset.annualDrift * 100).toFixed(1)}% y volatilidad anual de ${(asset.annualVolatility * 100).toFixed(1)}%.

Resultados:
- Percentil 5 (escenario pesimista): $${result.percentiles.p5.toFixed(0)}
- Percentil 50 (mediana): $${result.percentiles.p50.toFixed(0)}
- Percentil 95 (escenario optimista): $${result.percentiles.p95.toFixed(0)}
- Probabilidad de terminar con pérdida: ${(result.probabilityOfLoss * 100).toFixed(1)}%

Escribe una interpretación breve (máximo 120 palabras) en español, en lenguaje natural, de lo que estos escenarios significan. No lo describas como una predicción garantizada — enfatiza que son escenarios probabilísticos.`;

    const completion = await anthropic.messages.create({
      model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    interpretation = completion.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  return NextResponse.json({
    asset: { symbol: asset.symbol, name: asset.name },
    result,
    interpretation,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: CREDIT_COSTS.montecarlo,
    newBalance: charge.newBalance,
  });
}
