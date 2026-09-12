export type Signal = "Comprar más" | "Mantener" | "Vigilar" | "Vender";

/**
 * Señal orientativa, no una recomendación de inversión: combina el Alfia
 * Score (riesgo + desempeño histórico) con el retorno anualizado y el
 * momentum reciente (cambio del día). Misma lógica usada en el screener y
 * en Mi Portafolio para que la señal de un activo sea consistente en toda
 * la app.
 */
export function computeSignal({
  alfiaScore,
  annualizedReturn,
  changePct,
}: {
  alfiaScore: number;
  annualizedReturn: number;
  changePct?: number;
}): Signal {
  if (alfiaScore >= 70 && annualizedReturn > 0 && (changePct === undefined || changePct >= 0)) {
    return "Comprar más";
  }
  if (alfiaScore >= 60 && annualizedReturn > 0) return "Mantener";
  if (alfiaScore < 35 && annualizedReturn < 0) return "Vender";
  return "Vigilar";
}

export function signalTone(signal: Signal): string {
  if (signal === "Comprar más") return "text-data-up";
  if (signal === "Mantener") return "text-data-up";
  if (signal === "Vender") return "text-data-down";
  return "text-gold";
}

export function signalRationale(signal: Signal, symbol: string): string {
  switch (signal) {
    case "Comprar más":
      return `${symbol} tiene score y retorno sólidos con momentum reciente a favor — entre las señales más fuertes de la lista.`;
    case "Mantener":
      return `${symbol} tiene score y retorno positivos en los últimos 2 años — no hay señal para salir de la posición.`;
    case "Vender":
      return `${symbol} combina score bajo con retorno negativo — la peor combinación de riesgo y desempeño en el universo cubierto.`;
    default:
      return `${symbol} no muestra una señal clara en ningún sentido — vale la pena seguirlo de cerca antes de decidir.`;
  }
}
