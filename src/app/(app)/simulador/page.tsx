import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MonteCarloPanel } from "@/components/analytics/montecarlo-panel";
import type { Profile } from "@/types/database";

export default async function SimuladorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">
        Simulador de Montecarlo
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Proyecta miles de escenarios posibles para una inversión y su interpretación
        en lenguaje natural.
      </p>
      <div className="mt-6">
        <Suspense>
          <MonteCarloPanel initialBalance={profile?.credit_balance ?? 0} />
        </Suspense>
      </div>
    </div>
  );
}
