import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { grantCredits } from "@/lib/credits";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/stripe/config";
import type { Profile } from "@/types/database";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook de Stripe no configurado." },
      { status: 503 },
    );
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firma inválida";
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const kind = session.metadata?.kind;
      if (!userId) break;

      if (kind === "plan") {
        const planId = session.metadata?.plan_id as SubscriptionPlanId | undefined;
        const plan = planId ? SUBSCRIPTION_PLANS[planId] : undefined;
        if (!plan) break;

        await grantCredits(admin, {
          userId,
          amount: plan.monthlyCredits,
          reason: "suscripcion",
          metadata: { plan: plan.id, event: "checkout.session.completed" },
        });

        await admin
          .from("profiles")
          .update({
            plan: plan.id,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          })
          .eq("id", userId);
      }

      if (kind === "package") {
        const credits = Number(session.metadata?.credits ?? 0);
        if (credits > 0) {
          await grantCredits(admin, {
            userId,
            amount: credits,
            reason: "compra_paquete",
            metadata: {
              package: session.metadata?.package_id,
              event: "checkout.session.completed",
            },
          });
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== "subscription_cycle") break;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single<Profile>();

      if (!profile || profile.plan === "free") break;

      const plan = SUBSCRIPTION_PLANS[profile.plan as "basico" | "pro"];
      if (!plan) break;

      await grantCredits(admin, {
        userId: profile.id,
        amount: plan.monthlyCredits,
        reason: "suscripcion",
        metadata: { plan: plan.id, event: "invoice.payment_succeeded" },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      if (!customerId) break;

      await admin
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
