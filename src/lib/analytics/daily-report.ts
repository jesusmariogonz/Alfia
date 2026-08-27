import { getCloses, UNIVERSE, type Candle } from "@/lib/market-data";
import { computeMarketSentiment, type MarketSentiment } from "./sentiment";
import { computeRiskMetrics } from "./metrics";
import { computeAlfiaScore, scoreLabel } from "./score";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NewsItem } from "@/types/database";

const INDEX_SYMBOLS = ["SPY", "QQQ"];
const BOND_SYMBOL = "TLT";
const GOLD_SYMBOL = "GLD";
const OIL_SYMBOL = "USO";

function dayReturn(closes: Candle[]): number {
  return closes[closes.length - 1].close / closes[closes.length - 2].close - 1;
}

function weekReturn(closes: Candle[]): number {
  const end = closes[closes.length - 1].close;
  const start = closes[Math.max(0, closes.length - 6)].close;
  return end / start - 1;
}

export type IndexSnapshot = {
  symbol: string;
  name: string;
  price: number;
  dayChangePct: number;
  weekChangePct: number;
};

export type SectorSnapshot = {
  sector: string;
  avgDayChangePct: number;
  assetCount: number;
  assets: { symbol: string; name: string; dayChangePct: number }[];
};

export type FeaturedStory = {
  symbol: string;
  name: string;
  dayChangePct: number;
  typicalDailyMovePct: number;
  movesVsTypical: number; // ej. 3.2x su movimiento diario típico
  alfiaScore: number;
  scoreLabel: string;
  relatedNews: { title: string; url: string; source: string } | null;
  detail: string[];
};

export type DailyReport = {
  generatedAt: string;
  sentiment: MarketSentiment | null;
  indices: IndexSnapshot[];
  sectors: SectorSnapshot[];
  topMovers: { symbol: string; name: string; dayChangePct: number }[];
  bottomMovers: { symbol: string; name: string; dayChangePct: number }[];
  goldChangePct: number | null;
  oilChangePct: number | null;
  bondChangePct: number | null;
  breadthPct: number;
  narrative: string[];
  featured: FeaturedStory | null;
};

async function findRelatedNews(
  asset: (typeof UNIVERSE)[number],
): Promise<{ title: string; url: string; source: string } | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("news_items")
    .select("*")
    .gte("published_at", since)
    .or(`title.ilike.%${asset.symbol}%,title.ilike.%${asset.name.split(" ")[0]}%`)
    .order("published_at", { ascending: false })
    .limit(1)
    .returns<NewsItem[]>();

  const match = data?.[0];
  return match ? { title: match.title, url: match.url, source: match.source } : null;
}

async function buildFeaturedStory(
  withReturns: { asset: (typeof UNIVERSE)[number]; closes: Candle[]; dayChangePct: number }[],
): Promise<FeaturedStory | null> {
  if (withReturns.length === 0) return null;

  const featured = [...withReturns].sort(
    (a, b) => Math.abs(b.dayChangePct) - Math.abs(a.dayChangePct),
  )[0];

  const metrics = computeRiskMetrics(featured.closes);
  const typicalDailyMovePct = metrics.annualizedVolatility / Math.sqrt(252);
  const movesVsTypical = typicalDailyMovePct > 0 ? Math.abs(featured.dayChangePct) / typicalDailyMovePct : 1;
  const score = computeAlfiaScore(metrics);
  const relatedNews = await findRelatedNews(featured.asset);

  const direction = featured.dayChangePct >= 0 ? "subió" : "cayó";
  const magnitude =
    movesVsTypical >= 2
      ? `un movimiento inusual — cerca de ${movesVsTypical.toFixed(1)}x su variación diaria típica (~${(typicalDailyMovePct * 100).toFixed(1)}%)`
      : `dentro de su rango de variación diaria habitual (~${(typicalDailyMovePct * 100).toFixed(1)}%)`;

  const detail: string[] = [
    `${featured.asset.symbol} (${featured.asset.name}) fue el movimiento más marcado del universo hoy: ${direction} ${(Math.abs(featured.dayChangePct) * 100).toFixed(2)}%, ${magnitude}.`,
    `Su Alfia Score es ${score} (${scoreLabel(score)}), con una volatilidad anualizada de ${(metrics.annualizedVolatility * 100).toFixed(0)}% y un Sharpe de ${metrics.sharpeRatio.toFixed(2)} en los últimos 2 años — contexto útil para juzgar si este movimiento es ruido normal o una señal a vigilar.`,
  ];
  if (relatedNews) {
    detail.push(`Podría estar relacionado con esta nota reciente: "${relatedNews.title}" (${relatedNews.source}).`);
  }

  return {
    symbol: featured.asset.symbol,
    name: featured.asset.name,
    dayChangePct: featured.dayChangePct,
    typicalDailyMovePct,
    movesVsTypical,
    alfiaScore: score,
    scoreLabel: scoreLabel(score),
    relatedNews,
    detail,
  };
}

