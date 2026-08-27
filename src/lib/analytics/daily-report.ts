import { getCloses, UNIVERSE, type Candle } from "@/lib/market-data";
import { computeMarketSentiment, type MarketSentiment } from "./sentiment";

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
};

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

  const sectorMap = new Map<string, number[]>();
  for (const r of withReturns) {
    const list = sectorMap.get(r.asset.sector) ?? [];
    list.push(r.dayChangePct);
    sectorMap.set(r.asset.sector, list);
  }
  const sectors: SectorSnapshot[] = Array.from(sectorMap.entries())
    .map(([sector, changes]) => ({
      sector,
      avgDayChangePct: changes.reduce((a, b) => a + b, 0) / changes.length,
      assetCount: changes.length,
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
  };
}
