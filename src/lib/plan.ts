import type { Plan } from "@/types/database";

/**
 * Reglas de qué desbloquea cada plan. Aparte de esto está la capa de
 * créditos (consumo de IA por mensaje/herramienta), que se cobra igual sin
 * importar el plan una vez que el chat está disponible.
 *
 * - Free: screener limitado, sin posiciones, dashboard reducido, sin chat.
 * - Básico: todo lo anterior desbloqueado, pero sin chat.
 * - Pro: todo lo de Básico + el chat de inversión (que además corre
 *   Montecarlo/comparador/backtest/recomendación como herramientas).
 *
 * TEMPORAL: mientras se prueba el producto completo, TESTING_UNLOCK_ALL
 * desactiva todos los bloqueos de plan de un solo lugar (créditos siguen
 * cobrando normal). Para restaurar el gating real, pon esto en `false`.
 */
const TESTING_UNLOCK_ALL = true;

export function isFreePlan(plan: Plan): boolean {
  if (TESTING_UNLOCK_ALL) return false;
  return plan === "free";
}

/** Cuántos activos del universo ve el screener en el plan free. */
export const FREE_SCREENER_LIMIT = 6;

/** El plan free no puede abrir posiciones (Mi Portafolio). */
export function canOpenPositions(plan: Plan): boolean {
  if (TESTING_UNLOCK_ALL) return true;
  return !isFreePlan(plan);
}

/** Solo Pro tiene acceso al chat de inversión. */
export function canUseChat(plan: Plan): boolean {
  if (TESTING_UNLOCK_ALL) return true;
  return plan === "pro";
}
