export type AssetClass = "accion" | "cripto" | "etf";

export type UniverseAsset = {
  symbol: string;
  name: string;
  sector: string;
  assetClass: AssetClass;
  /** Precio base y deriva/volatilidad anual usados para generar la serie sintética. */
  basePrice: number;
  annualDrift: number;
  annualVolatility: number;
};

/**
 * Universo de activos de ejemplo. Cuando se integre un proveedor real
 * (Polygon/Finnhub), este archivo se reemplaza por una llamada a su API de
 * referencia de tickers — el resto del código solo depende de `UniverseAsset`.
 */
export const UNIVERSE: UniverseAsset[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Tecnología", assetClass: "accion", basePrice: 227.14, annualDrift: 0.14, annualVolatility: 0.28 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Tecnología", assetClass: "accion", basePrice: 418.32, annualDrift: 0.15, annualVolatility: 0.25 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Tecnología", assetClass: "accion", basePrice: 121.07, annualDrift: 0.30, annualVolatility: 0.55 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumo discrecional", assetClass: "accion", basePrice: 186.51, annualDrift: 0.16, annualVolatility: 0.32 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Comunicaciones", assetClass: "accion", basePrice: 168.23, annualDrift: 0.13, annualVolatility: 0.27 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumo discrecional", assetClass: "accion", basePrice: 246.90, annualDrift: 0.10, annualVolatility: 0.62 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financiero", assetClass: "accion", basePrice: 214.77, annualDrift: 0.11, annualVolatility: 0.24 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energía", assetClass: "accion", basePrice: 118.45, annualDrift: 0.07, annualVolatility: 0.26 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Salud", assetClass: "accion", basePrice: 152.30, annualDrift: 0.06, annualVolatility: 0.16 },
  { symbol: "KO", name: "The Coca-Cola Co.", sector: "Consumo básico", assetClass: "accion", basePrice: 63.18, annualDrift: 0.06, annualVolatility: 0.14 },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumo básico", assetClass: "accion", basePrice: 171.02, annualDrift: 0.07, annualVolatility: 0.15 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "Índice", assetClass: "etf", basePrice: 553.21, annualDrift: 0.10, annualVolatility: 0.17 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Índice", assetClass: "etf", basePrice: 481.60, annualDrift: 0.13, annualVolatility: 0.22 },
  { symbol: "BTC", name: "Bitcoin", sector: "Cripto", assetClass: "cripto", basePrice: 61204, annualDrift: 0.20, annualVolatility: 0.65 },
  { symbol: "ETH", name: "Ethereum", sector: "Cripto", assetClass: "cripto", basePrice: 3012, annualDrift: 0.18, annualVolatility: 0.75 },
];

export function findAsset(symbol: string): UniverseAsset | undefined {
  return UNIVERSE.find((a) => a.symbol === symbol.toUpperCase());
}
