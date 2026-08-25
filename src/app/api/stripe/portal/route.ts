import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import type { Profile } from "@/types/database";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Todavía no tienes una suscripción o compra registrada." },
      { status: 400 },
    );
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/creditos`,
  });

  return NextResponse.json({ url: session.url });
}
