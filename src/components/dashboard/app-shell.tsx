import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { CreditChip } from "@/components/dashboard/credit-chip";
import type { Plan } from "@/types/database";

export function AppShell({
  email,
  creditBalance,
  plan,
  children,
}: {
  email: string;
  creditBalance: number;
  plan?: Plan;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileNav />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm text-text-muted">{email}</p>
          {plan === "pro" ? <CreditChip balance={creditBalance} /> : null}
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
