"use client";

import { useState } from "react";
import { ScreenerTable, type ScreenerRow } from "@/components/analytics/screener-table";
import { ScreenerComparisonPanel } from "@/components/analytics/screener-comparison-panel";
import type { Plan } from "@/types/database";

const FREE_MAX_COMPARE = 3;

export function ScreenerClient({ rows, plan }: { rows: ScreenerRow[]; plan: Plan }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const maxSelectable = plan === "free" ? FREE_MAX_COMPARE : null;

  function toggle(symbol: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else if (maxSelectable === null || next.size < maxSelectable) {
        next.add(symbol);
      }
      return next;
    });
  }

  return (
    <div>
      <ScreenerTable
        rows={rows}
        selected={selected}
        onToggle={toggle}
        maxSelectable={maxSelectable}
      />
      <ScreenerComparisonPanel rows={rows} selected={selected} plan={plan} />
    </div>
  );
}
