import type { Plan } from "@/types/database";

export type SubscriptionPlanId = Extract<Plan, "basico" | "pro">;

export type SubscriptionPlanConfig = {
  id: SubscriptionPlanId;
  name: string;
  priceCents: number;
  monthlyCredits: number;
};

/**
 * Definición de los planes de suscripción. Los precios se envían a Stripe
 * como `price_data` inline (sin necesidad de precrear Products/Prices en el
 * dashboard) para simplificar el arranque; se puede migrar a IDs de Price
 * fijos más adelante si se necesita más control de facturación.
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  basico: { id: "basico", name: "Básico", priceCents: 900, monthlyCredits: 300 },
  pro: { id: "pro", name: "Pro", priceCents: 2900, monthlyCredits: 1200 },
};

export type CreditPackageId = "pack_100" | "pack_500" | "pack_1500";

export type CreditPackageConfig = {
  id: CreditPackageId;
  credits: number;
  priceCents: number;
};

export const CREDIT_PACKAGES: Record<CreditPackageId, CreditPackageConfig> = {
  pack_100: { id: "pack_100", credits: 100, priceCents: 500 },
  pack_500: { id: "pack_500", credits: 500, priceCents: 2000 },
  pack_1500: { id: "pack_1500", credits: 1500, priceCents: 5000 },
};

export const STRIPE_CURRENCY = "usd";
