import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMarketNews } from "@/lib/market-data";
import { classifySentiment } from "@/lib/content/news-sentiment";

/**
 * Trae noticias de mercado (Finnhub /news) y las guarda con sentimiento
 * clasificado. Pensado para correr ~3 veces al día vía Vercel Cron (ver
 * vercel.json) — nota: el plan Hobby de Vercel limita los cron jobs a 1
 * disparo diario; con Pro se pueden programar los 3 horarios reales.
 * Idempotente: los artículos ya guardados (mismo external_id) se ignoran.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const articles = await fetchMarketNews();
  if (!articles) {
    return NextResponse.json({
      inserted: 0,
      message: "FINNHUB_API_KEY no configurada o Finnhub no respondió.",
    });
  }

  const admin = createAdminClient();
  const rows = articles
    .filter((a) => a.headline && a.url)
    .slice(0, 30)
    .map((a) => ({
      external_id: String(a.id),
      title: a.headline,
      url: a.url,
      source: a.source,
      summary: a.summary || null,
      sentiment: classifySentiment(`${a.headline} ${a.summary ?? ""}`),
      image_url: a.image || null,
      published_at: new Date(a.datetime * 1000).toISOString(),
    }));

  const { error, count } = await admin
    .from("news_items")
    .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true, count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Conserva solo las últimas 30 noticias en total.
  const { data: keep } = await admin
    .from("news_items")
    .select("id")
    .order("published_at", { ascending: false })
    .limit(30);
  const keepIds = (keep ?? []).map((r) => r.id);
  if (keepIds.length > 0) {
    await admin.from("news_items").delete().not("id", "in", `(${keepIds.join(",")})`);
  }

  return NextResponse.json({ inserted: count ?? 0, fetched: rows.length });
}
