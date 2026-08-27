import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currencyPref: string | undefined = body?.currencyPref;

  if (currencyPref !== "usd" && currencyPref !== "mxn") {
    return NextResponse.json({ error: "Moneda inválida." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ currency_pref: currencyPref })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
