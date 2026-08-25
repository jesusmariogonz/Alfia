import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email?.trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_subscribers")
    .upsert(
      { email, user_id: user?.id ?? null, unsubscribed_at: null },
      { onConflict: "email" },
    );

  if (error) {
    return NextResponse.json({ error: "No se pudo completar la suscripción." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
