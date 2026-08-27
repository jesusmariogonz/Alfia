type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/**
 * Caché en memoria del proceso, TTL simple. No es persistente entre cold
 * starts de la función serverless, pero alcanza para evitar que varios
 * usuarios viendo el mismo activo disparen una llamada a Finnhub cada uno
 * — que es lo que realmente quema el límite de 60 req/min del plan gratis.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await fn();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
