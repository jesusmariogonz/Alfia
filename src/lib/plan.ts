import type { Plan } from "@/types/database";

/**
 * Reglas de qué desbloquea cada plan. Los créditos (chat, Montecarlo,
 * comparador, backtest, recomendación) son una capa aparte — consumo de IA,
 * disponible para cualquier plan mientras haya saldo. Esto es la otra capa:
 * qué tanto del producto ve cada plan, independiente de sus créditos.
 */
export function isFreePlan(plan: Plan): boolean {
  return plan === "free";
}

/** Cuántos activos del universo ve el screener en el plan free. */
export const FREE_SCREENER_LIMIT = 6;

/** El plan free no puede abrir posiciones (Mi Portafolio). */
export function canOpenPositions(plan: Plan): boolean {
  return !isFreePlan(plan);
}
