import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryType } from "@/types/database";

export class InsufficientCreditsError extends Error {
  constructor(message = "Saldo de créditos insuficiente") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Descuenta créditos de forma atómica vía la función de Postgres
 * `charge_credits` (bloquea la fila del perfil, valida saldo y registra
 * la transacción + el log de uso de IA en una sola transacción de BD).
 * Nunca deja el balance en negativo: si el saldo no alcanza, lanza
 * InsufficientCreditsError.
 */
export async function chargeCredits(
  supabase: SupabaseClient,
  params: {
    userId: string;
    amount: number;
    queryType: QueryType;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  },
): Promise<{ transactionId: string; newBalance: number }> {
  const { data, error } = await supabase.rpc("charge_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_query_type: params.queryType,
    p_model: params.model,
    p_input_tokens: params.inputTokens ?? 0,
    p_output_tokens: params.outputTokens ?? 0,
  });

  if (error) {
    if (error.message.includes("Saldo insuficiente")) {
      throw new InsufficientCreditsError(error.message);
    }
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { transactionId: row.transaction_id, newBalance: row.new_balance };
}

/**
 * Recarga créditos (compra de paquete, activación/renovación de
 * suscripción u otorgamiento manual). Usada por el webhook de Stripe.
 */
export async function grantCredits(
  supabase: SupabaseClient,
  params: {
    userId: string;
    amount: number;
    reason: "suscripcion" | "compra_paquete" | "ajuste_manual";
    metadata?: Record<string, unknown>;
  },
): Promise<{ transactionId: string; newBalance: number }> {
  const { data, error } = await supabase.rpc("grant_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reason: params.reason,
    p_metadata: params.metadata ?? {},
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return { transactionId: row.transaction_id, newBalance: row.new_balance };
}

/** Costo en créditos por tipo de consulta. Mostrado al usuario antes de enviar. */
export const CREDIT_COSTS: Record<QueryType, number> = {
  chat: 1,
  resumen_diario: 0,
  montecarlo: 5,
  comparador: 2,
  screener: 0, // filtro local, no invoca IA
  backtest: 4,
};
