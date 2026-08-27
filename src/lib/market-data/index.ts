import { findAsset, UNIVERSE, type UniverseAsset } from "./universe";
import { getHistoricalCloses, type Candle } from "./synthetic";
import { fetchQuote, fetchDailyCandles, fetchIntradayCandles, fetchMarketNews } from "./finnhub";

export { fetchMarketNews };
export type { FinnhubNewsArticle } from "./finnhub";
import { cached } from "./cache";

export type { UniverseAsset, AssetClass } from "./universe";
export type { Candle } from "./synthetic";
export { UNIVERSE, findAsset };

// Cierres diarios no cambian intradía: cacheamos varias horas. Cotizaciones
// (precio actual) cambian todo el día: cacheamos solo un minuto, suficiente
// para que varios usuarios viendo el mismo activo no dupliquen la llamada.
const CANDLES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const QUOTE_CACHE_TTL_MS = 60 * 1000;

function syntheticCloses(asset: UniverseAsset): Candle[] {
  return getHistoricalCloses(
    asset.symbol,
    asset.basePrice,
    asset.annualDrift,
    asset.annualVolatility,
  );
}

/**
 * Finnhub cubre acciones y ETFs con /quote y /stock/candle. Cripto usa un
 * formato de símbolo y unos endpoints distintos (sin un "precio actual"
 * simple) — hasta que se justifique esa integración aparte, BTC/ETH se
 * quedan en el generador sintético.
 */
function supportsRealData(asset: UniverseAsset): boolean {
  return Boolean(process.env.FINNHUB_API_KEY) && asset.assetClass !== "cripto";
}

export async function getCloses(symbol: string): Promise<Candle[] | null> {
  const asset = findAsset(symbol);
  if (!asset) return null;

  if (!supportsRealData(asset)) {
    return syntheticCloses(asset);
  }

  return cached(`closes:${asset.symbol}`, CANDLES_CACHE_TTL_MS, async () => {
    const real = await fetchDailyCandles(asset.symbol, 504);
    return real ?? syntheticCloses(asset);
  });
}

const INTRADAY_CACHE_TTL_MS = 5 * 60 * 1000;

/** Velas de 5 min del día en curso, para el tab "1D". Null si no aplica (cripto, sin Finnhub, o mercado sin datos aún). */
export async function getIntradayCloses(symbol: string): Promise<Candle[] | null> {
  const asset = findAsset(symbol);
  if (!asset || !supportsRealData(asset)) return null;

  return cached(`intraday:${asset.symbol}`, INTRADAY_CACHE_TTL_MS, () =>
    fetchIntradayCandles(asset.symbol),
  );
}

export async function getQuote(symbol: string) {
  const asset = findAsset(symbol);
  if (!asset) return null;

  if (supportsRealData(asset)) {
    const live = await cached(`quote:${asset.symbol}`, QUOTE_CACHE_TTL_MS, () =>
      fetchQuote(asset.symbol),
    );
    if (live && live.c > 0) {
      return {
        asset,
        price: live.c,
        changePct: live.pc > 0 ? (live.c - live.pc) / live.pc : 0,
      };
    }
  }

  const closes = await getCloses(symbol);
  if (!closes || closes.length < 2) return null;
  const last = closes[closes.length - 1].close;
  const prev = closes[closes.length - 2].close;
  return { asset, price: last, changePct: (last - prev) / prev };
}
