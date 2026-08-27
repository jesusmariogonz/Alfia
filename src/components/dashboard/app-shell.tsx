import { Sidebar } from "@/components/dashboard/sidebar";
import { CreditChip } from "@/components/dashboard/credit-chip";

export function AppShell({
  email,
  creditBalance,
  children,
}: {
  email: string;
  creditBalance: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm text-text-muted">{email}</p>
          <CreditChip balance={creditBalance} />
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
