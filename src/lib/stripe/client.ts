import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY no está configurada. Agrégala a tu .env.local para habilitar pagos.",
    );
  }
  if (!client) client = new Stripe(apiKey);
  return client;
}
