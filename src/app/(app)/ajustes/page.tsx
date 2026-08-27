import { createClient } from "@/lib/supabase/server";
import { CurrencySetting } from "@/components/settings/currency-setting";
import type { Profile } from "@/types/database";

export default async function AjustesPage() {
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
      <h1 className="font-display text-2xl font-semibold text-text">Ajustes</h1>
      <p className="mt-1 text-sm text-text-muted">Preferencias de tu cuenta.</p>

      <div className="mt-6 divide-y divide-border border-y border-border">
        <CurrencySetting initial={profile?.currency_pref ?? "usd"} />
      </div>
    </div>
  );
}
