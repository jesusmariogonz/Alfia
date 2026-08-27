import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ErrorBanner({
  message,
  showCreditsCta,
}: {
  message: string;
  showCreditsCta?: boolean;
}) {
  return (
    <div className="rounded-lg border border-data-down/30 bg-data-down/10 px-4 py-3 text-sm text-data-down">
      <p>{message}</p>
      {showCreditsCta && (
        <Link href="/creditos" className="mt-2 inline-block">
          <Button variant="secondary" className="!border-data-down/40">
            Ir a Créditos
          </Button>
        </Link>
      )}
    </div>
  );
}
