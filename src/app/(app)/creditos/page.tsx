import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/dashboard/checkout-button";
import { ManageSubscriptionButton } from "@/components/dashboard/manage-subscription-button";
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import type { CreditTransaction, Profile } from "@/types/database";

const REASON_LABEL: Record<CreditTransaction["reason"], string> = {
  bienvenida: "Créditos de bienvenida",
  suscripcion: "Recarga de suscripción",
  compra_paquete: "Compra de paquete",
  consumo_ia: "Consulta a la IA",
  ajuste_manual: "Ajuste manual",
};

const PLAN_NAME: Record<Profile["plan"], string> = {
  free: "Free",
  basico: "Básico",
  pro: "Pro",
};

function centsToPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("es", { minimumFractionDigits: 0 })}`;
}

export default async function CreditosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
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

  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="flex flex-col gap-8">
      {checkout === "exito" && (
        <p className="rounded-lg border border-green/30 bg-green/10 px-4 py-3 text-sm text-green-bright">
          Pago confirmado. Tus créditos se acreditan en cuanto Stripe notifica la
          transacción — si no ves el saldo actualizado, recarga la página en unos
          segundos.
        </p>
      )}
      {checkout === "cancelado" && (
        <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-text-muted">
          Pago cancelado. No se hizo ningún cargo.
        </p>
      )}

      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gold/30 bg-gold/10 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-text-muted">Saldo actual</p>
          <p className="mt-1 font-data text-3xl font-semibold text-gold">
            {(profile?.credit_balance ?? 0).toLocaleString("es")} créditos
          </p>
        </div>
        <Badge tone="gold">Plan {PLAN_NAME[currentPlan]}</Badge>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-text">Tu plan</h2>
          {currentPlan !== "free" && <ManageSubscriptionButton />}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            credits="20 créditos de bienvenida"
            features={[
              "Screener limitado (6 activos, sin indicadores)",
              "Dashboard básico",
              "Sin Mi Portafolio",
              "Sin chat de IA",
            ]}
            isCurrent={currentPlan === "free"}
          />
          <PlanCard
            name="Básico"
            price={`${centsToPrice(SUBSCRIPTION_PLANS.basico.priceCents)}/mes`}
            credits={`${SUBSCRIPTION_PLANS.basico.monthlyCredits.toLocaleString("es")} créditos al mes`}
            features={[
              "Screener completo",
              "Mi Portafolio (posiciones, riesgo, correlación)",
              "Dashboard completo",
              "Sin chat de IA",
            ]}
            isCurrent={currentPlan === "basico"}
            action={
              currentPlan !== "basico" && (
                <CheckoutButton
                  body={{ kind: "plan", id: "basico" }}
                  label="Elegir Básico"
                />
              )
            }
          />
          <PlanCard
            name="Pro"
            price={`${centsToPrice(SUBSCRIPTION_PLANS.pro.priceCents)}/mes`}
            credits={`${SUBSCRIPTION_PLANS.pro.monthlyCredits.toLocaleString("es")} créditos al mes`}
            features={[
              "Todo lo de Básico",
              "Chat de inversión con IA",
              "El chat corre Montecarlo, comparaciones, backtests y recomendaciones por ti",
            ]}
            isCurrent={currentPlan === "pro"}
            action={
              currentPlan !== "pro" && (
                <CheckoutButton body={{ kind: "plan", id: "pro" }} label="Elegir Pro" />
              )
            }
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">
          Comprar créditos adicionales
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.values(CREDIT_PACKAGES).map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col p-5"
            >
              <p className="font-data text-xl font-semibold text-text">
                {pkg.credits.toLocaleString("es")}
              </p>
              <p className="text-sm text-text-muted">créditos</p>
              <p className="mt-3 font-data text-sm text-gold">
                {centsToPrice(pkg.priceCents)}
              </p>
              <div className="mt-4">
                <CheckoutButton
                  body={{ kind: "package", id: pkg.id }}
                  label="Comprar"
                  variant="secondary"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">
          Historial de transacciones
        </h2>
        <div className="mt-4 overflow-hidden">
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

function PlanCard({
  name,
  price,
  credits,
  features,
  isCurrent,
  action,
}: {
  name: string;
  price: string;
  credits: string;
  features: string[];
  isCurrent: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-5 ${
        isCurrent ? "border-green-bright bg-surface-2" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-display font-medium text-text">{name}</p>
        {isCurrent && <Badge tone="green">Tu plan</Badge>}
      </div>
      <p className="mt-2 font-data text-lg text-text">{price}</p>
      <p className="mt-1 text-xs text-gold">{credits}</p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {features.map((feature) => (
          <li key={feature} className="text-xs text-text-muted">
            · {feature}
          </li>
        ))}
      </ul>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
