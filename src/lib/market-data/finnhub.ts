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

/**
 * Velas diarias de los últimos `days` días. Devuelve null si Finnhub no
 * tiene el símbolo, si no hay clave configurada, o ante cualquier error de
 * red — en todos esos casos el llamador cae de vuelta al generador
 * sintético.
 */
export async function fetchDailyCandles(
  symbol: string,
  days: number,
): Promise<{ date: string; close: number; open: number; high: number; low: number }[] | null> {
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
  }));
}
