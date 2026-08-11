"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthAwareCtasProps = {
  variant?: "candidate" | "recruiter";
  size?: "default" | "lg";
  className?: string;
};

export function AuthAwareCtas({
  variant = "candidate",
  size = "lg",
  className,
}: AuthAwareCtasProps) {
  const { status } = useSession();
  const authenticated = status === "authenticated";

  if (variant === "recruiter") {
    if (authenticated) {
      return (
        <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
          <Button asChild variant="accent" size={size}>
            <Link href="/company">
              Open hiring workspace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size={size}>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
        <Button asChild variant="accent" size={size}>
          <Link href="/sign-up?callbackUrl=%2Fcompany">
            Start hiring — free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size={size}>
          <Link href="#how-it-works">See how it works</Link>
        </Button>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
        <Button asChild variant="accent" size={size}>
          <Link href="/dashboard">
            Go to dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size={size}>
          <Link href="/recruiters">Hiring</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
      <Button asChild variant="accent" size={size}>
        <Link href="/sign-up">
          Get started — it&apos;s free
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <Button asChild variant="outline" size={size}>
        <Link href="#showcase">
          See examples
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}