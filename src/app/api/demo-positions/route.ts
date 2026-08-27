import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getQuote } from "@/lib/market-data";

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
  const shares: number | undefined = body?.shares;
  const demoAmountUsd: number | undefined = body?.demoAmountUsd;
  const stopLossPrice: number | null = body?.stopLossPrice ?? null;
  const takeProfitPrice: number | null = body?.takeProfitPrice ?? null;

  const asset = symbol ? findAsset(symbol) : undefined;
  if (!asset) {
    return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
  }
  if (!shares || shares <= 0 || !demoAmountUsd || demoAmountUsd <= 0) {
    return NextResponse.json({ error: "Cantidad o monto inválido." }, { status: 400 });
  }

  const quote = await getQuote(asset.symbol);
  if (!quote) {
    return NextResponse.json({ error: "No se pudo obtener el precio actual." }, { status: 500 });
  }

  const { error } = await supabase.from("demo_positions").insert({
    user_id: user.id,
    symbol: asset.symbol,
    shares,
    entry_price: quote.price,
    demo_amount_usd: demoAmountUsd,
    stop_loss_price: stopLossPrice,
    take_profit_price: takeProfitPrice,
  });

  if (error) {
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
  const id: string | undefined = body?.id;
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }

  const { data: position } = await supabase
    .from("demo_positions")
    .select("symbol")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!position) {
    return NextResponse.json({ error: "Posición no encontrada." }, { status: 404 });
  }

  const quote = await getQuote(position.symbol);

  const { error } = await supabase
    .from("demo_positions")
    .update({
      status: "cerrada",
      closed_at: new Date().toISOString(),
      closed_price: quote?.price ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
