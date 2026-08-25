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
    description: "Para explorar Alfia y probar el chat de inversión.",
    credits: "20 créditos de bienvenida",
    cta: "Empezar gratis",
  },
  {
    name: "Básico",
    price: "$9",
    period: "/mes",
    description: "Para quien sigue el mercado con regularidad.",
    credits: "300 créditos al mes",
    cta: "Elegir Básico",
    featured: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mes",
    description: "Para análisis frecuente, comparaciones y simulaciones.",
    credits: "1,200 créditos al mes",
    cta: "Elegir Pro",
  },
];

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
    </section>
  );
}
