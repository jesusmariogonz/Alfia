import { getAnthropicClient } from "@/lib/ai/client";
import { resolveModel } from "@/lib/ai/router";
import { FINANCIAL_DISCLAIMER } from "@/lib/ai/guardrails";
import { UNIVERSE, getCloses } from "@/lib/market-data";

const FALLBACK_RECAP =
  "El motor de IA todavía no está configurado en este entorno (falta ANTHROPIC_API_KEY), así que este resumen semanal es un marcador de posición. Configura la clave para que Alfia genere el resumen real cada semana.";

/**
 * Genera el contenido del newsletter semanal. Hoy resume el movimiento de
 * precios sintéticos del universo de ejemplo — cuando se conecte un
 * proveedor de datos y noticias reales (ver `lib/market-data`), este es el
 * único lugar que necesita cambiar para reflejarlos.
 */
export async function buildWeeklyNewsletter(): Promise<{ subject: string; html: string }> {
  const movers = UNIVERSE.map((asset) => {
    const closes = getCloses(asset.symbol)!;
    const last = closes[closes.length - 1].close;
    const weekAgo = closes[Math.max(0, closes.length - 6)].close;
    return { symbol: asset.symbol, name: asset.name, weekChangePct: last / weekAgo - 1 };
  }).sort((a, b) => b.weekChangePct - a.weekChangePct);

  const topGainers = movers.slice(0, 3);
  const topLosers = movers.slice(-3).reverse();

  const anthropic = getAnthropicClient();
  let recap = FALLBACK_RECAP;

  if (anthropic) {
    const prompt = `Escribe un resumen semanal de mercado en español, en tono claro y directo, de máximo 150 palabras, para un newsletter de inversión. Los activos que más subieron esta semana: ${topGainers.map((m) => `${m.symbol} (${(m.weekChangePct * 100).toFixed(1)}%)`).join(", ")}. Los que más bajaron: ${topLosers.map((m) => `${m.symbol} (${(m.weekChangePct * 100).toFixed(1)}%)`).join(", ")}. No inventes noticias específicas — habla en términos generales de movimiento de precios y volatilidad.`;

    const completion = await anthropic.messages.create({
      model: resolveModel("economico"),
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    recap = completion.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #14171A;">
      <h1 style="font-size: 20px;">Resumen semanal de mercado</h1>
      <p style="line-height: 1.6;">${recap}</p>
      <h2 style="font-size: 16px; margin-top: 24px;">Mayores subas</h2>
      <ul>${topGainers.map((m) => `<li>${m.symbol} — ${m.name}: +${(m.weekChangePct * 100).toFixed(1)}%</li>`).join("")}</ul>
      <h2 style="font-size: 16px;">Mayores bajas</h2>
      <ul>${topLosers.map((m) => `<li>${m.symbol} — ${m.name}: ${(m.weekChangePct * 100).toFixed(1)}%</li>`).join("")}</ul>
      <p style="font-size: 12px; color: #8B939B; margin-top: 24px;">${FINANCIAL_DISCLAIMER}</p>
      <p style="font-size: 12px; color: #8B939B;">
        <a href="{{unsubscribe_url}}" style="color: #8B939B;">Darme de baja de este newsletter</a>
      </p>
    </div>
  `;

  return { subject: "Tu resumen semanal de mercado — Alfia", html };
}
