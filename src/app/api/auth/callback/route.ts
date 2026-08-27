import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Sin código, o el código ya no es válido (expiró o ya se usó): en vez de
  // dejar al usuario sin explicación en la landing, lo mandamos a login con
  // un mensaje claro — su cuenta puede ya estar confirmada de un intento
  // anterior, así que "inicia sesión" es la salida correcta.
  return NextResponse.redirect(`${origin}/login?confirmacion=invalida`);
}
