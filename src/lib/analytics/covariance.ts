const TRADING_DAYS_PER_YEAR = 252;

/**
 * Matriz de covarianza y correlación (anualizadas) entre los retornos
 * diarios de un conjunto de activos. Se alinean por índice (asume que
 * todas las series de retornos tienen la misma longitud, que es el caso
 * cuando vienen del mismo rango de días de `getCloses`).
 */
export function computeCovarianceMatrix(
  symbols: string[],
  returnsBySymbol: number[][],
): { covariance: number[][]; correlation: number[][] } {
  const n = symbols.length;
  const length = Math.min(...returnsBySymbol.map((r) => r.length));
  const aligned = returnsBySymbol.map((r) => r.slice(-length));
  const means = aligned.map((r) => r.reduce((a, b) => a + b, 0) / r.length);
  const stdDevs = aligned.map((r, i) => {
    const variance =
      r.reduce((acc, x) => acc + (x - means[i]) ** 2, 0) / r.length;
    return Math.sqrt(variance);
  });

  const covariance: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const correlation: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let cov = 0;
      for (let t = 0; t < length; t++) {
        cov += (aligned[i][t] - means[i]) * (aligned[j][t] - means[j]);
      }
      cov = (cov / length) * TRADING_DAYS_PER_YEAR; // anualizada
      covariance[i][j] = cov;
      const denom = stdDevs[i] * stdDevs[j];
      correlation[i][j] = denom > 0 ? cov / (denom * TRADING_DAYS_PER_YEAR) : 0;
    }
  }

  return { covariance, correlation };
}
