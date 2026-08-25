import { ReactNode } from "react";

type BadgeTone = "green" | "gold" | "neutral";

const tones: Record<BadgeTone, string> = {
  green: "bg-green/15 text-green-bright border-green/30",
  gold: "bg-gold/15 text-gold border-gold/30",
  neutral: "bg-surface-2 text-text-muted border-border",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium font-body ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
