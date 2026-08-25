import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import {
  CREDIT_PACKAGES,
  STRIPE_CURRENCY,
  SUBSCRIPTION_PLANS,
  type CreditPackageId,
  type SubscriptionPlanId,
} from "@/lib/stripe/config";
import type { Profile } from "@/types/database";

type CheckoutBody =
  | { kind: "plan"; id: SubscriptionPlanId }
  | { kind: "package"; id: CreditPackageId };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body || (body.kind !== "plan" && body.kind !== "package")) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe no está configurado." },
      { status: 503 },
    );
  }

  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (body.kind === "plan") {
    const plan = SUBSCRIPTION_PLANS[body.id];
    if (!plan) {
      return NextResponse.json({ error: "Plan desconocido." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: { name: `Alfia — Plan ${plan.name}` },
          },
          quantity: 1,
        },
      ],
      metadata: { user_id: user.id, kind: "plan", plan_id: plan.id },
      subscription_data: {
        metadata: { user_id: user.id, plan_id: plan.id },
      },
      success_url: `${siteUrl}/creditos?checkout=exito`,
      cancel_url: `${siteUrl}/creditos?checkout=cancelado`,
    });

    return NextResponse.json({ url: session.url });
  }

  const pkg = CREDIT_PACKAGES[body.id];
  if (!pkg) {
    return NextResponse.json({ error: "Paquete desconocido." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: pkg.priceCents,
          product_data: { name: `Alfia — Paquete de ${pkg.credits} créditos` },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      kind: "package",
      package_id: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: `${siteUrl}/creditos?checkout=exito`,
    cancel_url: `${siteUrl}/creditos?checkout=cancelado`,
  });

  return NextResponse.json({ url: session.url });
}
