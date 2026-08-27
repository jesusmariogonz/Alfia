const FINNHUB_BASE = "https://finnhub.io/api/v1";

export type FinnhubQuote = {
  c: number; // precio actual
  pc: number; // cierre anterior
};

type FinnhubCandleResponse = {
  c: number[]; // cierres
  o: number[]; // apertura
  h: number[]; // máximo
  l: number[]; // mínimo
  v: number[]; // volumen
  t: number[]; // timestamps (unix, segundos)
  s: "ok" | "no_data";
};

function getApiKey(): string | null {
  return process.env.FINNHUB_API_KEY?.trim() || null;
}

async function finnhubFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = new URL(FINNHUB_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Red caída, rate limit, timeout — se resuelve arriba con el
    // fallback al generador sintético, nunca con un error visible al usuario.
    return null;
  }
}

export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  return finnhubFetch<FinnhubQuote>("/quote", { symbol });
}

export type FinnhubNewsArticle = {
  id: number;
  headline: string;
  source: string;
  summary: string;
  url: string;
  image: string;
  datetime: number; // unix seconds
  category: string;
};

/** Noticias generales de mercado (no filtradas por un solo símbolo). */
export async function fetchMarketNews(): Promise<FinnhubNewsArticle[] | null> {
  const data = await finnhubFetch<FinnhubNewsArticle[]>("/news", { category: "general" });
  return data ?? null;
}

/**
 * Velas diarias de los últimos `days` días. Devuelve null si Finnhub no
 * tiene el símbolo, si no hay clave configurada, o ante cualquier error de
 * red — en todos esos casos el llamador cae de vuelta al generador
 * sintético.
 */
type CandleOut = { date: string; close: number; open: number; high: number; low: number; volume: number };

export async function fetchDailyCandles(symbol: string, days: number): Promise<CandleOut[] | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;

  const data = await finnhubFetch<FinnhubCandleResponse>("/stock/candle", {
    symbol,
    resolution: "D",
    from: String(from),
    to: String(to),
  });

  if (!data || data.s !== "ok" || data.c.length === 0) return null;

  return data.t.map((timestamp, i) => ({
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    close: data.c[i],
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    volume: data.v[i],
  }));
}

/**
 * Velas intradía (resolución de 5 min) del día en curso, para el tab "1D".
 * Solo tiene sentido para activos con datos reales de Finnhub — cripto y el
 * fallback sintético no tienen intradía, así que null es una respuesta
 * válida ahí (el llamador oculta el tab 1D en ese caso).
 */
export async function fetchIntradayCandles(symbol: string): Promise<CandleOut[] | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 24 * 60 * 60;

  const data = await finnhubFetch<FinnhubCandleResponse>("/stock/candle", {
    symbol,
    resolution: "5",
    from: String(from),
    to: String(to),
  });

  if (!data || data.s !== "ok" || data.c.length === 0) return null;

  return data.t.map((timestamp, i) => ({
    date: new Date(timestamp * 1000).toISOString(),
    close: data.c[i],
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    volume: data.v[i],
  }));
}
