import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: solo para uso en el servidor, en
 * contextos sin sesión de usuario (el webhook de Stripe no tiene cookies de
 * auth que verificar). Nunca importar desde código que se ejecute en el
 * cliente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
