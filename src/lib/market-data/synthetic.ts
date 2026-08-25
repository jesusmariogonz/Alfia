/**
 * Generador de series de precio sintéticas, determinista (seed por símbolo)
 * para que el mismo activo produzca siempre la misma serie mientras dure la
 * sesión de datos. Esto es un placeholder deliberado: en producción,
 * `getHistoricalCloses` es el único punto que hay que reemplazar por una
 * llamada real a Polygon.io o Finnhub — el resto de `lib/analytics` y las
 * páginas que lo consumen no cambian.
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) | 0;
  }
  return hash;
}

function randNormal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export type Candle = {
  date: string;
  close: number;
};

/**
 * Serie de cierres diarios de los últimos `days` días de trading, generada
 * con un movimiento geométrico browniano a partir de la deriva/volatilidad
 * anual del activo.
 */
export function getHistoricalCloses(
  symbol: string,
  basePrice: number,
  annualDrift: number,
  annualVolatility: number,
  days = 504, // ~2 años de trading
): Candle[] {
  const rand = mulberry32(seedFromSymbol(symbol));
  const dt = 1 / 252;
  const drift = (annualDrift - 0.5 * annualVolatility ** 2) * dt;
  const diffusionScale = annualVolatility * Math.sqrt(dt);

  const closes: number[] = [];
  let price = basePrice / Math.exp(annualDrift * (days / 252)); // ancla el precio final ~ basePrice
  for (let i = 0; i < days; i++) {
    price = price * Math.exp(drift + diffusionScale * randNormal(rand));
    closes.push(price);
  }
  // Ajuste final para que el último cierre coincida exactamente con basePrice
  const scale = basePrice / closes[closes.length - 1];
  const adjusted = closes.map((c) => c * scale);

  const today = new Date();
  return adjusted.map((close, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i));
    return { date: date.toISOString().slice(0, 10), close: Number(close.toFixed(2)) };
  });
}
