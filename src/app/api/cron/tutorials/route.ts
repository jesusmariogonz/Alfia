import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/ai/client";
import { resolveModel } from "@/lib/ai/router";
import { TUTORIAL_TOPICS } from "@/lib/content/tutorial-topics";

const MIN_HOURS_BETWEEN_POSTS = 44; // un poco menos de 2 días, tolera jitter del cron

/**
 * Publica un tutorial nuevo cada ~2 días (ver TUTORIAL_TOPICS), escrito por
 * Claude a partir del siguiente tema pendiente de la cola. Pensado para
 * correr diario vía Vercel Cron — el propio endpoint decide si ya toca
 * publicar o si hay que esperar, así que correrlo de más no duplica notas.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("tutorials")
    .select("slug, published_at")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    const hoursSince = (Date.now() - new Date(latest.published_at).getTime()) / (60 * 60 * 1000);
    if (hoursSince < MIN_HOURS_BETWEEN_POSTS) {
      return NextResponse.json({ published: false, reason: "todavía no toca", hoursSince });
    }
  }

  const { data: existing } = await admin.from("tutorials").select("slug");
  const existingSlugs = new Set((existing ?? []).map((t) => t.slug));
  const nextTopic = TUTORIAL_TOPICS.find((t) => !existingSlugs.has(t.slug));

  if (!nextTopic) {
    return NextResponse.json({ published: false, reason: "no quedan temas en la cola" });
  }

  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return NextResponse.json({
      published: false,
      reason: "ANTHROPIC_API_KEY no configurada.",
    });
  }

  const response = await anthropic.messages.create({
    model: resolveModel("economico"),
    max_tokens: 1200,
    system:
      "Escribes notas educativas cortas de finanzas personales/inversión para Alfia, una plataforma de análisis de mercado. Tono: claro, directo, sin jerga innecesaria, en español neutro. Nunca das recomendaciones de compra/venta específicas — solo explicas el concepto. Responde ÚNICAMENTE con un objeto JSON válido, sin texto extra, con este formato exacto: {\"title\": string, \"summary\": string (una oración), \"minutes\": number (tiempo de lectura, 3-6), \"content\": string[] (3-5 párrafos)}.",
    messages: [
      {
        role: "user",
        content: `Escribe la nota educativa sobre: "${nextTopic.topic}".`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ published: false, reason: "Claude no devolvió texto." }, { status: 502 });
  }

  let parsed: { title: string; summary: string; minutes: number; content: string[] };
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
  } catch {
    return NextResponse.json({ published: false, reason: "Respuesta no era JSON válido." }, { status: 502 });
  }

  const { error } = await admin.from("tutorials").insert({
    slug: nextTopic.slug,
    title: parsed.title,
    summary: parsed.summary,
    minutes: parsed.minutes,
    content: parsed.content,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ published: true, slug: nextTopic.slug, title: parsed.title });
}
