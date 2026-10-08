import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/features/landing/components/landing-nav";

export default function NotFound() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-base">
      <LandingNav />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-h2 text-text-primary">Page not found</h1>
        <p className="text-body-sm text-text-secondary">
          This page doesn&apos;t exist or the link is incorrect.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
