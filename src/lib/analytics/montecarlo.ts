function randNormal(): number {
  const u1 = Math.max(Math.random(), 1e-9);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export type MonteCarloParams = {
  initialAmount: number;
  annualDrift: number;
  annualVolatility: number;
  horizonDays: number;
  simulations: number;
};

export type MonteCarloResult = {
  /** Valor final de cada simulación, ordenado ascendente. */
  finalValues: number[];
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  /** Trayectorias de percentiles día a día, para graficar la banda de escenarios. */
  pathBands: { day: number; p10: number; p50: number; p90: number }[];
  probabilityOfLoss: number;
};

/**
 * Simulación de Montecarlo con movimiento geométrico browniano diario.
 * Corre enteramente en el servidor (Node) — con miles de simulaciones y
 * cientos de días es liviano en JS; si el volumen crece, este es el punto
 * a migrar a un worker en Python/numpy sin tocar la API que lo consume.
 */
export function runMonteCarlo(params: MonteCarloParams): MonteCarloResult {
  const { initialAmount, annualDrift, annualVolatility, horizonDays, simulations } = params;
  const dt = 1 / 252;
  const drift = (annualDrift - 0.5 * annualVolatility ** 2) * dt;
  const diffusionScale = annualVolatility * Math.sqrt(dt);

  const paths: number[][] = Array.from({ length: simulations }, () => [initialAmount]);

  for (let sim = 0; sim < simulations; sim++) {
    let value = initialAmount;
    for (let day = 1; day <= horizonDays; day++) {
      value = value * Math.exp(drift + diffusionScale * randNormal());
      paths[sim].push(value);
    }
  }

  const finalValues = paths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
  const percentile = (p: number) => finalValues[Math.floor(p * (finalValues.length - 1))];

  const pathBands: MonteCarloResult["pathBands"] = [];
  const sampleEvery = Math.max(1, Math.floor(horizonDays / 60));
  for (let day = 0; day <= horizonDays; day += sampleEvery) {
    const valuesAtDay = paths.map((p) => p[day]).sort((a, b) => a - b);
    pathBands.push({
      day,
      p10: valuesAtDay[Math.floor(0.1 * (valuesAtDay.length - 1))],
      p50: valuesAtDay[Math.floor(0.5 * (valuesAtDay.length - 1))],
      p90: valuesAtDay[Math.floor(0.9 * (valuesAtDay.length - 1))],
    });
  }

  const probabilityOfLoss =
    finalValues.filter((v) => v < initialAmount).length / finalValues.length;

  return {
    finalValues,
    percentiles: {
      p5: percentile(0.05),
      p25: percentile(0.25),
      p50: percentile(0.5),
      p75: percentile(0.75),
      p95: percentile(0.95),
    },
    pathBands,
    probabilityOfLoss,
  };
}
