"use client";

import { InfoModal } from "@/components/ui/info-modal";

export function UpdatedAt({ iso }: { iso: string | null }) {
  const label = iso
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso))
    : null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted" suppressHydrationWarning>
      {label ? `Última actualización: ${label}` : "Todavía no se ha generado contenido para hoy."}
      <InfoModal title="¿Por qué no se ha actualizado?">
        El contenido de esta página se genera automáticamente 3 veces al día
        (en la apertura, a media sesión y al cierre del mercado de EE. UU.,
        horario de Nueva York) — fuera de esos horarios, o si el generador
        automático falló, seguirás viendo la última versión disponible en
        vez de un dato del momento. Los índices, sectores y movimientos de
        precio de abajo sí se recalculan en cada visita con el último precio
        disponible.
      </InfoModal>
    </span>
  );
}
