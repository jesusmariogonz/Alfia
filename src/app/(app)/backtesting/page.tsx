import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BacktestPanel } from "@/components/analytics/backtest-panel";
import type { Profile } from "@/types/database";

export default async function BacktestingPage() {
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
        Backtesting de estrategias
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Describe una estrategia en lenguaje natural y pruébala contra los últimos 2
        años de precios.
      </p>
      <div className="mt-6">
        <Suspense>
          <BacktestPanel initialBalance={profile?.credit_balance ?? 0} />
        </Suspense>
      </div>
    </div>
  );
}
