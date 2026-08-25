import { findAsset, UNIVERSE } from "./universe";
import { getHistoricalCloses, type Candle } from "./synthetic";

export type { UniverseAsset, AssetClass } from "./universe";
export type { Candle } from "./synthetic";
export { UNIVERSE, findAsset };

/**
 * Punto único de acceso a datos de mercado. Hoy respaldado por el
 * generador sintético; cuando se conecte Polygon/Finnhub, solo esta
 * función necesita cambiar de implementación.
 */
export function getCloses(symbol: string): Candle[] | null {
  const asset = findAsset(symbol);
  if (!asset) return null;
  return getHistoricalCloses(
    asset.symbol,
    asset.basePrice,
    asset.annualDrift,
    asset.annualVolatility,
  );
}

export function getQuote(symbol: string) {
  const asset = findAsset(symbol);
  if (!asset) return null;
  const closes = getCloses(symbol)!;
  const last = closes[closes.length - 1].close;
  const prev = closes[closes.length - 2].close;
  return {
    asset,
    price: last,
    changePct: (last - prev) / prev,
  };
}
