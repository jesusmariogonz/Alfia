import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset } from "@/lib/market-data";

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
