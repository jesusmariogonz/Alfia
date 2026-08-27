import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  FINANCIAL_DISCLAIMER,
  OUT_OF_SCOPE_REPLY,
  SYSTEM_PROMPT,
  looksInScope,
} from "@/lib/ai/guardrails";
import { resolveModel } from "@/lib/ai/router";
import { CHAT_TOOLS, TOOL_CREDIT_COSTS, TOOL_QUERY_TYPE, executeTool } from "@/lib/ai/tools";
import { CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/credits";
import { canUseChat } from "@/lib/plan";
import type { Profile } from "@/types/database";

const MAX_TOOL_ITERATIONS = 4;

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!canUseChat(profile?.plan ?? "free")) {
    return NextResponse.json(
      { error: "El chat de inversión es una función del plan Pro." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const history: ChatTurn[] | undefined = body?.messages;
  const lastMessage = history?.[history.length - 1];

  if (!history || !lastMessage || lastMessage.role !== "user" || !lastMessage.content?.trim()) {
    return NextResponse.json(
      { error: "Escribe una pregunta antes de enviarla." },
      { status: 400 },
    );
  }

  if (!looksInScope(lastMessage.content)) {
    return NextResponse.json({
      reply: OUT_OF_SCOPE_REPLY,
      disclaimer: FINANCIAL_DISCLAIMER,
      creditsCharged: 0,
    });
  }

  const model = resolveModel("avanzado");

  let totalCharged = 0;
  let newBalance = 0;
  try {
    const charge = await chargeCredits(supabase, {
      userId: user.id,
      amount: CREDIT_COSTS.chat,
      queryType: "chat",
      model,
    });
    totalCharged += CREDIT_COSTS.chat;
    newBalance = charge.newBalance;
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
      creditsCharged: totalCharged,
      newBalance,
    });
  }

  const messages: Anthropic.MessageParam[] = history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  let reply = "";

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const completion = await anthropic.messages.create({
      model,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      tools: CHAT_TOOLS,
      messages,
    });

    if (completion.stop_reason !== "tool_use") {
      reply = completion.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      break;
    }

    messages.push({ role: "assistant", content: completion.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of completion.content) {
      if (block.type !== "tool_use") continue;

      const toolCost = TOOL_CREDIT_COSTS[block.name];
      let resultText: string;
      try {
        const charge = await chargeCredits(supabase, {
          userId: user.id,
          amount: toolCost,
          queryType: TOOL_QUERY_TYPE[block.name],
          model,
        });
        totalCharged += toolCost;
        newBalance = charge.newBalance;
        resultText = await executeTool(block.name, block.input as Record<string, unknown>);
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          resultText = JSON.stringify({
            error:
              "El usuario no tiene créditos suficientes para este análisis. Explícale eso brevemente y sugiere comprar más créditos, sin inventar un resultado.",
          });
        } else {
          throw err;
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText,
      });
    }

    messages.push({ role: "user", content: toolResults });

    if (iteration === MAX_TOOL_ITERATIONS - 1) {
      reply =
        "Se necesitaron demasiados pasos para responder esto — intenta dividir tu pregunta en partes más simples.";
    }
  }

  return NextResponse.json({
    reply,
    disclaimer: FINANCIAL_DISCLAIMER,
    creditsCharged: totalCharged,
    newBalance,
  });
}
