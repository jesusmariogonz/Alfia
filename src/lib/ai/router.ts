import type { QueryType } from "@/types/database";

export type ModelTier = "economico" | "avanzado";

const COMPLEX_QUERY_TYPES: QueryType[] = ["montecarlo", "comparador", "screener"];

/**
 * Decide qué nivel de modelo usar según el tipo de consulta y la longitud
 * del mensaje. Tareas repetitivas/simples van al modelo económico; consultas
 * complejas (comparaciones, interpretación de Montecarlo) van al modelo
 * avanzado. El proveedor/modelo concreto detrás de cada tier se resuelve
 * en `resolveModel` para poder cambiarlo sin tocar el resto del código.
 */
export function pickModelTier(queryType: QueryType, message: string): ModelTier {
  if (COMPLEX_QUERY_TYPES.includes(queryType)) return "avanzado";
  if (message.length > 400) return "avanzado";
  return "economico";
}

export function resolveModel(tier: ModelTier): string {
  switch (tier) {
    case "avanzado":
      return process.env.ALFIA_MODEL_AVANZADO ?? "claude-sonnet-5";
    case "economico":
      return process.env.ALFIA_MODEL_ECONOMICO ?? "claude-haiku-4-5";
  }
}