export async function computeDailyReport(): Promise<DailyReport> {
  const [sentiment, indexCloses, goldCloses, oilCloses, bondCloses, allCloses] = await Promise.all([
    computeMarketSentiment(),
    Promise.all(INDEX_SYMBOLS.map((s) => getCloses(s))),
    getCloses(GOLD_SYMBOL),
    getCloses(OIL_SYMBOL),
    getCloses(BOND_SYMBOL),
    Promise.all(UNIVERSE.map(async (a) => ({ asset: a, closes: await getCloses(a.symbol) }))),
  ]);

  const indices: IndexSnapshot[] = INDEX_SYMBOLS.map((symbol, i) => {
    const closes = indexCloses[i]!;
    return {
      symbol,
      name: UNIVERSE.find((a) => a.symbol === symbol)?.name ?? symbol,
      price: closes[closes.length - 1].close,
      dayChangePct: dayReturn(closes),
      weekChangePct: weekReturn(closes),
    };
  });

  const withReturns = allCloses
    .filter((r): r is { asset: (typeof UNIVERSE)[number]; closes: Candle[] } => Boolean(r.closes))
    .map((r) => ({ ...r, dayChangePct: dayReturn(r.closes) }));

  const sectorMap = new Map<string, { symbol: string; name: string; dayChangePct: number }[]>();
  for (const r of withReturns) {
    const list = sectorMap.get(r.asset.sector) ?? [];
    list.push({ symbol: r.asset.symbol, name: r.asset.name, dayChangePct: r.dayChangePct });
    sectorMap.set(r.asset.sector, list);
  }
  const sectors: SectorSnapshot[] = Array.from(sectorMap.entries())
    .map(([sector, assets]) => ({
      sector,
      avgDayChangePct: assets.reduce((a, b) => a + b.dayChangePct, 0) / assets.length,
      assetCount: assets.length,
      assets: [...assets].sort((a, b) => b.dayChangePct - a.dayChangePct),
    }))
    .sort((a, b) => b.avgDayChangePct - a.avgDayChangePct);

  const sortedByReturn = [...withReturns].sort((a, b) => b.dayChangePct - a.dayChangePct);
  const topMovers = sortedByReturn.slice(0, 3).map((r) => ({
    symbol: r.asset.symbol,
    name: r.asset.name,
    dayChangePct: r.dayChangePct,
  }));
  const bottomMovers = sortedByReturn
    .slice(-3)
    .reverse()
    .map((r) => ({ symbol: r.asset.symbol, name: r.asset.name, dayChangePct: r.dayChangePct }));

  const breadthPct =
    (withReturns.filter((r) => r.dayChangePct > 0).length / withReturns.length) * 100;

  const narrative: string[] = [];
  const leadSector = sectors[0];
  const laggingSector = sectors[sectors.length - 1];
  if (leadSector && laggingSector && leadSector.sector !== laggingSector.sector) {
    narrative.push(
      `${leadSector.sector} lideró el día (+${(leadSector.avgDayChangePct * 100).toFixed(1)}% promedio), mientras que ${laggingSector.sector} quedó rezagado (${(laggingSector.avgDayChangePct * 100).toFixed(1)}%).`,
    );
  }
  const spy = indices.find((i) => i.symbol === "SPY");
  if (spy) {
    narrative.push(
      `El S&P 500 (SPY) ${spy.dayChangePct >= 0 ? "subió" : "cayó"} ${(Math.abs(spy.dayChangePct) * 100).toFixed(2)}% en el día y ${spy.weekChangePct >= 0 ? "acumula un avance" : "acumula una caída"} de ${(Math.abs(spy.weekChangePct) * 100).toFixed(2)}% en la última semana.`,
    );
  }
  narrative.push(
    `${breadthPct.toFixed(0)}% de los activos del universo cerraron en verde — ${breadthPct >= 60 ? "amplitud saludable" : breadthPct <= 40 ? "amplitud débil, pocas acciones sostienen el mercado" : "amplitud mixta"}.`,
  );
  if (bondCloses && spy) {
    const bondDay = dayReturn(bondCloses);
    if (bondDay - spy.dayChangePct > 0.005) {
      narrative.push("Los bonos de largo plazo (TLT) le ganaron a las acciones hoy — señal de cautela.");
    }
  }
  if (goldCloses) {
    const goldDay = dayReturn(goldCloses);
    if (Math.abs(goldDay) > 0.01) {
      narrative.push(`El oro (GLD) ${goldDay >= 0 ? "subió" : "cayó"} ${(Math.abs(goldDay) * 100).toFixed(1)}% en el día.`);
    }
  }
  if (oilCloses) {
    const oilDay = dayReturn(oilCloses);
    if (Math.abs(oilDay) > 0.015) {
      narrative.push(`El petróleo (USO) ${oilDay >= 0 ? "subió" : "cayó"} ${(Math.abs(oilDay) * 100).toFixed(1)}% en el día.`);
    }
  }

  const featured = await buildFeaturedStory(withReturns);

  return {
    generatedAt: new Date().toISOString(),
    sentiment,
    indices,
    sectors,
    topMovers,
    bottomMovers,
    goldChangePct: goldCloses ? dayReturn(goldCloses) : null,
    oilChangePct: oilCloses ? dayReturn(oilCloses) : null,
    bondChangePct: bondCloses ? dayReturn(bondCloses) : null,
    breadthPct,
    narrative,
    featured,
  };
}
