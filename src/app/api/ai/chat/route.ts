import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  FINANCIAL_DISCLAIMER,
  OUT_OF_SCOPE_REPLY,
  SYSTEM_PROMPT,
  looksInScope,
} from "@/lib/ai/guardrails";
import { pickModelTier, resolveModel } from "@/lib/ai/router";
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
  const message: string | undefined = body?.message;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "Escribe una pregunta antes de enviarla." },
      { status: 400 },
    );
  }

  if (!looksInScope(message)) {
    return NextResponse.json({
      reply: OUT_OF_SCOPE_REPLY,
      disclaimer: FINANCIAL_DISCLAIMER,
      creditsCharged: 0,
    });
  }

  const cost = CREDIT_COSTS.chat;
  const tier = pickModelTier("chat", message);
  const model = resolveModel(tier);

  let charge;
  try {
    charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: cost,
      queryType: "chat",
      model,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error:
            "No tienes créditos suficientes para esta consulta. Compra más créditos o espera tu próxima recarga mensual.",
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return NextResponse.json({
      reply:
        "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY). Tu consulta quedó registrada y se descontó el crédito correspondiente.",
      disclaimer: FINANCIAL_DISCLAIMER,
      creditsCharged: cost,
      newBalance: charge.newBalance,
    });
  }

  const completion = await anthropic.messages.create({
    model,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  const reply = completion.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return NextResponse.json({
    reply,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: cost,
    newBalance: charge.newBalance,
  });
}
