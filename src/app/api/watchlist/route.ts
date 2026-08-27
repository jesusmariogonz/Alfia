import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getQuote } from "@/lib/market-data";
import { canOpenPositions } from "@/lib/plan";
import type { Profile } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const symbol: string | undefined = body?.symbol;
  const asset = symbol ? findAsset(symbol) : undefined;

  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }

  const { error } = await supabase
    .from("watchlist_items")
    .insert({ user_id: user.id, symbol: asset.symbol });

  if (error && error.code !== "23505") {
    // 23505 = ya estaba en la watchlist, lo tratamos como éxito idempotente
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const symbol: string | undefined = body?.symbol;
  const investedUsd = body?.investedUsd;
  const alertThresholdPct = body?.alertThresholdPct;
  const asset = symbol ? findAsset(symbol) : undefined;

  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }
  if (
    investedUsd !== undefined &&
    investedUsd !== null &&
    (typeof investedUsd !== "number" || investedUsd < 0)
  ) {
    return NextResponse.json(
      { error: "El monto invertido debe ser un número positivo." },
      { status: 400 },
    );
  }
  if (
    alertThresholdPct !== undefined &&
    alertThresholdPct !== null &&
    (typeof alertThresholdPct !== "number" || alertThresholdPct <= 0)
  ) {
    return NextResponse.json(
      { error: "El umbral de alerta debe ser un número positivo." },
      { status: 400 },
    );
  }

  if (investedUsd !== undefined && investedUsd !== null) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();

    if (!canOpenPositions(profile?.plan ?? "free")) {
      return NextResponse.json(
        { error: "Abrir posiciones es una función de los planes Básico y Pro." },
        { status: 403 },
      );
    }
  }

  const patch: Record<string, unknown> = { user_id: user.id, symbol: asset.symbol };
  if (investedUsd !== undefined) patch.invested_usd = investedUsd;
  if (alertThresholdPct !== undefined) {
    patch.alert_threshold_pct = alertThresholdPct;
    if (alertThresholdPct !== null) {
      const quote = await getQuote(asset.symbol);
      patch.alert_reference_price = quote?.price ?? null;
      patch.alert_last_triggered_at = null;
    } else {
      patch.alert_reference_price = null;
    }
  }

  // Upsert: si el activo no estaba en la watchlist, esto también lo agrega
  // — así "agregar una posición" funciona aunque el usuario no lo haya
  // seguido antes.
  const { error } = await supabase
    .from("watchlist_items")
    .upsert(patch, { onConflict: "user_id,symbol" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Falta el símbolo." }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("symbol", symbol.toUpperCase());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
