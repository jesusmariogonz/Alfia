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
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function computeStatus(now: Date) {
  const { weekday, hour, minute } = nyParts(now);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const minutesNow = hour * 60 + minute;
  const open = 9 * 60 + 30;
  const close = 16 * 60;

  const isOpen = isWeekday && minutesNow >= open && minutesNow < close;

  if (isOpen) {
    return { open: true, label: "Mercado abierto" };
  }

  // Próxima apertura: hoy si aún no abre y es día hábil, si no el próximo lunes (aprox.).
  const localFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  let daysAhead = 0;
  if (isWeekday && minutesNow < open) {
    daysAhead = 0;
  } else {
    daysAhead = 1;
    let checkWeekday = weekday;
    while (true) {
      const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(checkWeekday);
      const nextIdx = (idx + 1) % 7;
      checkWeekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][nextIdx];
      if (!["Sat", "Sun"].includes(checkWeekday)) break;
      daysAhead++;
    }
  }

  const nextOpenNy = new Date(now.getTime());
  nextOpenNy.setDate(nextOpenNy.getDate() + daysAhead);
  // Aproxima la apertura en hora NY a la hora local del visitante restando el offset actual.
  const nyNow = nyParts(now);
  const offsetMinutes = (nyNow.hour * 60 + nyNow.minute) - (now.getHours() * 60 + now.getMinutes());
  const nextOpenLocal = new Date(nextOpenNy.getTime());
  nextOpenLocal.setHours(9, 30, 0, 0);
  nextOpenLocal.setMinutes(nextOpenLocal.getMinutes() - offsetMinutes);

  return { open: false, label: `Cerrado · abre ${localFmt.format(nextOpenLocal)}` };
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
      {status.label} (hora NY, mercado de EE. UU.)
    </span>
  );
}
