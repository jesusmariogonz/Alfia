import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { IndicesStrip } from "@/components/dashboard/indices-strip";
import { MarketStatus } from "@/components/dashboard/market-status";
import { LocalClock } from "@/components/dashboard/local-clock";

export function AppShell({
  email,
  children,
}: {
  email: string;
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
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg/70 px-6 py-4 backdrop-blur">
          <p className="text-sm text-text-muted">{email}</p>
          <div className="flex items-center gap-4">
            <LocalClock />
            <MarketStatus />
          </div>
        </header>
        <IndicesStrip />
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
