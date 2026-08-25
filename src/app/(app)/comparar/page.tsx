import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ComparadorPanel } from "@/components/analytics/comparador-panel";
import type { Profile } from "@/types/database";

export default async function CompararPage() {
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
        Comparador de activos
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Pon dos activos lado a lado y entiende sus diferencias de riesgo y retorno.
      </p>
      <div className="mt-6">
        <Suspense>
          <ComparadorPanel initialBalance={profile?.credit_balance ?? 0} />
        </Suspense>
      </div>
    </div>
  );
}
