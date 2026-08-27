import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBriefing, hasSomethingWorthReporting } from "@/lib/analytics/briefing";
import type { BriefingType } from "@/types/database";

const VALID_TYPES: BriefingType[] = ["apertura", "intradia", "cierre"];

/**
 * Genera un briefing de mercado. El tipo viene por query param
 * (?type=apertura|intradia|cierre) porque los tres se disparan en
 * horarios distintos vía GitHub Actions (ver .github/workflows/cron-
 * briefing.yml) — Vercel Cron en Hobby no soporta 3 horarios/día.
 * "intradia" solo publica si hasSomethingWorthReporting() detecta un
 * movimiento de índice relevante o varias noticias con sentimiento fuerte
 * recientes; los otros dos siempre publican.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") as BriefingType | null;
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type inválido, debe ser uno de: ${VALID_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  if (type === "intradia") {
    const worthIt = await hasSomethingWorthReporting();
    if (!worthIt) {
      return NextResponse.json({ published: false, reason: "nada relevante detectado" });
    }
  }

  const briefing = await generateBriefing(type);
  if (!briefing) {
    return NextResponse.json(
      { published: false, reason: "ANTHROPIC_API_KEY no configurada o Claude no respondió." },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("market_briefings").insert({
    type,
    title: briefing.title,
    content: briefing.content,
    refers_to: briefing.refersTo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ published: true, type, title: briefing.title });
}
