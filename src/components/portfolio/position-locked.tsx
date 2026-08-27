import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PositionLocked() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)] p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text">Abrir posición</p>
        <Badge tone="gold">Básico o Pro</Badge>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        Registrar cuánto tienes invertido y reunirlo en Mi Portafolio es una
        función de los planes pagados.
      </p>
      <Link href="/creditos" className="mt-3 inline-block">
        <Button variant="secondary">Ver planes</Button>
      </Link>
    </div>
  );
}
