export type ModelTier = "economico" | "avanzado";

/**
 * El chat (Pro) es la única superficie de IA que queda, y siempre necesita
 * el modelo avanzado — decide cuándo usar herramientas (Montecarlo,
 * comparador, backtest, recomendación) y razona sobre resultados
 * numéricos. El proveedor/modelo concreto se resuelve aquí para poder
 * cambiarlo sin tocar el resto del código.
 */
export function resolveModel(tier: ModelTier): string {
  switch (tier) {
    case "avanzado":
      return process.env.ALFIA_MODEL_AVANZADO ?? "claude-sonnet-5";
    case "economico":
      return process.env.ALFIA_MODEL_ECONOMICO ?? "claude-haiku-4-5";
  }
}
