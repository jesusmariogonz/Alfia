import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { CreditTransaction, Profile } from "@/types/database";

const REASON_LABEL: Record<CreditTransaction["reason"], string> = {
  bienvenida: "Créditos de bienvenida",
  suscripcion: "Recarga de suscripción",
  compra_paquete: "Compra de paquete",
  consumo_ia: "Consulta a la IA",
  ajuste_manual: "Ajuste manual",
};

const packages = [
  { credits: 100, price: "$5" },
  { credits: 500, price: "$20" },
  { credits: 1500, price: "$50" },
];

export default async function CreditosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<CreditTransaction[]>(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-gold/30 bg-gold/10 p-6">
        <p className="text-sm text-text-muted">Saldo actual</p>
        <p className="mt-1 font-data text-3xl font-semibold text-gold">
          {(profile?.credit_balance ?? 0).toLocaleString("es")} créditos
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">
          Comprar créditos adicionales
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.credits}
              className="flex flex-col rounded-xl border border-border bg-surface p-5"
            >
              <p className="font-data text-xl font-semibold text-text">
                {pkg.credits.toLocaleString("es")}
              </p>
              <p className="text-sm text-text-muted">créditos</p>
              <p className="mt-3 font-data text-sm text-gold">{pkg.price}</p>
              <Button variant="secondary" disabled className="mt-4">
                Próximamente
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          La compra de paquetes con Stripe se habilita en la próxima fase.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">
          Historial de transacciones
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          {!transactions || transactions.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">
              Todavía no tienes transacciones. Cuando hagas tu primera consulta a la
              IA aparecerá aquí.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium text-right">Monto</th>
                  <th className="px-5 py-3 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-5 py-3 text-text-muted">
                      {new Date(tx.created_at).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-text">{REASON_LABEL[tx.reason]}</td>
                    <td
                      className={`px-5 py-3 text-right font-data ${
                        tx.amount >= 0 ? "text-data-up" : "text-data-down"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString("es")}
                    </td>
                    <td className="px-5 py-3 text-right font-data text-text">
                      {tx.balance_after.toLocaleString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
