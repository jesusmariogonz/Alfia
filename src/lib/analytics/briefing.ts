import { getQuote } from "@/lib/market-data";
import { computeDailyReport } from "./daily-report";
import { getAnthropicClient } from "@/lib/ai/client";
import { resolveModel } from "@/lib/ai/router";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketBriefing, BriefingType } from "@/types/database";

const INDEX_SYMBOLS = ["SPY", "QQQ"];
const INTERESTING_MOVE_THRESHOLD = 0.01; // 1% intradía en un índice
const NEWS_LOOKBACK_HOURS = 5;
const STRONG_SENTIMENT_COUNT_THRESHOLD = 3;

/**
 * El briefing de "intradia" solo se publica si pasó algo — evita mandar
 * un briefing vacío a media sesión todos los días. Se considera relevante
 * si algún índice se movió más de 1% intradía, o si hubo varias noticias
 * con sentimiento marcado (no neutral) en las últimas horas.
 */
export async function hasSomethingWorthReporting(): Promise<boolean> {
  const quotes = await Promise.all(INDEX_SYMBOLS.map((s) => getQuote(s)));
  const bigMove = quotes.some((q) => q && Math.abs(q.changePct) >= INTERESTING_MOVE_THRESHOLD);
  if (bigMove) return true;

  const admin = createAdminClient();
  const since = new Date(Date.now() - NEWS_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("news_items")
    .select("id")
    .neq("sentiment", "neutral")
    .gte("published_at", since);

  return (data?.length ?? 0) >= STRONG_SENTIMENT_COUNT_THRESHOLD;
}

async function todaysApertura(): Promise<MarketBriefing | null> {
  const admin = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data } = await admin
    .from("market_briefings")
    .select("*")
    .eq("type", "apertura")
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<MarketBriefing>();

  return data ?? null;
}

const SYSTEM_PROMPT =
  `Escribes briefings de mercado para Alfia, una plataforma de análisis financiero, siguiendo el formato de boletines premarket reales como el "5 Things to Know" de CNBC: directo, con datos concretos, cero relleno. Estructura obligatoria del array "content":
1. Primer elemento: una frase de apertura con el estado general (cómo van los índices/futuros, en 1 línea, no un párrafo).
2. Elementos siguientes: una lista NUMERADA ("1. ...", "2. ...", "3. ...") de 3-4 puntos, cada uno arrancando con el dato o activo específico más relevante que te demos (símbolo, % exacto, comparación contra lo normal para ese activo) — nunca generalidades tipo "el mercado tuvo movimientos mixtos". Uno de esos puntos debe ser el zoom detallado en el dato específico que te pasamos.
3. Último elemento: una línea de cierre con qué vigilar hacia adelante (próxima sesión, catalizador pendiente) — solo menciona catalizadores concretos si te los dimos, nunca inventes datos económicos o calendario que no se te compartieron.
Tono profesional, directo, sin jerga innecesaria, en español neutro. Nunca dices 'compra' o 'vende' — describes lo que pasó y lo que es razonable esperar, dejando claro que es información educativa, no asesoría financiera regulada. Responde ÚNICAMENTE con un objeto JSON válido, sin texto extra: {"title": string, "content": string[]}.`;

async function askClaude(userPrompt: string): Promise<{ title: string; content: string[] } | null> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: resolveModel("economico"),
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
  } catch {
    return null;
  }
}

export async function generateBriefing(
  type: BriefingType,
): Promise<{ title: string; content: string[]; refersTo: string | null } | null> {
  const report = await computeDailyReport();
  const reportSummary = report.narrative.join(" ");
  const featuredText = report.featured
    ? `Dato específico para hacerle zoom: ${report.featured.detail.join(" ")}`
    : "";

  if (type === "apertura") {
    const result = await askClaude(
      `Escribe el briefing de apertura de mercado (se publica 20 minutos antes de que abra), con el formato numerado que se te indicó. Cómo cerró la sesión pasada: ${reportSummary}. Sentimiento de mercado: ${report.sentiment?.label ?? "sin datos"}. Sectores líderes/rezagados: ${report.sectors.map((s) => `${s.sector} ${(s.avgDayChangePct * 100).toFixed(1)}%`).join(", ")}. ${featuredText} El cierre debe ser proyecciones educativas de qué vigilar hoy (sectores, índices), dejando claro que no son garantías.`,
    );
    return result ? { ...result, refersTo: null } : null;
  }

  if (type === "intradia") {
    const quotes = await Promise.all(
      INDEX_SYMBOLS.map(async (s) => ({ symbol: s, quote: await getQuote(s) })),
    );
    const moves = quotes
      .filter((q) => q.quote)
      .map((q) => `${q.symbol} ${((q.quote!.changePct) * 100).toFixed(2)}% intradía`)
      .join(", ");
    const result = await askClaude(
      `Escribe un briefing corto a media sesión, con el formato numerado que se te indicó, solo porque detectamos algo relevante: ${moves}. Contexto del día: ${reportSummary}. Explica qué está pasando ahora mismo y si cambia algo respecto a lo esperado en la apertura.`,
    );
    return result ? { ...result, refersTo: null } : null;
  }

  // cierre: corrobora las proyecciones de la apertura del mismo día
  const apertura = await todaysApertura();
  const aperturaText = apertura ? apertura.content.join(" ") : "No se generó briefing de apertura hoy.";
  const result = await askClaude(
    `Escribe el briefing de cierre de mercado (se publica 20 minutos antes de que cierre), con el formato numerado que se te indicó. Esto fue lo que proyectamos en la apertura de hoy: "${aperturaText}". Esto es lo que realmente pasó: ${reportSummary}. Sectores: ${report.sectors.map((s) => `${s.sector} ${(s.avgDayChangePct * 100).toFixed(1)}%`).join(", ")}. ${featuredText} Al menos uno de los puntos numerados debe comparar explícitamente lo proyectado contra lo que ocurrió (qué se cumplió, qué no). El cierre debe decir qué vigilar para la próxima sesión.`,
  );
  return result ? { ...result, refersTo: apertura?.id ?? null } : null;
}
