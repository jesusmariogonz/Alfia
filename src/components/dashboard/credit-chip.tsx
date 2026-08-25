import Link from "next/link";

export function CreditChip({ balance }: { balance: number }) {
  return (
    <Link
      href="/creditos"
      className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 transition-colors hover:bg-gold/15"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      <span className="font-data text-sm font-medium text-gold">
        {balance.toLocaleString("es")} créditos
      </span>
    </Link>
  );
}
