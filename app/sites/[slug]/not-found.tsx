import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PortfolioNotFound() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 bg-surface-base px-6 text-center">
      <h1 className="text-display text-text-primary">404</h1>
      <p className="text-body-lg text-text-secondary">
        This portfolio doesn&apos;t exist or isn&apos;t published yet.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
