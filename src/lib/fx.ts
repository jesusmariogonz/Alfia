/**
 * Tipo de cambio USD/MXN. Placeholder fijo — cuando se justifique, se
 * reemplaza por una llamada a una API de forex (ej. el mismo Finnhub tiene
 * /forex/rates) sin tocar nada de lo que lo consume.
 */
export const USD_TO_MXN = 18.5;

export function usdToMxn(usd: number): number {
  return usd * USD_TO_MXN;
}
