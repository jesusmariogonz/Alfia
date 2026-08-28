"use client";

import { useEffect, useState } from "react";

function nyParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

/** Convierte un año/mes/día + 09:30 hora de Nueva York al instante UTC real (ajusta DST). */
function nyWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  let guess = new Date(Date.UTC(year, month, day, hour, minute));
  for (let i = 0; i < 3; i++) {
    const got = nyParts(guess);
    const gotMinutes = got.hour * 60 + got.minute;
    const wantMinutes = hour * 60 + minute;
    const diff = wantMinutes - gotMinutes;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff * 60_000);
  }
  return guess;
}

function computeStatus(now: Date) {
  const { weekday, hour, minute } = nyParts(now);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const minutesNow = hour * 60 + minute;
  const openMinutes = 9 * 60 + 30;
  const closeMinutes = 16 * 60;

  const isOpen = isWeekday && minutesNow >= openMinutes && minutesNow < closeMinutes;

  const localFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isOpen) {
    return { open: true, label: "Mercado abierto" };
  }

  // Busca el próximo día hábil: hoy mismo si aún no abrió, si no el
  // siguiente día de Lun-Vie más cercano.
  const startOffset = isWeekday && minutesNow < openMinutes ? 0 : 1;
  let daysAhead = startOffset;
  for (let i = startOffset; i < startOffset + 7; i++) {
    const candidate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    if (!["Sat", "Sun"].includes(nyParts(candidate).weekday)) {
      daysAhead = i;
      break;
    }
  }

  const target = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // Año/mes/día en NY del día objetivo, para anclar correctamente la apertura de 9:30.
  const nyDateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const dateParts = nyDateFmt.formatToParts(target);
  const y = Number(dateParts.find((p) => p.type === "year")?.value);
  const m = Number(dateParts.find((p) => p.type === "month")?.value) - 1;
  const d = Number(dateParts.find((p) => p.type === "day")?.value);

  const nextOpenUtc = nyWallTimeToUtc(y, m, d, 9, 30);

  return { open: false, label: `Cerrado · abre ${localFmt.format(nextOpenUtc)}` };
}

export function MarketStatus() {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    function update() {
      setStatus(computeStatus(new Date()));
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-data-up" : "bg-text-muted"}`} />
      {status.label}
    </span>
  );
}
