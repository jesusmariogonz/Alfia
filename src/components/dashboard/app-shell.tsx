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
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 40% at 15% -10%, rgba(52,199,123,0.08), transparent 60%), radial-gradient(50% 30% at 100% 0%, rgba(217,169,78,0.05), transparent 60%)",
        }}
      />
      <MobileNav />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-bg/70 px-6 py-4 backdrop-blur">
          <p className="text-sm text-text-muted">{email}</p>
          {plan === "pro" ? <CreditChip balance={creditBalance} /> : null}
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
