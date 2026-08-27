import { computeDailyReport } from "./daily-report";
import { getAnthropicClient } from "@/lib/ai/client";
import { resolveModel } from "@/lib/ai/router";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeepReportContent, NewsItem } from "@/types/database";

const SYSTEM_PROMPT = `Escribes el reporte diario de mercado de Alfia, con la profundidad de un reporte financiero profesional real (piensa en el estilo de un "esta semana en mercados" de un analista, pero para un solo día). Nada de relleno genérico ("movimientos mixtos") — cada frase debe tener un número, un símbolo o un hecho concreto detrás.

Reglas estrictas:
- SOLO usa los datos, noticias y sectores que se te den. Nunca inventes fechas de reportes de resultados, decisiones de banco central, o cualquier evento específico que no aparezca explícito en las noticias que te pasamos. Si no tienes un catalizador concreto confirmado para "calendar", devuelve un array vacío o un solo punto genérico sin fecha inventada (ej. "vigilar si continúa la rotación hacia bonos").
- Nunca digas "compra" o "vende" — describes qué pasó, por qué, y qué es razonable vigilar. Deja claro en el conclusion que es información educativa, no asesoría financiera regulada.
- "themes" son párrafos de 3-5 líneas cada uno, no bullets — cada uno debe explicar UN hilo conductor del día a fondo: qué pasó, la causa probable (con la noticia relacionada si la hay), y por qué le importa a alguien que sigue el mercado.
- "lectura" son 2-3 preguntas de análisis propio en formato pregunta/respuesta (ej. "¿Es sostenible este movimiento?", "¿Qué riesgo se está subestimando?"), cada respuesta de 2-4 líneas con argumento real, no una evasiva.
- "swingTake" y "longTermTake" son 1-2 párrafos cada uno con una lectura práctica del día para ese estilo de inversión (swing trading de corto plazo vs. largo plazo), basada solo en los datos dados.
- "keyIdeas" son 3-5 líneas, cada una una idea accionable y específica (qué revisar, qué vigilar), no un resumen repetido de arriba.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto extra, con esta forma exacta:
{"hook": string, "highlights": string[], "themes": string[], "sectorTake": string, "lectura": [{"question": string, "answer": string}], "swingTake": string[], "longTermTake": string[], "calendar": string[], "conclusion": string, "keyIdeas": string[]}`;

async function recentHeadlines(): Promise<string[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("news_items")
    .select("*")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(15)
    .returns<NewsItem[]>();

  return (data ?? []).map((n) => `[${n.sentiment}] ${n.title} (${n.source})`);
}

export async function generateDeepReport(): Promise<
  { content: DeepReportContent } | { error: string }
> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return { error: "ANTHROPIC_API_KEY no configurada." };

  const report = await computeDailyReport();
  const headlines = await recentHeadlines();

  const userPrompt = `Datos del día para construir el reporte:
- Índices: ${report.indices.map((i) => `${i.symbol} ${(i.dayChangePct * 100).toFixed(2)}% hoy, ${(i.weekChangePct * 100).toFixed(2)}% en la semana`).join("; ")}
- Sentimiento de mercado: ${report.sentiment?.label ?? "sin datos"} (score ${report.sentiment?.score ?? "—"}/100)
- Sectores (retorno promedio del día): ${report.sectors.map((s) => `${s.sector} ${(s.avgDayChangePct * 100).toFixed(2)}%`).join("; ")}
- Mayores avances: ${report.topMovers.map((m) => `${m.symbol} +${(m.dayChangePct * 100).toFixed(2)}%`).join(", ")}
- Mayores caídas: ${report.bottomMovers.map((m) => `${m.symbol} ${(m.dayChangePct * 100).toFixed(2)}%`).join(", ")}
- Amplitud de mercado: ${report.breadthPct.toFixed(0)}% de los activos cerraron en verde
- Bonos largo plazo (TLT): ${report.bondChangePct !== null ? (report.bondChangePct * 100).toFixed(2) + "%" : "sin datos"}
- Oro (GLD): ${report.goldChangePct !== null ? (report.goldChangePct * 100).toFixed(2) + "%" : "sin datos"}
- Petróleo (USO): ${report.oilChangePct !== null ? (report.oilChangePct * 100).toFixed(2) + "%" : "sin datos"}
- Historia destacada: ${report.featured ? report.featured.detail.join(" ") : "ninguna en particular"}
- Noticias reales de las últimas 24h (única fuente permitida para causas/contexto/calendario): ${headlines.length > 0 ? headlines.join(" | ") : "no hay noticias cargadas todavía"}

Escribe el reporte diario completo con este contexto.`;

  const response = await anthropic.messages.create({
    model: resolveModel("avanzado"),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "max_tokens") {
    return { error: "La respuesta de Claude se cortó por límite de tokens antes de completar el JSON." };
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { error: "Claude no devolvió un bloque de texto." };
  }

  const cleaned = textBlock.text.replace(/```(?:json)?/g, "").trim();
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return { content: JSON.parse(jsonMatch ? jsonMatch[0] : cleaned) as DeepReportContent };
  } catch (e) {
    return {
      error: `JSON inválido: ${e instanceof Error ? e.message : "error desconocido"}. Primeros 300 chars: ${cleaned.slice(0, 300)}`,
    };
  }
}
