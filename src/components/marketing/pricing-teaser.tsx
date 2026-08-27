import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  credits: string;
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Para explorar Alfia: screener limitado y dashboard básico.",
    credits: "20 créditos de bienvenida",
    cta: "Empezar gratis",
  },
  {
    name: "Básico",
    price: "$9",
    period: "/mes",
    description: "Screener completo y Mi Portafolio, sin límites de producto.",
    credits: "300 créditos al mes",
    cta: "Elegir Básico",
    featured: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mes",
    description: "Todo lo de Básico, más el chat de IA que simula, compara y recomienda.",
    credits: "1,200 créditos al mes",
    cta: "Elegir Pro",
  },
];

type FeatureRow = {
  label: string;
  free: boolean | string;
  basico: boolean | string;
  pro: boolean | string;
};

const featureRows: FeatureRow[] = [
  { label: "Screener de activos", free: "6 activos", basico: "Completo", pro: "Completo" },
  { label: "Indicadores avanzados (medias móviles, velas)", free: false, basico: true, pro: true },
  { label: "Mi Portafolio (posiciones, riesgo, correlación)", free: false, basico: true, pro: true },
  { label: "Dashboard con noticias y resumen diario", free: "Reducido", basico: "Completo", pro: "Completo" },
  { label: "Chat de inversión con IA", free: false, basico: false, pro: true },
  { label: "Montecarlo, comparador y backtest (vía el chat)", free: false, basico: false, pro: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="font-data text-sm text-text">{value}</span>;
  }
  return value ? (
    <span className="font-data text-lg text-green-bright" aria-label="Incluido">
      ✓
    </span>
  ) : (
    <span className="font-data text-lg text-text-muted" aria-label="No incluido">
      —
    </span>
  );
}

export function PricingTeaser() {
  return (
    <section id="precios" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
          Paga solo por lo que consultas
        </h2>
        <p className="mt-4 text-text-muted">
          Cada plan incluye créditos mensuales. También puedes comprar paquetes de
          créditos adicionales cuando los necesites.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-7 ${
              plan.featured
                ? "border-green-bright bg-surface-2"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-text">
                {plan.name}
              </h3>
              {plan.featured && <Badge tone="green">Más popular</Badge>}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-data text-3xl font-semibold text-text">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-text-muted">{plan.period}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-text-muted">{plan.description}</p>
            <p className="mt-4 font-data text-sm text-gold">{plan.credits}</p>
            <Link href="/registro" className="mt-7">
              <Button
                variant={plan.featured ? "primary" : "secondary"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="px-5 py-3 font-medium">Qué incluye</th>
              <th className="px-5 py-3 text-center font-medium">Free</th>
              <th className="px-5 py-3 text-center font-medium">Básico</th>
              <th className="px-5 py-3 text-center font-medium">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {featureRows.map((row) => (
              <tr key={row.label}>
                <td className="px-5 py-3 text-text">{row.label}</td>
                <td className="px-5 py-3 text-center">
                  <Cell value={row.free} />
                </td>
                <td className="px-5 py-3 text-center">
                  <Cell value={row.basico} />
                </td>
                <td className="px-5 py-3 text-center">
                  <Cell value={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
